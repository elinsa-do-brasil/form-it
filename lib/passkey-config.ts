import type { PasskeyOptions } from "@better-auth/passkey";

type PasskeyEnvironmentInput = {
  betterAuthUrl?: string | null;
  publicUrl?: string | null;
  passkeyOrigins?: string | null;
  passkeyRpId?: string | null;
  passkeyRpName?: string | null;
};

const DEFAULT_PASSKEY_RP_NAME = "Raauth";

function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return null;
  }
}

function toHostname(origin: string): string | null {
  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

function uniqueOrigins(values: Array<string | null | undefined>): string[] {
  const normalized = values
    .map((value) => (value ? normalizeOrigin(value) : null))
    .filter((value): value is string => Boolean(value));

  return [...new Set(normalized)];
}

export function buildPasskeyOptions(
  input: PasskeyEnvironmentInput,
): PasskeyOptions {
  const envOrigins = (input.passkeyOrigins ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const origins = uniqueOrigins([
    input.betterAuthUrl ?? undefined,
    input.publicUrl ?? undefined,
    ...envOrigins,
  ]);

  const fallbackRpId = origins.length > 0 ? toHostname(origins[0]) : null;
  const rpID = input.passkeyRpId?.trim() || fallbackRpId || "localhost";
  const rpName = input.passkeyRpName?.trim() || DEFAULT_PASSKEY_RP_NAME;

  const options: PasskeyOptions = {
    rpID,
    rpName,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  };

  if (origins.length === 1) {
    options.origin = origins[0];
  } else if (origins.length > 1) {
    options.origin = origins;
  }

  return options;
}
