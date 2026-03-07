"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { normalizeUsername, validateUsername } from "@/lib/username-availability";
import { symmetricDecrypt, verifyPassword } from "better-auth/crypto";

type ActionError = {
  code: string;
  message?: string;
};

type ActionResult<T> = {
  data: T | null;
  error: ActionError | null;
};

type UsernameAvailabilityCacheEntry = {
  available: boolean;
  expiresAt: number;
};

const USERNAME_SERVER_CACHE_TTL_MS = 45_000;
const USERNAME_SERVER_CACHE_MAX_ENTRIES = 500;
const usernameAvailabilityServerCache = new Map<
  string,
  UsernameAvailabilityCacheEntry
>();

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return null;
}

function readPathString(
  value: unknown,
  path: readonly string[],
): string | undefined {
  let current: unknown = value;

  for (const key of path) {
    const record = asRecord(current);

    if (!record || !(key in record)) {
      return undefined;
    }

    current = record[key];
  }

  if (typeof current !== "string" || current.trim().length === 0) {
    return undefined;
  }

  return current;
}

function resolveCallbackURL(callbackURL?: string) {
  if (!callbackURL) {
    return undefined;
  }

  const trimmedURL = callbackURL.trim();

  if (!trimmedURL) {
    return undefined;
  }

  if (trimmedURL.startsWith("http://") || trimmedURL.startsWith("https://")) {
    return trimmedURL;
  }

  const baseURL = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_URL;

  if (!baseURL) {
    return trimmedURL;
  }

  try {
    return new URL(trimmedURL, baseURL).toString();
  } catch {
    return trimmedURL;
  }
}

function mapActionError(error: unknown): ActionError {
  const code =
    readPathString(error, ["body", "code"]) ||
    readPathString(error, ["error", "code"]) ||
    readPathString(error, ["cause", "code"]) ||
    readPathString(error, ["code"]) ||
    "UNKNOWN_ERROR";

  const message =
    readPathString(error, ["body", "message"]) ||
    readPathString(error, ["error", "message"]) ||
    readPathString(error, ["cause", "message"]) ||
    readPathString(error, ["message"]);

  return {
    code,
    message,
  };
}

function getCachedUsernameAvailability(
  username: string,
): { available: boolean } | null {
  const now = Date.now();
  const cached = usernameAvailabilityServerCache.get(username);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= now) {
    usernameAvailabilityServerCache.delete(username);
    return null;
  }

  return {
    available: cached.available,
  };
}

function setCachedUsernameAvailability(username: string, available: boolean) {
  if (usernameAvailabilityServerCache.size >= USERNAME_SERVER_CACHE_MAX_ENTRIES) {
    const oldestKey = usernameAvailabilityServerCache.keys().next().value;

    if (oldestKey) {
      usernameAvailabilityServerCache.delete(oldestKey);
    }
  }

  usernameAvailabilityServerCache.set(username, {
    available,
    expiresAt: Date.now() + USERNAME_SERVER_CACHE_TTL_MS,
  });
}

function ok<T>(data: T): ActionResult<T> {
  return {
    data,
    error: null,
  };
}

function fail<T>(error: unknown): ActionResult<T> {
  return {
    data: null,
    error: mapActionError(error),
  };
}

function parseDateToISO(value: Date | string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function parseBackupCodes(value: string): string[] | null {
  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const normalized = parsed.filter(
      (code): code is string =>
        typeof code === "string" && code.trim().length > 0,
    );

    return normalized.length > 0 ? normalized : null;
  } catch {
    return null;
  }
}

async function resolveCredentialAccount(userId: string) {
  return db.account.findFirst({
    where: {
      userId,
      providerId: "credential",
    },
    select: {
      password: true,
    },
  });
}

async function getAuthenticatedUserId(): Promise<string> {
  const currentSession = await auth.api.getSession({
    headers: await headers(),
  });

  const userId = currentSession?.user?.id;

  if (!userId) {
    throw {
      code: "UNAUTHORIZED",
    };
  }

  return userId;
}

async function assertPasswordForSensitiveAction(userId: string, password: string) {
  const credentialAccount = await resolveCredentialAccount(userId);

  if (!credentialAccount?.password) {
    throw {
      code: "CREDENTIAL_ACCOUNT_NOT_FOUND",
    };
  }

  const valid = await verifyPassword({
    hash: credentialAccount.password,
    password,
  });

  if (!valid) {
    throw {
      code: "INVALID_PASSWORD",
    };
  }
}

