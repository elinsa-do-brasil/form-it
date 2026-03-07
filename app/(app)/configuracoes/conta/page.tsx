import { getCurrentUser } from "@/server/actions/session";
import { db } from "@/lib/db";
import {
  calculateAccountSecurityState,
  extractAccountAuthInsights,
} from "@/lib/account-security";
import { ProfileCard } from "./components/profile-card";
import { PasswordCard } from "./components/password-card";
import { PasskeysCard } from "./components/passkeys-card";
import { MfaCard } from "./components/mfa-card";
import { DangerZoneCard } from "./components/danger-zone-card";
import { AccountOverviewCard } from "./components/account-overview-card";
import { EmailCard } from "./components/email-card";
import { SocialLoginsCard } from "./components/social-logins-card";
import { RecoveryMethodsCard } from "./components/recovery-methods-card";
import { ActiveSessionsCard } from "./components/active-sessions-card";
import { SecurityAlertsCard } from "./components/security-alerts-card";

export default async function AccountSettingsPage() {
  const { currentUser, session } = await getCurrentUser();
  const [accounts, passkeysCount, sessions] = await Promise.all([
    db.account.findMany({
      where: { userId: currentUser.id },
      select: {
        providerId: true,
        createdAt: true,
        updatedAt: true,
        password: true,
      },
    }),
    db.passkey.count({
      where: { userId: currentUser.id },
    }),
    db.session.findMany({
      where: { userId: currentUser.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        token: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        ipAddress: true,
        userAgent: true,
      },
    }),
  ]);

  const authInsights = extractAccountAuthInsights(accounts, passkeysCount);
  const accountSecurity = calculateAccountSecurityState({
    emailVerified: Boolean(currentUser.emailVerified),
    twoFactorEnabled: Boolean(currentUser.twoFactorEnabled),
    hasPassword: authInsights.hasPassword,
    hasPasskeys: authInsights.passkeysCount > 0,
    hasSocialLogin: authInsights.hasSocialLogin,
  });
  const currentSessionToken = session?.token ?? null;
  const lastPasswordChangedAt =
    accounts.find(
      (account) =>
        account.providerId === "credential" &&
        typeof account.password === "string" &&
        account.password.length > 0,
    )?.updatedAt ?? null;
  const normalizedSessions = sessions.map((activeSession) => ({
    id: activeSession.id,
    token: activeSession.token,
    createdAt: activeSession.createdAt.toISOString(),
    updatedAt: activeSession.updatedAt.toISOString(),
    expiresAt: activeSession.expiresAt.toISOString(),
    ipAddress: activeSession.ipAddress ?? null,
    userAgent: activeSession.userAgent ?? null,
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Configurações da conta
        </h1>
        <p className="text-muted-foreground">
          Gerencie seus dados e a segurança da sua conta.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="space-y-6 lg:col-span-5">
          <AccountOverviewCard
            user={currentUser}
            security={accountSecurity}
            authInsights={authInsights}
          />
          <ProfileCard user={currentUser} />
          <EmailCard user={currentUser} />
          <SocialLoginsCard
            socialProviders={authInsights.socialProviders}
            primaryProvider={authInsights.primaryProvider}
            createdWithSocialLogin={authInsights.createdWithSocialLogin}
            hasPassword={authInsights.hasPassword}
          />
        </section>

        <section className="space-y-6 lg:col-span-7">
          <ActiveSessionsCard
            initialSessions={normalizedSessions}
            currentSessionToken={currentSessionToken}
          />
          <PasswordCard
            hasPassword={authInsights.hasPassword}
            createdWithSocialLogin={authInsights.createdWithSocialLogin}
            lastPasswordChangedAt={lastPasswordChangedAt}
          />
          <PasskeysCard />
          <MfaCard
            user={currentUser}
            hasPassword={authInsights.hasPassword}
            socialProviders={authInsights.socialProviders}
            hasPasskeys={authInsights.passkeysCount > 0}
          />
          <RecoveryMethodsCard
            emailVerified={Boolean(currentUser.emailVerified)}
            hasPassword={authInsights.hasPassword}
            hasSocialLogin={authInsights.hasSocialLogin}
            hasPasskeys={authInsights.passkeysCount > 0}
            twoFactorEnabled={Boolean(currentUser.twoFactorEnabled)}
          />
          <SecurityAlertsCard userId={currentUser.id} />
          <DangerZoneCard />
        </section>
      </div>
    </div>
  );
}
