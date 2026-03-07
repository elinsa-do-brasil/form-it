"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, Mail, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

type SecurityAlertsCardProps = {
  userId: string;
};

type AlertsState = {
  newLogin: boolean;
  passwordChanges: boolean;
  emailChanges: boolean;
  securityEvents: boolean;
};

const DEFAULT_ALERTS_STATE: AlertsState = {
  newLogin: true,
  passwordChanges: true,
  emailChanges: true,
  securityEvents: true,
};

function buildStorageKey(userId: string) {
  return `account-security-alerts:${userId}`;
}

const ALERT_ITEMS: Array<{
  key: keyof AlertsState;
  label: string;
  description: string;
}> = [
  {
    key: "newLogin",
    label: "Novo login",
    description: "Dispositivo ou navegador diferente.",
  },
  {
    key: "passwordChanges",
    label: "Senha atualizada",
    description: "Troca ou definição de senha local.",
  },
  {
    key: "emailChanges",
    label: "E-mail alterado",
    description: "Mudanças no e-mail principal da conta.",
  },
  {
    key: "securityEvents",
    label: "Eventos de segurança",
    description: "2FA, passkeys e revogação de sessões.",
  },
];

export function SecurityAlertsCard({ userId }: SecurityAlertsCardProps) {
  const storageKey = useMemo(() => buildStorageKey(userId), [userId]);
  const [alerts, setAlerts] = useState<AlertsState>(DEFAULT_ALERTS_STATE);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const rawValue = localStorage.getItem(storageKey);

      if (!rawValue) {
        setIsReady(true);
        return;
      }

      const parsed = JSON.parse(rawValue) as Partial<AlertsState>;

      setAlerts({
        newLogin:
          typeof parsed.newLogin === "boolean"
            ? parsed.newLogin
            : DEFAULT_ALERTS_STATE.newLogin,
        passwordChanges:
          typeof parsed.passwordChanges === "boolean"
            ? parsed.passwordChanges
            : DEFAULT_ALERTS_STATE.passwordChanges,
        emailChanges:
          typeof parsed.emailChanges === "boolean"
            ? parsed.emailChanges
            : DEFAULT_ALERTS_STATE.emailChanges,
        securityEvents:
          typeof parsed.securityEvents === "boolean"
            ? parsed.securityEvents
            : DEFAULT_ALERTS_STATE.securityEvents,
      });
    } catch {
      setAlerts(DEFAULT_ALERTS_STATE);
    } finally {
      setIsReady(true);
    }
  }, [storageKey]);

  function updateAlert<K extends keyof AlertsState>(key: K, value: boolean) {
    const nextState = {
      ...alerts,
      [key]: value,
    };

    setAlerts(nextState);
    localStorage.setItem(storageKey, JSON.stringify(nextState));
    toast.success("Preferências de alerta atualizadas.");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BellRing className="size-4" />
          Alertas de Segurança
        </CardTitle>
        <CardDescription>
          Selecione quais eventos críticos devem gerar alerta por e-mail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border p-3 space-y-3">
          <Label className="flex items-center gap-2 font-medium">
            <Mail className="size-4 text-muted-foreground" />
            Alertas por e-mail
          </Label>

          <div className="grid gap-2 md:grid-cols-2">
            {ALERT_ITEMS.map((item) => {
              const id = `security-alert-${item.key}`;

              return (
                <div
                  key={item.key}
                  className="rounded-md border bg-background/50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <label htmlFor={id} className="space-y-1">
                      <p className="text-sm font-medium leading-none">{item.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </label>
                    <Switch
                      id={id}
                      checked={alerts[item.key]}
                      disabled={!isReady}
                      onCheckedChange={(checked) =>
                        updateAlert(item.key, Boolean(checked))
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
          Deixe ao menos um alerta ativo para detectar acessos inesperados com
          rapidez.
        </p>
      </CardContent>
    </Card>
  );
}
