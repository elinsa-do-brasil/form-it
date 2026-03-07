"use client";

import { useMemo, useState } from "react";
import {
  Clock3,
  Laptop2,
  LocateFixed,
  MonitorCog,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  TabletSmartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

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
import { getErrorMessage } from "@/lib/errors";
import {
  listActiveSessionsAction,
  revokeOtherSessionsAction,
  revokeSessionAction,
} from "@/server/actions/account";

type SessionItem = {
  id: string;
  token: string;
  createdAt: string | null;
  updatedAt: string | null;
  expiresAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
};

type ActiveSessionsCardProps = {
  initialSessions: SessionItem[];
  currentSessionToken: string | null;
};

function parseDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function formatDateTime(value: string | null) {
  const date = parseDate(value);

  if (!date) {
    return "Não disponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatRelativeTime(value: string | null) {
  const date = parseDate(value);

  if (!date) {
    return "Não disponível";
  }

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const formatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);

  return formatter.format(diffDays, "day");
}

function inferDeviceLabel(userAgent: string | null) {
  if (!userAgent) {
    return {
      label: "Dispositivo não identificado",
      icon: Laptop2,
    };
  }

  const normalized = userAgent.toLowerCase();

  if (
    normalized.includes("iphone") ||
    normalized.includes("android") ||
    normalized.includes("mobile")
  ) {
    return {
      label: "Dispositivo móvel",
      icon: Smartphone,
    };
  }

  if (normalized.includes("ipad") || normalized.includes("tablet")) {
    return {
      label: "Tablet",
      icon: TabletSmartphone,
    };
  }

  return {
    label: "Desktop / Notebook",
    icon: Laptop2,
  };
}

function getSessionActivityAt(session: SessionItem) {
  return session.updatedAt || session.createdAt;
}

export function ActiveSessionsCard({
  initialSessions,
  currentSessionToken,
}: ActiveSessionsCardProps) {
  const [sessions, setSessions] = useState<SessionItem[]>(initialSessions);
  const [currentToken, setCurrentToken] = useState(currentSessionToken);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRevokingOthers, setIsRevokingOthers] = useState(false);
  const [revokingToken, setRevokingToken] = useState<string | null>(null);

  const orderedSessions = useMemo(() => {
    return [...sessions].sort((a, b) => {
      const left = parseDate(getSessionActivityAt(b))?.getTime() ?? 0;
      const right = parseDate(getSessionActivityAt(a))?.getTime() ?? 0;

      return left - right;
    });
  }, [sessions]);

  const lastLoginAt = orderedSessions[0]
    ? getSessionActivityAt(orderedSessions[0])
    : null;
  const otherSessionsCount = orderedSessions.filter(
    (session) => session.token !== currentToken,
  ).length;

  async function refreshSessions(options?: { silent?: boolean }) {
    setIsRefreshing(true);
    const { data, error } = await listActiveSessionsAction();
    setIsRefreshing(false);

    if (error || !data) {
      if (!options?.silent) {
        toast.error(getErrorMessage(error?.code || "UNKNOWN_ERROR"));
      }
      return;
    }

    setSessions(data.sessions);
    setCurrentToken(data.currentSessionToken);

    if (!options?.silent) {
      toast.success("Sessões atualizadas.");
    }
  }

  async function handleRevokeSession(token: string) {
    setRevokingToken(token);
    const { error } = await revokeSessionAction({ token });
    setRevokingToken(null);

    if (error) {
      toast.error(getErrorMessage(error.code));
      return;
    }

    toast.success("Sessão revogada com sucesso.");
    await refreshSessions({ silent: true });
  }

  async function handleRevokeOthers() {
    setIsRevokingOthers(true);
    const { error } = await revokeOtherSessionsAction();
    setIsRevokingOthers(false);

    if (error) {
      toast.error(getErrorMessage(error.code));
      return;
    }

    toast.success("Outras sessões foram revogadas.");
    await refreshSessions({ silent: true });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorCog className="size-4" />
          Sessões Ativas
        </CardTitle>
        <CardDescription>
          Revogue acessos antigos e monitore em qual dispositivo sua conta está
          aberta.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Último login</p>
            <p className="font-medium">
              {lastLoginAt ? formatRelativeTime(lastLoginAt) : "Não disponível"}
            </p>
            {lastLoginAt && (
              <p className="text-xs text-muted-foreground">
                {formatDateTime(lastLoginAt)}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refreshSessions()}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Spinner />
              ) : (
                <RefreshCw className="mr-1 size-4" />
              )}
              Atualizar
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRevokeOthers}
              disabled={isRevokingOthers || otherSessionsCount === 0}
            >
              {isRevokingOthers ? <Spinner /> : <Trash2 className="mr-1 size-4" />}
              Revogar outras
            </Button>
          </div>
        </div>

        {orderedSessions.length === 0 ? (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            Nenhuma sessão ativa encontrada.
          </div>
        ) : (
          <div className="space-y-3">
            {orderedSessions.map((session) => {
              const isCurrent = session.token === currentToken;
              const device = inferDeviceLabel(session.userAgent);
              const DeviceIcon = device.icon;

              return (
                <div
                  key={session.id}
                  className="rounded-lg border p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="flex items-center gap-2 font-medium">
                        <DeviceIcon className="size-4 text-muted-foreground" />
                        {device.label}
                      </p>
                      <p className="text-xs text-muted-foreground break-all">
                        {session.userAgent || "Agente do navegador não disponível"}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="size-3.5" />
                          Início: {formatDateTime(session.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <LocateFixed className="size-3.5" />
                          IP: {session.ipAddress || "Não disponível"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {isCurrent ? (
                        <Badge className="border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="size-3" />
                          Sessão atual
                        </Badge>
                      ) : (
                        <Badge variant="outline">Sessão ativa</Badge>
                      )}

                      {!isCurrent && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokeSession(session.token)}
                          disabled={revokingToken === session.token}
                        >
                          {revokingToken === session.token ? (
                            <Spinner />
                          ) : (
                            <Trash2 className="mr-1 size-4" />
                          )}
                          Revogar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
