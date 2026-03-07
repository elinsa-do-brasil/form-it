// ============================================================
// 🔒 LAYOUT DE AUTENTICAÇÃO (Grupo de Rotas: auth)
// ============================================================
// Este layout envolve as páginas de login (/entrar) e
// registro (/criar-conta). Ele faz duas coisas:
//
// 1. PROTEÇÃO: se o usuário JÁ está logado, redireciona
//    para a home (não faz sentido ver a tela de login logado)
//
// 2. VISUAL: centraliza o conteúdo na tela e envolve em um
//    Card (componente shadcn/ui) para um visual limpo.
//
// 📌 ROUTE GROUPS no Next.js:
// Pastas com parênteses como (auth) são "route groups" —
// elas agrupam páginas que compartilham um layout, MAS NÃO
// aparecem na URL. Então /entrar fica /entrar, não /auth/entrar.
//
// 🐤 Analogia: é como a sala de espera de um consultório.
// Se você já está lá dentro (logado), não faz sentido
// ficar na sala de espera — redireciona direto para dentro.
// ============================================================

import { Card } from "@/components/ui/card";
import { getServerSession } from "@/server/actions/session";
import { redirect } from "next/navigation";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Verifica se já existe uma sessão ativa
  const session = await getServerSession();

  // Se já está logado, redireciona para a home
  if (session) {
    return redirect("/");
  }

  // Renderiza o layout de autenticação:
  // - Tela cheia (min-w-dvw + min-h-dvh)
  // - Conteúdo centralizado (flex + justify-center + items-center)
  // - Card com largura mínima e máxima controladas
  return (
    <main className="min-w-dvw min-h-dvh flex justify-center items-center">
      <Card className="min-w-[24rem] max-w-108">{children}</Card>
    </main>
  );
}
