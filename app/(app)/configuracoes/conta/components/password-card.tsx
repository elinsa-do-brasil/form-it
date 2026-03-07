"use client";

import {
  useDeferredValue,
  useMemo,
  useState,
  type ComponentProps,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, KeyRound } from "lucide-react";
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
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { evaluatePasswordStrength } from "@/lib/password-strength";
import { cn } from "@/lib/utils";
import {
  changePasswordAction,
  setPasswordAction,
} from "@/server/actions/account";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "A senha atual é obrigatória"),
  newPassword: z
    .string()
    .min(10, "A nova senha deve ter no mínimo 10 caracteres"),
});

const setPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(10, "A senha deve ter no mínimo 10 caracteres"),
    confirmPassword: z.string().min(1, "Confirme a nova senha"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas não conferem",
  });

type PasswordCardProps = {
  hasPassword: boolean;
  createdWithSocialLogin: boolean;
  lastPasswordChangedAt?: Date | string | null;
};

type PasswordFieldVisibilityState = {
  currentPassword: boolean;
  changeNewPassword: boolean;
  setNewPassword: boolean;
  confirmPassword: boolean;
};

type PasswordInputWithToggleProps = ComponentProps<typeof Input> & {
  isVisible: boolean;
  onToggle: () => void;
};

