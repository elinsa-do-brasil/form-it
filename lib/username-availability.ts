export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const USERNAME_CACHE_TTL_MS = 2 * 60 * 1000;

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

type UsernameValidationReason =
  | "ok"
  | "empty"
  | "too_short"
  | "too_long"
  | "invalid_format";

type UsernameCacheEntry = {
  available: boolean;
  expiresAt: number;
};

const usernameAvailabilityCache = new Map<string, UsernameCacheEntry>();

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string): {
  isValid: boolean;
  reason: UsernameValidationReason;
} {
  if (!value) {
    return {
      isValid: false,
      reason: "empty",
    };
  }

  if (value.length < USERNAME_MIN_LENGTH) {
    return {
      isValid: false,
      reason: "too_short",
    };
  }

  if (value.length > USERNAME_MAX_LENGTH) {
    return {
      isValid: false,
      reason: "too_long",
    };
  }

  if (!USERNAME_PATTERN.test(value)) {
    return {
      isValid: false,
      reason: "invalid_format",
    };
  }

  return {
    isValid: true,
    reason: "ok",
  };
}

export function readCachedUsernameAvailability(
  value: string,
  now = Date.now(),
): { available: boolean } | null {
  const key = normalizeUsername(value);

  if (!key) {
    return null;
  }

  const cached = usernameAvailabilityCache.get(key);

  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= now) {
    usernameAvailabilityCache.delete(key);
    return null;
  }

  return { available: cached.available };
}

export function writeUsernameAvailabilityCache(
  value: string,
  available: boolean,
  now = Date.now(),
  ttlMs = USERNAME_CACHE_TTL_MS,
) {
  const key = normalizeUsername(value);

  if (!key) {
    return;
  }

  usernameAvailabilityCache.set(key, {
    available,
    expiresAt: now + ttlMs,
  });
}

export function clearUsernameAvailabilityCache() {
  usernameAvailabilityCache.clear();
}
