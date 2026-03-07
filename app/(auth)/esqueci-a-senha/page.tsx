"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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

const forgotPasswordSchema = z.object({
  email: z.email({ message: "O e-mail digitado não é válido" }).trim(),
});

export default function ForgotPasswordPage() {
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: z.infer<typeof forgotPasswordSchema>) {
    setIsPending(true);
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/redefinir-senha",
    });

    setIsPending(false);

    if (error) {
      toast.error(getErrorMessage(extractErrorCode(error)));
    } else {
      setIsSuccess(true);
      toast.success(
        "E-mail de recuperação enviado! Verifique sua caixa de entrada.",
      );
    }
  }

  return (
    <>
      <RaauthCardHeader login={false} />

      <CardContent>
        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-sm text-muted-foreground">
              Se houver uma conta associada a este e-mail, enviaremos um link
              para redefinir sua senha.
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link href="/entrar">Voltar para o login</Link>
            </Button>
          </div>
        ) : (
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
                    <FormLabel>E-mail</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="você@alguma-coisa.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-2 mt-2">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Spinner /> : "Enviar link de recuperação"}
                </Button>
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/entrar">Voltar</Link>
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </>
  );
}
