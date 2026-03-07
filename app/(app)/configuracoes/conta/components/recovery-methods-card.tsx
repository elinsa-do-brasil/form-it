import {
  KeyRound,
  LifeBuoy,
  MailCheck,
  ShieldCheck,
  ShieldX,
  UserRoundCheck,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type RecoveryMethodsCardProps = {
  emailVerified: boolean;
  hasPassword: boolean;
  hasSocialLogin: boolean;
  hasPasskeys: boolean;
  twoFactorEnabled: boolean;
};

function RecoveryRow({
  icon: Icon,
  label,
  status,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  status: string;
  active: boolean;
}) {
  return (
    <div className="flex h-full items-center justify-between gap-3 rounded-lg border p-3 text-sm">
      <p className="flex items-center gap-2 font-medium">
        <Icon className="size-4 text-muted-foreground" />
        {label}
      </p>
      <Badge
        variant={active ? "secondary" : "outline"}
        className={
          active
            ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
            : "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
        }
      >
        {status}
      </Badge>
    </div>
  );
}

export function RecoveryMethodsCard({
  emailVerified,
  hasPassword,
  hasSocialLogin,
  hasPasskeys,
  twoFactorEnabled,
}: RecoveryMethodsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LifeBuoy className="size-4" />
          Métodos de Recuperação
        </CardTitle>
        <CardDescription>
          Confira os recursos disponíveis para recuperar o acesso da sua conta
          com segurança.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        <RecoveryRow
          icon={MailCheck}
          label="E-mail verificado"
          status={emailVerified ? "Disponível" : "Pendente"}
          active={emailVerified}
        />

        <RecoveryRow
          icon={KeyRound}
          label="Senha local"
          status={hasPassword ? "Configurada" : "Não definida"}
          active={hasPassword}
        />

        <RecoveryRow
          icon={UserRoundCheck}
          label="Login social vinculado"
          status={hasSocialLogin ? "Disponível" : "Não conectado"}
          active={hasSocialLogin}
        />

        <RecoveryRow
          icon={ShieldCheck}
          label="Passkeys"
          status={hasPasskeys ? "Disponível" : "Não cadastrado"}
          active={hasPasskeys}
        />

        <div className="flex h-full items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <p className="flex items-center gap-2 font-medium">
            {twoFactorEnabled ? (
              <ShieldCheck className="size-4 text-muted-foreground" />
            ) : (
              <ShieldX className="size-4 text-muted-foreground" />
            )}
            Códigos de recuperação 2FA
          </p>
          <Badge
            variant={twoFactorEnabled ? "secondary" : "outline"}
            className={
              twoFactorEnabled
                ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
            }
          >
            {twoFactorEnabled ? "Disponíveis no card de 2FA" : "Ative o 2FA"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
