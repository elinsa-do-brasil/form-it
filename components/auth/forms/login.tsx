"use client";

// dependências:
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// componentes:
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";

// ícones:
import { EyeIcon, EyeClosedIcon } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/errors";

type TwoFactorClient = {
  twoFactor: {
    verifyTotp: (input: { code: string }) => Promise<{
      error?: unknown;
    }>;
  };
};

const typedTwoFactorClient = authClient as unknown as TwoFactorClient;

function extractErrorCode(error: unknown): string {
  if (typeof error !== "object" || error === null) {
    return "";
  }

  if ("code" in error && typeof error.code === "string") {
    return error.code;
  }

  return "";
}

function extractUserName(data: unknown): string {
  if (typeof data !== "object" || data === null || !("user" in data)) {
    return "";
  }

  const user = data.user;
  if (typeof user !== "object" || user === null || !("name" in user)) {
    return "";
  }

  return typeof user.name === "string" ? user.name : "";
}

function hasTwoFactorRedirect(data: unknown): boolean {
  if (typeof data !== "object" || data === null) {
    return false;
  }

  if (!("twoFactorRedirect" in data)) {
    return false;
  }

  return data.twoFactorRedirect === true;
}

// esquema do zod:
// TODO: melhorar a validação para não aceitar e-mails vazios
const loginInfos = z.object({
  email: z
    .string()
    .min(1, { message: "Precisamos de um e-mail ou nome de usuário" })
    .trim(),
  password: z.string().min(1, { message: "Precisamos de uma senha" }).trim(),
});

export function LoginForm() {
  const router = useRouter();

  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof loginInfos>>({
    resolver: zodResolver(loginInfos),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const pass = useWatch({ control: form.control, name: "password" });
  const [showPass, setShowPass] = useState<boolean>(false);
  const disableShowPassButton = pass === "" || pass === undefined;

  // Estados para 2FA
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  async function handleVerifyOTP() {
    setIsPending(true);
    const { error } = await typedTwoFactorClient.twoFactor.verifyTotp({
      code: otpCode,
    });

    setIsPending(false);

    if (error) {
      toast.error(getErrorMessage(extractErrorCode(error)) || "Código inválido");
    } else {
      toast.success("Login efetuado com sucesso!");
      router.push("/");
    }
  }

  async function onSubmit(values: z.infer<typeof loginInfos>) {
    setIsPending(true);

    const { data, error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    setIsPending(false);

    if (error) {
      toast.error(getErrorMessage(extractErrorCode(error)));
      form.setValue("password", "");
      return;
    }

    if (hasTwoFactorRedirect(data)) {
      setShowOtpInput(true);
      toast.info("Autenticação de duas etapas necessária.");
      return;
    }

    const userName = extractUserName(data) || "usuário";
    toast.success(`Bem-vindo(a), ${userName}!`);
    router.push("/");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail ou Nome de Usuário</FormLabel>
              <FormControl>
                <Input
                  placeholder="você@alguma-coisa.com ou seunome"
                  autoComplete="email username webauthn"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-between">
                Senha
                <Button
                  variant="link"
                  className="text-muted-foreground hover:text-black dark:hover:text-white p-0 h-3.5"
                  asChild
                >
                  <Link href="/esqueci-a-senha">Esqueceu sua senha?</Link>
                </Button>
              </FormLabel>
              <FormControl>
                <div className="flex">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="***"
                    autoComplete="current-password webauthn"
                    className="rounded-r-none"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none border-l-0"
                    onClick={() => setShowPass((prev) => !prev)}
                    disabled={disableShowPassButton}
                  >
                    {showPass && !disableShowPassButton ? (
                      <EyeIcon className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <EyeClosedIcon className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span className="sr-only">
                      {showPass ? "Esconder senha" : "Mostrar senha"}
                    </span>
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2">
          {showOtpInput ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <FormLabel>Código de Autenticação (2FA)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000111"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Abra o aplicativo autenticador no seu celular para ver o
                  código.
                </p>
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={isPending || otpCode.length < 6}
                onClick={handleVerifyOTP}
              >
                {isPending ? <Spinner /> : "Verificar e Entrar"}
              </Button>
            </div>
          ) : (
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner /> : "Entrar"}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}
