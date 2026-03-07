import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  AccountAuthInsights,
  AccountSecurityState,
} from "@/lib/account-security";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  CircleUserRound,
  KeyRound,
  Mail,
  Shield,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";

type AccountOverviewUser = {
  id?: string | null;
  email?: string | null;
  emailVerified?: boolean;
  username?: string | null;
  createdAt?: Date | string | null;
  twoFactorEnabled?: boolean;
};

function formatDate(value: AccountOverviewUser["createdAt"]) {
  if (!value) {
    return "Não disponível";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Não disponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getSecurityBadgeVariant(label: AccountSecurityState["label"]) {
  if (label === "Muito alto" || label === "Alto") {
    return "secondary" as const;
  }

  if (label === "Médio") {
    return "outline" as const;
  }

  return "destructive" as const;
}

function getSecurityBadgeClassName(label: AccountSecurityState["label"]) {
  if (label === "Muito alto") {
    return "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  }

  if (label === "Alto") {
    return "border-lime-500/30 bg-lime-500/15 text-lime-700 dark:text-lime-300";
  }

  if (label === "Médio") {
    return "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300";
  }

  return "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300";
}

export function AccountOverviewCard({
  user,
  security,
  authInsights,
}: {
  user: AccountOverviewUser;
  security: AccountSecurityState;
  authInsights: AccountAuthInsights;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CircleUserRound className="size-4" />
          Dados da Conta
        </CardTitle>
        <CardDescription>
          Visão rápida das configurações e dados principais da sua conta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="flex items-center gap-2 font-medium">
            <Mail className="size-4 text-muted-foreground" />
            {user.email || "Sem e-mail"}
          </p>
          <Badge
            variant={user.emailVerified ? "secondary" : "outline"}
            className={
              user.emailVerified
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
            }
          >
            {user.emailVerified ? "E-mail verificado" : "E-mail pendente"}
          </Badge>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground flex items-center gap-2">
              <UserRound className="size-4" />
              Username
            </p>
            <p className="mt-1 font-medium">
              {user.username ? `@${user.username}` : "Não definido"}
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <p className="text-muted-foreground flex items-center gap-2">
              <CalendarDays className="size-4" />
              Conta criada em
            </p>
            <p className="mt-1 font-medium">{formatDate(user.createdAt)}</p>
          </div>
        </div>

        <div className="rounded-lg border p-3 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground flex items-center gap-2">
              <Shield className="size-4" />
              Autenticação em duas etapas
            </p>
            <Badge
              variant={user.twoFactorEnabled ? "secondary" : "outline"}
              className={cn(
                "mt-1",
                user.twoFactorEnabled
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                  : "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300",
              )}
            >
              {user.twoFactorEnabled ? "Ativada" : "Desativada"}
            </Badge>
          </div>
          {user.twoFactorEnabled ? (
            <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ShieldX className="size-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>

        <div className="rounded-lg border p-3 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-muted-foreground flex items-center gap-2">
              <KeyRound className="size-4" />
              Nível de segurança
            </p>
            <Badge
              variant={getSecurityBadgeVariant(security.label)}
              className={getSecurityBadgeClassName(security.label)}
            >
              {security.label}
            </Badge>
          </div>

          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${security.score}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Pontuação: {security.score}/100 ·{" "}
            {authInsights.hasPassword
              ? "senha definida"
              : "sem senha local"}{" "}
            · {authInsights.passkeysCount} passkey
            {authInsights.passkeysCount === 1 ? "" : "s"}
          </p>
        </div>

        {user.id && (
          <p className="text-xs text-muted-foreground break-all">ID: {user.id}</p>
        )}
      </CardContent>
    </Card>
  );
}
