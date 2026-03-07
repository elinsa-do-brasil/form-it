export const CREDENTIAL_PROVIDER_ID = "credential";

type AccountMethodInput = {
  providerId: string;
  createdAt?: Date | string | null;
  password?: string | null;
};

export type AccountAuthInsights = {
  hasPassword: boolean;
  hasSocialLogin: boolean;
  createdWithSocialLogin: boolean;
  primaryProvider: string | null;
  socialProviders: string[];
  passkeysCount: number;
};

export type AccountSecurityState = {
  score: number;
  label: "Baixo" | "Médio" | "Alto" | "Muito alto";
  factors: {
    emailVerified: boolean;
    hasPassword: boolean;
    twoFactorEnabled: boolean;
    hasPasskeys: boolean;
    hasSocialLogin: boolean;
  };
};

const providerLabels: Record<string, string> = {
  credential: "Senha",
  google: "Google",
  github: "GitHub",
  microsoft: "Microsoft",
};

function toTimestamp(value: Date | string | null | undefined) {
  if (!value) {
    return Number.MAX_SAFE_INTEGER;
  }

  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();

  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

export function getProviderLabel(providerId: string) {
  const normalized = providerId.trim().toLowerCase();
  const knownLabel = providerLabels[normalized];

  if (knownLabel) {
    return knownLabel;
  }

  if (!normalized) {
    return "Desconhecido";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function extractAccountAuthInsights(
  accounts: AccountMethodInput[],
  passkeysCount: number,
): AccountAuthInsights {
  const hasPassword = accounts.some(
    (account) =>
      account.providerId === CREDENTIAL_PROVIDER_ID &&
      typeof account.password === "string" &&
      account.password.length > 0,
  );

  const socialProviders = Array.from(
    new Set(
      accounts
        .map((account) => account.providerId.trim().toLowerCase())
        .filter(
          (providerId) =>
            providerId.length > 0 && providerId !== CREDENTIAL_PROVIDER_ID,
        ),
    ),
  );

  const sortedByCreation = [...accounts].sort(
    (a, b) => toTimestamp(a.createdAt) - toTimestamp(b.createdAt),
  );
  const primaryProvider = sortedByCreation[0]?.providerId?.trim().toLowerCase() || null;
  const createdWithSocialLogin = Boolean(
    primaryProvider && primaryProvider !== CREDENTIAL_PROVIDER_ID,
  );

  return {
    hasPassword,
    hasSocialLogin: socialProviders.length > 0,
    createdWithSocialLogin,
    primaryProvider,
    socialProviders,
    passkeysCount,
  };
}

export function calculateAccountSecurityState(input: {
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  hasPassword: boolean;
  hasPasskeys: boolean;
  hasSocialLogin: boolean;
}): AccountSecurityState {
  let score = 10;

  if (input.emailVerified) {
    score += 25;
  }

  if (input.hasPassword) {
    score += 20;
  }

  if (input.twoFactorEnabled) {
    score += 30;
  }

  if (input.hasPasskeys) {
    score += 10;
  }

  if (input.hasSocialLogin) {
    score += 5;
  }

  if (input.twoFactorEnabled && input.hasPasskeys) {
    score += 10;
  }

  const clampedScore = Math.min(score, 100);

  if (clampedScore >= 85) {
    return {
      score: clampedScore,
      label: "Muito alto",
      factors: input,
    };
  }

  if (clampedScore >= 65) {
    return {
      score: clampedScore,
      label: "Alto",
      factors: input,
    };
  }

  if (clampedScore >= 40) {
    return {
      score: clampedScore,
      label: "Médio",
      factors: input,
    };
  }

  return {
    score: clampedScore,
    label: "Baixo",
    factors: input,
  };
}
