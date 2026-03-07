// ============================================================
// 🔑 PÁGINA DE LOGIN (/entrar)
// ============================================================
// Esta página permite que usuários façam login na aplicação
// usando e-mail/senha ou login social (OAuth).
//
// Layout: envolto pelo (auth)/layout.tsx, que mostra um Card
// centralizado na tela e redireciona se já estiver logado.
//
// Componentes utilizados:
// - RaauthCardHeader: cabeçalho com logo e título
// - CardContent: wrapper para o conteúdo principal
// - OAuth buttons: botões de login social
// - Or: separador visual ("ou")
// - LoginForm: formulário de e-mail/senha
// - CardFooter: rodapé com link para registro
// ============================================================

import { CardContent } from "@/app/(auth)/components/card-content";
import { RaauthCardHeader } from "@/app/(auth)/components/raauth-card-header";
import { CardFooter } from "@/app/(auth)/components/card-footer";

import {
  GithubOauthButton,
  GoogleOauthButton,
  MicrosoftOauthButton,
} from "@/components/auth/buttons/oauth-buttons";
import { LoginForm } from "@/components/auth/forms/login";
import { PasskeyLoginButton } from "@/components/auth/buttons/passkey-button";
import { Or } from "@/components/auth/or";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  return (
    <>
      <RaauthCardHeader login />

      <CardContent>
        <Tabs defaultValue="credentials" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="credentials">Senha</TabsTrigger>
            <TabsTrigger value="passkey">Passkey</TabsTrigger>
          </TabsList>

          <TabsContent
            value="credentials"
            className="space-y-4 focus-visible:outline-none"
          >
            <div className="grid grid-cols-3 space-x-2">
              <MicrosoftOauthButton />
              <GoogleOauthButton />
              <GithubOauthButton />
            </div>

            <Or />

            <LoginForm />
          </TabsContent>

          <TabsContent value="passkey" className="focus-visible:outline-none">
            <PasskeyLoginButton />
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter login />
    </>
  );
}
