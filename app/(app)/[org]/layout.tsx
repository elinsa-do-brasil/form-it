// ============================================================
// 🏢 LAYOUT DE ORGANIZAÇÃO (Proteção por Org)
// ============================================================
// Este layout protege as rotas sob /[org]/*, garantindo que:
//
// 1. O usuário está logado (tem sessão ativa)
// 2. O usuário é MEMBRO da organização na URL
//
// Se qualquer verificação falhar, redireciona ou mostra 404.
//
// 📌 PARAMS DINÂMICOS:
// O [org] na URL é capturado como params.org.
// Ex: /minha-empresa → org = "minha-empresa"
//
// ⚠️ No Next.js 15+, params é uma Promise — precisa de await.
//
// 🐤 Analogia: é como o crachá de acesso a um andar específico
// de um prédio. O porteiro (layout) verifica se você tem
// sessão (crachá válido) E se tem acesso àquele andar (org).
// ============================================================

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";

// No Next.js 15+, params é uma Promise que precisa ser "awaited"
type Params = Promise<{ org: string }>;

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Params;
}) {
  const h = await headers();

  // Passo 1: await nos params (obrigatório no Next.js 15+)
  const { org: orgSlug } = await params;

  // Passo 2: verifica se há sessão (usuário logado)
  const session = await auth.api.getSession({ headers: h });
  if (!session) redirect("/entrar");

  // Passo 3: lista todas as organizações do usuário
  // O Better Auth só retorna orgs onde o usuário é membro
  const orgs = await auth.api.listOrganizations({
    headers: h, // precisa dos cookies da sessão
  });

  // Passo 4: verifica se a org da URL pertence ao usuário
  const org = orgs?.find((o) => o.slug === orgSlug);
  if (!org) notFound(); // 404 se não for membro

  return <>{children}</>;
}
