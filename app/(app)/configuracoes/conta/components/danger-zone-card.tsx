"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import { deleteAccountAction } from "@/server/actions/account";

export function DangerZoneCard() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [password, setPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleDeleteAccount() {
    if (!password) {
      toast.error("Digite sua senha para confirmar a exclusão.");
      return;
    }

    setIsDeleting(true);
    const { data, error } = await deleteAccountAction({
      password,
    });
    setIsDeleting(false);

    if (error) {
      toast.error(getErrorMessage(error.code));
    } else if (!data?.success) {
      toast.error("Não foi possível excluir a conta no momento.");
    } else {
      toast.success("Conta excluída com sucesso.");
      router.push("/entrar");
    }
  }

  return (
    <Card className="border-red-200 dark:border-red-900/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
          <AlertTriangle className="h-5 w-5" />
          Zona de Perigo
        </CardTitle>
        <CardDescription>
          A exclusão da sua conta é irreversível. Todos os seus dados serão
          apagados permanentemente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showConfirm ? (
          <Button variant="destructive" onClick={() => setShowConfirm(true)}>
            Excluir minha conta
          </Button>
        ) : (
          <div className="space-y-4 max-w-sm p-4 border rounded-md border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-950/10">
            <div className="space-y-2">
              <Label htmlFor="delete-password">
                Confirme sua senha para continuar
              </Label>
              <Input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha atual"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeleting || !password}
              >
                {isDeleting ? <Spinner /> : "Confirmar exclusão"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowConfirm(false);
                  setPassword("");
                }}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
