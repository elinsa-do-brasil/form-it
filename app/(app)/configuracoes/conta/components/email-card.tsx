"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";

import { changeEmailAction } from "@/server/actions/account";
import { getErrorMessage } from "@/lib/errors";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const emailSchema = z.object({
  newEmail: z
    .email("Digite um e-mail válido.")
    .trim()
    .min(5, "Digite um e-mail válido."),
});

type EmailFormValues = z.infer<typeof emailSchema>;

type EmailCardUser = {
  email?: string | null;
};

export function EmailCard({ user }: { user: EmailCardUser }) {
  const [isPending, setIsPending] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      newEmail: "",
    },
  });

  async function onSubmit(values: EmailFormValues) {
    setIsPending(true);
    const { data, error } = await changeEmailAction({
      newEmail: values.newEmail,
      callbackURL: "/configuracoes/conta",
    });
    setIsPending(false);

    if (error) {
      toast.error(getErrorMessage(error.code));
      return;
    }

    if (!data?.status) {
      toast.error("Não foi possível iniciar a alteração.");
      return;
    }

    toast.success(
      "Solicitação enviada. Confirme no link enviado para o novo e-mail.",
    );
    form.reset();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-4" />
          E-mail
        </CardTitle>
        <CardDescription>
          Atualize o e-mail principal. A troca só é concluída após confirmar o
          link no novo endereço.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>E-mail atual</FormLabel>
              <FormControl>
                <Input value={user.email ?? "Sem e-mail"} disabled />
              </FormControl>
            </FormItem>

            <FormField
              control={form.control}
              name="newEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Novo e-mail</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="novo@exemplo.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner /> : "Alterar e-mail"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
