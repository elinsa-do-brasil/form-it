"use client";

import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { RaauthCardHeader } from "@/app/(auth)/components/raauth-card-header";
import { CardContent } from "@/app/(auth)/components/card-content";
import { EyeIcon, EyeClosedIcon } from "lucide-react";
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

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, { message: "Senha deve ter no mínimo 10 caracteres" }),
    confirmPassword: z
      .string()
      .min(10, { message: "Senha deve ter no mínimo 10 caracteres" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isPending, setIsPending] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    if (!token) {
      toast.error("Token de recuperação ausente. Solicite um novo link.");
      return;
    }

    setIsPending(true);
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });

    setIsPending(false);

    if (error) {
      toast.error(getErrorMessage(extractErrorCode(error)));
    } else {
      toast.success("Senha alterada com sucesso! Você já pode entrar.");
      router.push("/entrar");
    }
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-red-500 font-medium">
          Link de recuperação inválido ou expirado.
        </p>
        <Button variant="outline" asChild className="w-full">
          <Link href="/esqueci-a-senha">Solicitar novo link</Link>
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nova Senha</FormLabel>
              <FormControl>
                <div className="flex">
                  <Input
                    type={showPass ? "text" : "password"}
                    placeholder="**********"
                    autoComplete="new-password"
                    className="rounded-r-none"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none border-l-0"
                    onClick={() => setShowPass((prev) => !prev)}
                  >
                    {showPass ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeClosedIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Nova Senha</FormLabel>
              <FormControl>
                <div className="flex">
                  <Input
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="**********"
                    autoComplete="new-password"
                    className="rounded-r-none"
                    {...field}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-l-none border-l-0"
                    onClick={() => setShowConfirmPass((prev) => !prev)}
                  >
                    {showConfirmPass ? (
                      <EyeIcon className="h-4 w-4" />
                    ) : (
                      <EyeClosedIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col gap-2 mt-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? <Spinner /> : "Alterar senha"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <RaauthCardHeader login={false} />
      <CardContent>
        <Suspense
          fallback={
            <div className="flex justify-center py-4">
              <Spinner />
            </div>
          }
        >
          <ResetForm />
        </Suspense>
      </CardContent>
    </>
  );
}