function PasswordInputWithToggle({
  isVisible,
  onToggle,
  className,
  ...props
}: PasswordInputWithToggleProps) {
  return (
    <div className="group flex h-9 w-full overflow-hidden rounded-md border border-input bg-transparent shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
      <Input
        {...props}
        type={isVisible ? "text" : "password"}
        className={cn(
          "h-full min-w-0 rounded-r-none border-0 bg-transparent pr-12 shadow-none focus-visible:ring-0",
          className,
        )}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="relative z-10 h-full w-10 min-w-10 shrink-0 rounded-none border-l border-input bg-background/80 px-2 text-foreground/80 hover:bg-muted/40 hover:text-foreground focus-visible:ring-0"
        onClick={onToggle}
        aria-label={isVisible ? "Ocultar senha" : "Exibir senha"}
      >
        {isVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </Button>
    </div>
  );
}

function PasswordStrengthHint({
  password,
  className,
}: {
  password: string;
  className?: string;
}) {
  const deferredPassword = useDeferredValue(password);
  const strength = useMemo(
    () => evaluatePasswordStrength(deferredPassword),
    [deferredPassword],
  );

  if (!strength) {
    return null;
  }

  const helperText =
    strength.warning ||
    strength.suggestions[0] ||
    `Tempo estimado para quebra offline lenta: ${strength.crackTimeDisplay}.`;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Força da senha</span>
        <span className={cn("font-medium", strength.textClassName)}>
          {strength.label}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", strength.progressClassName)}
          style={{ width: `${strength.progressPercent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{helperText}</p>
    </div>
  );
}

export function PasswordCard({
  hasPassword,
  createdWithSocialLogin,
  lastPasswordChangedAt,
}: PasswordCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [visibility, setVisibility] = useState<PasswordFieldVisibilityState>({
    currentPassword: false,
    changeNewPassword: false,
    setNewPassword: false,
    confirmPassword: false,
  });

  const changePasswordForm = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const setPasswordForm = useForm<z.infer<typeof setPasswordSchema>>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const changeNewPasswordValue = useWatch({
    control: changePasswordForm.control,
    name: "newPassword",
  });
  const setNewPasswordValue = useWatch({
    control: setPasswordForm.control,
    name: "newPassword",
  });
  const hasChangePasswordRowError = Boolean(
    changePasswordForm.formState.errors.currentPassword ||
      changePasswordForm.formState.errors.newPassword,
  );
  const hasSetPasswordRowError = Boolean(
    setPasswordForm.formState.errors.newPassword ||
      setPasswordForm.formState.errors.confirmPassword,
  );

  function toggleVisibility(field: keyof PasswordFieldVisibilityState) {
    setVisibility((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  }

  function reloadPageAfterSuccess() {
    setTimeout(() => {
      window.location.reload();
    }, 450);
  }

  const formattedLastPasswordChange = useMemo(() => {
    if (!lastPasswordChangedAt) {
      return null;
    }

    const parsed =
      lastPasswordChangedAt instanceof Date
        ? lastPasswordChangedAt
        : new Date(lastPasswordChangedAt);

    if (Number.isNaN(parsed.getTime())) {
      return null;
    }

    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(parsed);
  }, [lastPasswordChangedAt]);

  async function handleChangePassword(
    values: z.infer<typeof changePasswordSchema>,
  ) {
    setIsPending(true);
    const { error } = await changePasswordAction(values);
    setIsPending(false);

    if (error) {
      toast.error(getErrorMessage(error.code));
      return;
    }

    toast.success("Senha alterada com sucesso!");
    changePasswordForm.reset();
    reloadPageAfterSuccess();
  }

  async function handleSetPassword(values: z.infer<typeof setPasswordSchema>) {
    setIsPending(true);
    const { error } = await setPasswordAction({
      newPassword: values.newPassword,
    });
    setIsPending(false);

    if (error) {
      toast.error(getErrorMessage(error.code));
      return;
    }

    toast.success("Senha definida com sucesso!");
    setPasswordForm.reset();
    reloadPageAfterSuccess();
  }

  return (
    <Card id="password-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-4" />
          {hasPassword ? "Senha" : "Definir Senha"}
        </CardTitle>
        <CardDescription>
          {hasPassword
            ? "Altere sua senha atual."
            : createdWithSocialLogin
              ? "Sua conta foi criada com login social. Defina uma senha para habilitar login por e-mail/senha e gerenciar recursos que exigem credencial."
              : "Defina uma senha para sua conta."}
        </CardDescription>
        <p className="text-xs text-muted-foreground">
          {hasPassword
            ? formattedLastPasswordChange
              ? `Última troca de senha: ${formattedLastPasswordChange}`
              : "Última troca de senha: não registrada."
            : "Senha local ainda não definida."}
        </p>
      </CardHeader>
      <CardContent>
        {hasPassword ? (
          <Form {...changePasswordForm}>
            <form
              onSubmit={changePasswordForm.handleSubmit(handleChangePassword)}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={changePasswordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha Atual</FormLabel>
                      <FormControl>
                        <PasswordInputWithToggle
                          {...field}
                          autoComplete="current-password"
                          isVisible={visibility.currentPassword}
                          onToggle={() => toggleVisibility("currentPassword")}
                        />
                      </FormControl>
                      <div className={cn(hasChangePasswordRowError && "min-h-10")}>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={changePasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <PasswordInputWithToggle
                          {...field}
                          autoComplete="new-password"
                          isVisible={visibility.changeNewPassword}
                          onToggle={() => toggleVisibility("changeNewPassword")}
                        />
                      </FormControl>
                      <div className={cn(hasChangePasswordRowError && "min-h-10")}>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <PasswordStrengthHint
                password={changeNewPasswordValue ?? ""}
                className="rounded-md border bg-muted/20 p-3"
              />

              <div className="pt-1">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Spinner /> : "Atualizar senha"}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          <Form {...setPasswordForm}>
            <form
              onSubmit={setPasswordForm.handleSubmit(handleSetPassword)}
              className="space-y-4"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={setPasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <PasswordInputWithToggle
                          {...field}
                          autoComplete="new-password"
                          isVisible={visibility.setNewPassword}
                          onToggle={() => toggleVisibility("setNewPassword")}
                        />
                      </FormControl>
                      <div className={cn(hasSetPasswordRowError && "min-h-10")}>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={setPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <PasswordInputWithToggle
                          {...field}
                          autoComplete="new-password"
                          isVisible={visibility.confirmPassword}
                          onToggle={() => toggleVisibility("confirmPassword")}
                        />
                      </FormControl>
                      <div className={cn(hasSetPasswordRowError && "min-h-10")}>
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />
              </div>
              <PasswordStrengthHint
                password={setNewPasswordValue ?? ""}
                className="rounded-md border bg-muted/20 p-3"
              />

              <div className="pt-1">
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Spinner /> : "Definir senha"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
