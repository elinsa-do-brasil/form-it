"use client";

import type { ComponentType } from "react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { FaGithub, FaMicrosoft } from "react-icons/fa6";
import { FcGoogle } from "react-icons/fc";
import { CheckCircle2, CircleDashed, Link2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/errors";
import { getProviderLabel } from "@/lib/account-security";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type SocialLoginsCardProps = {
  socialProviders: string[];
  primaryProvider: string | null;
  createdWithSocialLogin: boolean;
  hasPassword: boolean;
};

type SocialProviderId = "google" | "github" | "microsoft";

type LinkSocialClient = {
  linkSocial: (input: {
    provider: SocialProviderId;
    callbackURL?: string;
  }) => Promise<{ error?: { code?: string; message?: string } | null }>;
};

const linkSocialClient = authClient as unknown as LinkSocialClient;

const providerConfig: Record<
  SocialProviderId,
  {
    label: string;
    Icon: ComponentType<{ className?: string }>;
    iconColor?: string;
    badgeClassName: string;
  }
> = {
  google: {
    label: "Google",
    Icon: FcGoogle,
    badgeClassName:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300",
  },
  github: {
    label: "GitHub",
    Icon: FaGithub,
    badgeClassName:
      "border-zinc-300 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100",
  },
  microsoft: {
    label: "Microsoft",
    Icon: FaMicrosoft,
    iconColor: "#00A4EF",
    badgeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-300",
  },
};

const supportedProviders: SocialProviderId[] = ["google", "github", "microsoft"];

function isSupportedProviderId(value: string): value is SocialProviderId {
  return supportedProviders.includes(value as SocialProviderId);
}

function getProviderUi(providerId: string) {
  const normalizedProviderId = providerId.trim().toLowerCase();

  if (isSupportedProviderId(normalizedProviderId)) {
    return {
      id: normalizedProviderId,
      ...providerConfig[normalizedProviderId],
    };
  }

  return {
    id: normalizedProviderId,
    label: getProviderLabel(normalizedProviderId),
    Icon: Link2,
    iconColor: "currentColor",
    badgeClassName:
      "border-muted-foreground/30 bg-muted/40 text-foreground",
  };
}

function getLinkSocialErrorMessage(error?: { code?: string; message?: string } | null) {
  if (!error) {
    return "Falha ao conectar provedor social.";
  }

  if (error.code === "UNAUTHORIZED") {
    return "Conexão não autorizada. Verifique seu e-mail atual para conectar provedores sociais.";
  }

  if (error.code) {
    return getErrorMessage(error.code);
  }

  return error.message ?? "Falha ao conectar provedor social.";
}

export function SocialLoginsCard({
  socialProviders,
  primaryProvider,
  createdWithSocialLogin,
  hasPassword,
}: SocialLoginsCardProps) {
  const [isLinkingProvider, setIsLinkingProvider] = useState<SocialProviderId | null>(
    null,
  );
  const primaryProviderUi = getProviderUi(primaryProvider ?? "");

  const normalizedConnectedProviders = useMemo(
    () => new Set(socialProviders.map((provider) => provider.trim().toLowerCase())),
    [socialProviders],
  );

  const providersToDisplay = useMemo(
    () =>
      Array.from(new Set([...supportedProviders, ...socialProviders])).map(
        (providerId) => getProviderUi(providerId),
      ),
    [socialProviders],
  );

  async function handleLinkProvider(providerId: SocialProviderId) {
    setIsLinkingProvider(providerId);

    try {
      const { error } = await linkSocialClient.linkSocial({
        provider: providerId,
        callbackURL: "/configuracoes/conta",
      });

      if (error) {
        toast.error(getLinkSocialErrorMessage(error));
      }
    } catch {
      toast.error("Não foi possível iniciar a conexão com o provedor.");
    } finally {
      setIsLinkingProvider(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="size-4" />
          Logins sociais
        </CardTitle>
        <CardDescription>
          Visualize provedores conectados e vincule outros serviços sociais.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {createdWithSocialLogin ? (
            <Badge className={primaryProviderUi.badgeClassName}>
              Conta criada com {primaryProviderUi.label}
            </Badge>
          ) : (
            <Badge className="border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/60 dark:bg-violet-950/30 dark:text-violet-300">
              Conta criada com e-mail e senha
            </Badge>
          )}

          <Badge
            className={
              hasPassword
                ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300"
            }
          >
            {hasPassword ? "Senha local definida" : "Sem senha local"}
          </Badge>
        </div>

        <div className="space-y-2">
          {providersToDisplay.map((provider) => {
            const isConnected = normalizedConnectedProviders.has(provider.id);
            const isConnectableProvider = isSupportedProviderId(provider.id);
            const providerIdForConnect = isConnectableProvider
              ? (provider.id as SocialProviderId)
              : null;
            const canConnect = isConnectableProvider && !isConnected;
            const isLinking = isLinkingProvider === providerIdForConnect;
            const ProviderIcon = provider.Icon;

            return (
              <div
                key={provider.id}
                className="rounded-md border bg-muted/20 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <ProviderIcon
                      className="size-4"
                      style={{ color: provider.iconColor }}
                    />
                    {provider.label}
                  </p>

                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Badge className="gap-1 border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" />
                        Conectado
                      </Badge>
                    ) : (
                      <Badge className="gap-1 border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        <CircleDashed className="size-3.5" />
                        Não conectado
                      </Badge>
                    )}

                    {canConnect && providerIdForConnect && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => handleLinkProvider(providerIdForConnect)}
                        disabled={isLinking}
                      >
                        {isLinking ? <Spinner /> : "Conectar"}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
