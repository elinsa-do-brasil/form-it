// ============================================================
// 🔑 PÁGINA DE LOGIN (/entrar)
// ============================================================
// Esta página permite login apenas com a Microsoft.
//
// Layout: envolto pelo (auth)/layout.tsx, que mostra um Card
// centralizado na tela e redireciona se já estiver logado.
//
// Componentes utilizados:
// - RaauthCardHeader: cabeçalho com logo e título
// - CardContent: wrapper para o conteúdo principal
// - MicrosoftOauthButton: botão único de autenticação
// - CardFooter: rodapé com link para registro
// ============================================================

import { CardContent } from "@/app/(auth)/components/card-content";
import { RaauthCardHeader } from "@/app/(auth)/components/raauth-card-header";

import { MicrosoftOauthButton } from "@/components/auth/buttons/oauth-buttons";

export default function LoginPage() {
  return (
    <>
      <RaauthCardHeader />

      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Use sua conta Microsoft corporativa para acessar o sistema e abrir
            novos pedidos de equipamento.
          </p>
          <MicrosoftOauthButton className="w-full" />
        </div>
      </CardContent>
    </>
  );
}
