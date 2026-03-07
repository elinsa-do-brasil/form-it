"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/errors";

function extractErrorCode(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "";
  }

  if ("code" in error && typeof error.code === "string") {
    return error.code;
  }

  return "";
}

export function PasskeyLoginButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handlePasskeyLogin = async () => {
    setIsPending(true);
    const { error } = await authClient.signIn.passkey();

    setIsPending(false);

    if (error) {
      toast.error(getErrorMessage(extractErrorCode(error)));
    } else {
      toast.success("Login com passkey realizado com sucesso!");
      router.push("/");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <Fingerprint className="h-12 w-12 text-muted-foreground" />
      <div className="space-y-2">
        <h3 className="font-medium leading-none">Acesso Biométrico</h3>
        <p className="text-sm text-muted-foreground">
          Use sua digital, reconhecimento facial ou chave de segurança para
          entrar.
        </p>
      </div>
      <Button
        onClick={handlePasskeyLogin}
        disabled={isPending}
        className="w-full mt-2"
        size="lg"
      >
        {isPending ? <Spinner /> : "Entrar com Passkey"}
      </Button>
    </div>
  );
}