export async function checkUsernameAvailabilityAction(input: {
  username: string;
}): Promise<ActionResult<{ available: boolean }>> {
  const normalizedUsername = normalizeUsername(input.username);
  const validation = validateUsername(normalizedUsername);

  if (!validation.isValid) {
    return ok({
      available: false,
    });
  }

  const cached = getCachedUsernameAvailability(normalizedUsername);

  if (cached) {
    return ok(cached);
  }

  try {
    const data = await auth.api.isUsernameAvailable({
      body: {
        username: normalizedUsername,
      },
      headers: await headers(),
    });

    setCachedUsernameAvailability(normalizedUsername, data.available);

    return ok({
      available: data.available,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function updateProfileAction(input: {
  name: string;
  image?: string;
  username?: string;
}): Promise<ActionResult<{ status: boolean }>> {
  const name = input.name.trim();
  const image = input.image?.trim();
  const normalizedUsername = normalizeUsername(input.username ?? "");

  if (!name) {
    return {
      data: null,
      error: {
        code: "INVALID_INPUT",
      },
    };
  }

  if (normalizedUsername) {
    const validation = validateUsername(normalizedUsername);

    if (!validation.isValid) {
      return {
        data: null,
        error: {
          code: "INVALID_USERNAME",
        },
      };
    }
  }

  if (image) {
    try {
      new URL(image);
    } catch {
      return {
        data: null,
        error: {
          code: "INVALID_IMAGE_URL",
        },
      };
    }
  }

  try {
    const data = await auth.api.updateUser({
      body: {
        name,
        image,
        username: normalizedUsername || undefined,
      },
      headers: await headers(),
    });

    if (normalizedUsername) {
      setCachedUsernameAvailability(normalizedUsername, true);
    }

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<ActionResult<{ token: string | null }>> {
  try {
    const data = await auth.api.changePassword({
      body: {
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
        revokeOtherSessions: true,
      },
      headers: await headers(),
    });

    return ok({
      token: data.token,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function setPasswordAction(input: {
  newPassword: string;
}): Promise<ActionResult<{ status: boolean }>> {
  try {
    const data = await auth.api.setPassword({
      body: {
        newPassword: input.newPassword,
      },
      headers: await headers(),
    });

    return ok(data);
  } catch (error) {
    const mapped = mapActionError(error);

    if (
      mapped.code === "BAD_REQUEST" &&
      mapped.message?.toLowerCase().includes("already has a password")
    ) {
      return {
        data: null,
        error: {
          code: "PASSWORD_ALREADY_DEFINED",
        },
      };
    }

    return {
      data: null,
      error: mapped,
    };
  }
}

export async function changeEmailAction(input: {
  newEmail: string;
  callbackURL?: string;
}): Promise<ActionResult<{ status: boolean }>> {
  try {
    const data = await auth.api.changeEmail({
      body: {
        newEmail: input.newEmail.trim(),
        callbackURL: resolveCallbackURL(input.callbackURL),
      },
      headers: await headers(),
    });

    return ok({ status: data.status });
  } catch (error) {
    return fail(error);
  }
}

export async function deleteAccountAction(input: {
  password: string;
}): Promise<ActionResult<{ success: boolean; message: string }>> {
  try {
    const data = await auth.api.deleteUser({
      body: {
        password: input.password,
      },
      headers: await headers(),
    });

    if (!data.success) {
      return {
        data: null,
        error: {
          code: "DELETE_USER_FAILED",
          message: data.message,
        },
      };
    }

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function enableTwoFactorAction(input: {
  password: string;
}): Promise<ActionResult<{ totpURI: string; backupCodes: string[] }>> {
  try {
    const data = await auth.api.enableTwoFactor({
      body: {
        password: input.password,
      },
      headers: await headers(),
    });

    return ok({
      totpURI: data.totpURI,
      backupCodes: data.backupCodes,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function disableTwoFactorAction(input: {
  password: string;
}): Promise<ActionResult<{ status: boolean }>> {
  try {
    const data = await auth.api.disableTwoFactor({
      body: {
        password: input.password,
      },
      headers: await headers(),
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function listPasskeysAction(): Promise<
  ActionResult<
    Array<{
      id: string;
      name?: string | null;
      createdAt?: string | Date | null;
      deviceType?: string | null;
      backedUp?: boolean;
    }>
  >
> {
  try {
    const data = await auth.api.listPasskeys({
      headers: await headers(),
    });

    return ok(
      data.map((passkey) => ({
        id: passkey.id,
        name: passkey.name ?? null,
        createdAt: passkey.createdAt ?? null,
        deviceType: passkey.deviceType ?? null,
        backedUp: passkey.backedUp ?? undefined,
      })),
    );
  } catch (error) {
    return fail(error);
  }
}

export async function deletePasskeyAction(input: {
  id: string;
}): Promise<ActionResult<{ status: boolean }>> {
  try {
    const data = await auth.api.deletePasskey({
      body: {
        id: input.id,
      },
      headers: await headers(),
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function listActiveSessionsAction(): Promise<
  ActionResult<{
    currentSessionToken: string | null;
    sessions: Array<{
      id: string;
      token: string;
      createdAt: string | null;
      updatedAt: string | null;
      expiresAt: string | null;
      ipAddress: string | null;
      userAgent: string | null;
    }>;
  }>
> {
  try {
    const currentSession = await auth.api.getSession({
      headers: await headers(),
    });

    if (!currentSession?.user?.id) {
      return {
        data: null,
        error: {
          code: "UNAUTHORIZED",
        },
      };
    }

    const sessions = await auth.api.listSessions({
      headers: await headers(),
    });

    const normalizedSessions = [...sessions]
      .sort((a, b) => {
        const left = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
        const right = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();

        return left - right;
      })
      .map((session) => ({
        id: session.id,
        token: session.token,
        createdAt: parseDateToISO(session.createdAt),
        updatedAt: parseDateToISO(session.updatedAt),
        expiresAt: parseDateToISO(session.expiresAt),
        ipAddress: session.ipAddress ?? null,
        userAgent: session.userAgent ?? null,
      }));

    return ok({
      currentSessionToken: currentSession.session?.token ?? null,
      sessions: normalizedSessions,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function revokeSessionAction(input: {
  token: string;
}): Promise<ActionResult<{ status: boolean }>> {
  try {
    const data = await auth.api.revokeSession({
      body: {
        token: input.token,
      },
      headers: await headers(),
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function revokeOtherSessionsAction(): Promise<
  ActionResult<{ status: boolean }>
> {
  try {
    const data = await auth.api.revokeOtherSessions({
      headers: await headers(),
    });

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}

export async function getTwoFactorRecoveryCodesAction(input: {
  password: string;
}): Promise<ActionResult<{ backupCodes: string[] }>> {
  const password = input.password.trim();

  if (!password) {
    return {
      data: null,
      error: {
        code: "INVALID_PASSWORD",
      },
    };
  }

  try {
    const userId = await getAuthenticatedUserId();
    await assertPasswordForSensitiveAction(userId, password);

    const twoFactorData = await db.twoFactor.findFirst({
      where: {
        userId,
      },
      select: {
        backupCodes: true,
      },
    });

    if (!twoFactorData?.backupCodes) {
      return {
        data: null,
        error: {
          code: "TWO_FACTOR_NOT_ENABLED",
        },
      };
    }

    const secret =
      process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "";

    if (!secret) {
      return {
        data: null,
        error: {
          code: "RECOVERY_CODES_UNAVAILABLE",
        },
      };
    }

    let decryptedBackupCodesPayload: string | null = null;

    try {
      decryptedBackupCodesPayload = await symmetricDecrypt({
        key: secret,
        data: twoFactorData.backupCodes,
      });
    } catch {
      decryptedBackupCodesPayload = null;
    }

    const backupCodes =
      parseBackupCodes(twoFactorData.backupCodes) ||
      (decryptedBackupCodesPayload
        ? parseBackupCodes(decryptedBackupCodesPayload)
        : null);

    if (!backupCodes) {
      return {
        data: null,
        error: {
          code: "RECOVERY_CODES_UNAVAILABLE",
        },
      };
    }

    return ok({
      backupCodes,
    });
  } catch (error) {
    return fail(error);
  }
}

export async function regenerateTwoFactorRecoveryCodesAction(input: {
  password: string;
}): Promise<ActionResult<{ backupCodes: string[] }>> {
  try {
    const data = await auth.api.generateBackupCodes({
      body: {
        password: input.password,
      },
      headers: await headers(),
    });

    return ok({
      backupCodes: data.backupCodes,
    });
  } catch (error) {
    return fail(error);
  }
}
