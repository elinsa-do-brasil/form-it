"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { persistActiveOrganization } from "@/server/actions/organizations";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const createOrganizationSchema = z.object({
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  slug: z
    .string()
    .min(2, "O slug deve ter pelo menos 2 caracteres.")
    .regex(
      /^[a-z0-9-]+$/,
      "O slug deve conter apenas letras minúsculas, números e hifens.",
    ),
});

type CreateOrganizationFormValues = z.infer<typeof createOrganizationSchema>;

type OrganizationClient = {
  organization: {
    create: (input: {
      name: string;
      slug: string;
    }) => Promise<{
      data?: {
        id: string;
      } | null;
      error?: {
        message?: string;
      } | null;
    }>;
    setActive: (input: { organizationId: string }) => Promise<unknown>;
  };
};

const typedOrganizationClient = authClient as unknown as OrganizationClient;

export function CreateOrganizationForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<CreateOrganizationFormValues>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: {
      name: "",
      slug: "",
    },
  });

  async function onSubmit(data: CreateOrganizationFormValues) {
    setIsLoading(true);

    try {
      const response = await typedOrganizationClient.organization.create({
        name: data.name,
        slug: data.slug,
      });

      if (response.data) {
        toast.success("Organização criada com sucesso!");

        // Define no client state do better-auth
        await typedOrganizationClient.organization.setActive({
          organizationId: response.data.id,
        });

        // Persiste no banco de dados para a proxima sessao
        await persistActiveOrganization(response.data.id);

        // Redireciona para atualizar o Header e Sessao
        router.push("/configuracoes");
        router.refresh();
      } else {
        toast.error(response.error?.message || "Erro ao criar organização");
      }
    } catch {
      toast.error("Ocorreu um erro inesperado ao criar organização.");
    } finally {
      setIsLoading(false);
    }
  }

  // Gera o slug automaticamente baseado no nome
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome da Organização</FormLabel>
              <FormControl>
                <Input
                  placeholder="Minha Empresa S/A"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    // Autofill slug if user hasn't touched the slug specifically
                    const currentSlug = form.getValues("slug");
                    if (
                      !currentSlug ||
                      currentSlug === generateSlug(e.target.value.slice(0, -1))
                    ) {
                      form.setValue("slug", generateSlug(e.target.value), {
                        shouldValidate: true,
                      });
                    }
                  }}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL da Organização (Slug)</FormLabel>
              <FormControl>
                <Input
                  placeholder="minha-empresa"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormDescription>
                Este é o identificador único da sua organização na URL.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Criando...
            </>
          ) : (
            "Criar Organização"
          )}
        </Button>
      </form>
    </Form>
  );
}
