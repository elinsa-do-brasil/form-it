"use client";

import { useEffect, useState } from "react";
import { Fingerprint, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/errors";
import {
  deletePasskeyAction,
  listPasskeysAction,
} from "@/server/actions/account";

type PasskeyRecord = {
  id: string;
  name?: string | null;
  createdAt?: string | Date | null;
  deviceType?: string | null;
  backedUp?: boolean;
};

type PasskeyApiError = {
  code?: string;
  message?: string;
  status?: number;
  statusText?: string;
} | null;

type PasskeyClient = {
  passkey: {
    addPasskey: (opts?: {
      name?: string;
      authenticatorAttachment?: "platform" | "cross-platform";
    }) => Promise<{
      data?: PasskeyRecord;
      error?: PasskeyApiError;
    }>;
  };
};

type AttachmentPreference = "auto" | "platform" | "cross-platform";

const typedAuthClient = authClient as unknown as PasskeyClient;

function formatPasskeyDate(value: PasskeyRecord["createdAt"]) {
  if (!value) {
    return "data desconhecida";
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "data desconhecida";
  }

  return date.toLocaleDateString("pt-BR");
}

function getPasskeyErrorMessage(error?: PasskeyApiError) {
  const code = error?.code ?? "";

  if (code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
    return "Esse autenticador já está cadastrado. Escolha outro no gerenciador de passkeys.";
  }

  if (code === "ERROR_CEREMONY_ABORTED") {
    return "Cadastro de passkey cancelado.";
  }

  if (code) {
    return getErrorMessage(code);
  }

  return error?.message || "Falha ao processar passkey.";
}

export function PasskeysCard() {
  const [passkeys, setPasskeys] = useState<PasskeyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [attachmentPreference, setAttachmentPreference] =
    useState<AttachmentPreference>("auto");

  async function loadPasskeys() {
    setIsLoading(true);
    const { data, error } = await listPasskeysAction();

    if (error) {
      toast.error(`Erro ao carregar passkeys: ${getPasskeyErrorMessage(error)}`);
      setIsLoading(false);
      return;
    }

    setPasskeys(data ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadPasskeys();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  async function handleAddPasskey() {
    setIsAdding(true);

    const trimmedName = passkeyName.trim();
    const payload: {
      name?: string;
      authenticatorAttachment?: "platform" | "cross-platform";
    } = {};

    if (trimmedName) {
      payload.name = trimmedName;
    }

    if (attachmentPreference !== "auto") {
      payload.authenticatorAttachment = attachmentPreference;
    }

    const { error } = await typedAuthClient.passkey.addPasskey(payload);
    setIsAdding(false);

    if (error) {
      toast.error(getPasskeyErrorMessage(error));
      return;
    }

    toast.success("Passkey adicionado com sucesso!");
    setPasskeyName("");
    await loadPasskeys();
  }

  async function handleDeletePasskey(id: string) {
    const { error } = await deletePasskeyAction({ id });

    if (error) {
      toast.error(getPasskeyErrorMessage(error));
      return;
    }

    toast.success("Passkey removido.");
    await loadPasskeys();
  }

  return (
    <Card id="passkeys-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Passkeys
        </CardTitle>
        <CardDescription>
          Cadastre chaves de acesso para entrar de forma rápida e segura.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 rounded-md border p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="passkey-name">Nome da passkey (opcional)</Label>
            <Input
              id="passkey-name"
              value={passkeyName}
              onChange={(event) => setPasskeyName(event.target.value)}
              placeholder="Ex: Bitwarden no Chrome"
              maxLength={80}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="passkey-attachment">Tipo de autenticador</Label>
            <Select
              value={attachmentPreference}
              onValueChange={(value: AttachmentPreference) =>
                setAttachmentPreference(value)
              }
            >
              <SelectTrigger id="passkey-attachment" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Automático (recomendado)</SelectItem>
                <SelectItem value="platform">Plataforma</SelectItem>
                <SelectItem value="cross-platform">Chave externa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        ) : passkeys.length === 0 ? (
          <div className="rounded-md border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
            Nenhum passkey cadastrado.
          </div>
        ) : (
          <div className="space-y-4">
            {passkeys.map((passkey) => (
              <div
                key={passkey.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {passkey.name || "Dispositivo sem nome"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Adicionado em {formatPasskeyDate(passkey.createdAt)}
                  </p>
                  {(passkey.deviceType || passkey.backedUp !== undefined) && (
                    <p className="text-xs text-muted-foreground">
                      {passkey.deviceType || "tipo desconhecido"}
                      {passkey.backedUp ? " · sincronizado" : ""}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                  onClick={() => handleDeletePasskey(passkey.id)}
                  aria-label={`Remover passkey ${passkey.name || passkey.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleAddPasskey}
          disabled={isAdding || isLoading}
          variant="outline"
        >
          {isAdding ? (
            <Spinner className="mr-2" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Adicionar Passkey
        </Button>
      </CardFooter>
    </Card>
  );
}
