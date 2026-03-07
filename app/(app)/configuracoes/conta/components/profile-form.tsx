"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Spinner } from "@/components/ui/spinner";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";
import {
  normalizeUsername,
  readCachedUsernameAvailability,
  validateUsername,
  writeUsernameAvailabilityCache,
} from "@/lib/username-availability";
import {
  checkUsernameAvailabilityAction,
  updateProfileAction,
} from "@/server/actions/account";

const USERNAME_HELP_TEXT =
  "Use de 3 a 30 caracteres com letras, números e _.";

const profileSchema = z.object({
  name: z.string().trim().min(1, "O nome não pode ser vazio"),
  image: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      { message: "Digite uma URL válida para a foto de perfil." },
    ),
  username: z
    .string()
    .trim()
    .max(30, "O nome de usuário deve ter no máximo 30 caracteres")
    .optional()
    .refine(
      (value) => {
        if (!value) {
          return true;
        }

        return validateUsername(normalizeUsername(value)).isValid;
      },
      { message: USERNAME_HELP_TEXT },
    ),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type UsernameAvailabilityStatus =
  | "idle"
  | "checking"
  | "available"
  | "unavailable"
  | "error";

type ProfileUser = {
  name?: string | null;
  username?: string | null;
  image?: string | null;
};

type RemoteAvailabilityState = {
  username: string;
  status: Exclude<UsernameAvailabilityStatus, "idle">;
} | null;

function checkUsernameAvailability(username: string) {
  return checkUsernameAvailabilityAction({ username });
}

export function ProfileForm({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [initialUsername, setInitialUsername] = useState(
    normalizeUsername(user?.username ?? ""),
  );
  const [remoteAvailability, setRemoteAvailability] =
    useState<RemoteAvailabilityState>(null);
  const availabilityRequestRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: "onChange",
    defaultValues: {
      name: user?.name || "",
      image: user?.image || "",
      username: user?.username || "",
    },
  });

  const watchedName = useWatch({
    control: form.control,
    name: "name",
  });

  const watchedImage = useWatch({
    control: form.control,
    name: "image",
  });

  const watchedUsername = useWatch({
    control: form.control,
    name: "username",
  });

  const usernameFeedback = useMemo(() => {
    const normalizedUsername = normalizeUsername(watchedUsername ?? "");

    if (!normalizedUsername) {
      return {
        normalizedUsername,
        shouldQuery: false,
        status: "idle" as const,
        text: null,
      };
    }

    if (normalizedUsername === initialUsername) {
      return {
        normalizedUsername,
        shouldQuery: false,
        status: "idle" as const,
        text: "Este é o seu username atual.",
      };
    }

    const validation = validateUsername(normalizedUsername);
    if (!validation.isValid) {
      return {
        normalizedUsername,
        shouldQuery: false,
        status: "idle" as const,
        text: USERNAME_HELP_TEXT,
      };
    }

    const cachedAvailability =
      readCachedUsernameAvailability(normalizedUsername);
    if (cachedAvailability) {
      return {
        normalizedUsername,
        shouldQuery: false,
        status: cachedAvailability.available
          ? ("available" as const)
          : ("unavailable" as const),
        text: cachedAvailability.available
          ? "Username disponível."
          : "Esse username já está em uso.",
      };
    }

    if (remoteAvailability?.username === normalizedUsername) {
      return {
        normalizedUsername,
        shouldQuery: false,
        status: remoteAvailability.status,
        text:
          remoteAvailability.status === "available"
            ? "Username disponível."
            : remoteAvailability.status === "unavailable"
              ? "Esse username já está em uso."
              : remoteAvailability.status === "error"
                ? "Não foi possível validar agora. Tente novamente em instantes."
                : "Verificando disponibilidade...",
      };
    }

    return {
      normalizedUsername,
      shouldQuery: true,
      status: "checking" as const,
      text: "Verificando disponibilidade...",
    };
  }, [initialUsername, remoteAvailability, watchedUsername]);

  useEffect(() => {
    if (!usernameFeedback.shouldQuery) {
      return;
    }

    const currentRequestId = ++availabilityRequestRef.current;
    const usernameToCheck = usernameFeedback.normalizedUsername;

    debounceTimerRef.current = setTimeout(async () => {
      setRemoteAvailability({
        username: usernameToCheck,
        status: "checking",
      });

      const { data, error } = await checkUsernameAvailability(usernameToCheck);

      if (currentRequestId !== availabilityRequestRef.current) {
        return;
      }

      if (error || !data) {
        setRemoteAvailability({
          username: usernameToCheck,
          status: "error",
        });
        return;
      }

      writeUsernameAvailabilityCache(usernameToCheck, data.available);
      setRemoteAvailability({
        username: usernameToCheck,
        status: data.available ? "available" : "unavailable",
      });
    }, 450);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [usernameFeedback.normalizedUsername, usernameFeedback.shouldQuery]);

  async function onSubmit(values: ProfileFormValues) {
    const normalizedUsername = normalizeUsername(values.username ?? "");
    const normalizedImage = values.image?.trim() ?? "";
    const usernameChanged = normalizedUsername !== initialUsername;

    if (usernameChanged && normalizedUsername) {
      if (usernameFeedback.status === "unavailable") {
        form.setError("username", {
          message:
            "Escolha outro nome de usuário. Este já está sendo utilizado.",
        });
        return;
      }

      const hasConfirmedAvailable =
        readCachedUsernameAvailability(normalizedUsername)?.available === true;

      if (!hasConfirmedAvailable) {
        setRemoteAvailability({
          username: normalizedUsername,
          status: "checking",
        });
        const { data, error } = await checkUsernameAvailability(
          normalizedUsername,
        );

        if (error || !data) {
          setRemoteAvailability({
            username: normalizedUsername,
            status: "error",
          });
          form.setError("username", {
            message:
              "Não foi possível validar este username agora. Tente novamente.",
          });
          return;
        }

        if (!data.available) {
          setRemoteAvailability({
            username: normalizedUsername,
            status: "unavailable",
          });
          form.setError("username", {
            message:
              "Escolha outro nome de usuário. Este já está sendo utilizado.",
          });
          return;
        }

        writeUsernameAvailabilityCache(normalizedUsername, true);
        setRemoteAvailability({
          username: normalizedUsername,
          status: "available",
        });
      }
    }

    setIsPending(true);

    const { error } = await updateProfileAction({
      name: values.name,
      image: normalizedImage || undefined,
      username: normalizedUsername || undefined,
    });
    setIsPending(false);

    if (error) {
      toast.error(getErrorMessage(error.code));
      return;
    }

    toast.success("Perfil atualizado com sucesso!");
    setInitialUsername(normalizedUsername);
    form.reset({
      name: values.name.trim(),
      image: normalizedImage,
      username: normalizedUsername || "",
    });
    setRemoteAvailability(null);
    router.refresh();
  }

  const hasUsernameValidationError = Boolean(form.formState.errors.username);
  const shouldBlockSubmit =
    usernameFeedback.status === "checking" ||
    usernameFeedback.status === "unavailable";
  const statusTextClassName = cn("text-xs", {
    "text-muted-foreground":
      usernameFeedback.status === "idle" ||
      usernameFeedback.status === "checking",
    "text-emerald-600 dark:text-emerald-400":
      usernameFeedback.status === "available",
    "text-destructive":
      usernameFeedback.status === "unavailable" ||
      usernameFeedback.status === "error",
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-md border bg-muted/20 p-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Pré-visualização da foto de perfil
          </p>
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="size-12">
              {watchedImage?.trim() ? (
                <AvatarImage src={watchedImage.trim()} alt="Foto de perfil" />
              ) : null}
              <AvatarFallback>
                {(watchedName?.trim()?.[0] || user?.name?.trim()?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-xs text-muted-foreground">
              Use uma URL de imagem pública para definir seu avatar.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foto de Perfil (URL)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="url"
                  placeholder="https://exemplo.com/minha-foto.jpg"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome de Usuário</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="username"
                  placeholder="seu_usuario"
                />
              </FormControl>
              <FormDescription>{USERNAME_HELP_TEXT}</FormDescription>
              {usernameFeedback.text && !hasUsernameValidationError && (
                <div className={cn("flex items-center gap-2", statusTextClassName)}>
                  {usernameFeedback.status === "checking" && (
                    <Spinner className="size-3" />
                  )}
                  {usernameFeedback.status === "available" && (
                    <CheckCircle2 className="size-3" />
                  )}
                  {(usernameFeedback.status === "unavailable" ||
                    usernameFeedback.status === "error") && (
                    <AlertCircle className="size-3" />
                  )}
                  <span>{usernameFeedback.text}</span>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isPending || shouldBlockSubmit || !form.formState.isValid}
          >
            {isPending ? <Spinner /> : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
