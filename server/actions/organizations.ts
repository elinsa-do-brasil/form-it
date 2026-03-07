// ============================================================
// 🏢 SERVER ACTIONS: ORGANIZAÇÕES
// ============================================================
// Este arquivo contém TODAS as funções server-side relacionadas
// a organizações: buscar por slug, listar do usuário, e
// persistir a organização ativa.
//
// 📌 ORGANIZAÇÃO ATIVA:
// O conceito de "organização ativa" é central no sistema
// multi-tenant. Quando um usuário pertence a várias orgs,
// ele precisa "selecionar" qual está usando no momento.
// Isso é salvo em dois lugares:
//   1. Na sessão do Better Auth (session.activeOrganizationId)
//   2. No campo lastActiveOrganizationId do User (persistência)
//
// 🐤 Analogia: é como ter vários perfis no Netflix — você
// pode pertencer a várias contas, mas só usa uma por vez.
// ============================================================

"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCurrentUser } from "@/server/actions/session";

// ============================================================
// 🔍 getOrganizationBySlug
// ============================================================
// Busca uma organização pelo seu slug (URL amigável).
// Inclui os membros e seus dados de usuário.
//
// Uso: na página /org/[slug] para exibir detalhes da org.
//
// ⚠️ Retorna null se a organização não existir.
// ============================================================
export async function getOrganizationBySlug(slug: string) {
  try {
    const organizationBySlug = await db.organization.findUnique({
      where: {
        slug: slug,
      },
      // "include" faz um JOIN: traz os membros E os dados
      // do usuário de cada membro em uma única consulta
      include: { members: { include: { user: true } } },
    });

    return organizationBySlug;
  } catch (error) {
    console.log(error);
    return null;
  }
}

// ============================================================
// 📋 getOrganizations
// ============================================================
// Retorna TODAS as organizações do usuário logado, junto com
// a ID da organização que ele deveria ter ativa.
//
// A lógica para decidir a organização ativa preferida:
// 1. Se o usuário só tem UMA org → seleciona ela automaticamente
// 2. Se tem várias → usa a lastActiveOrganization salva
// 3. Se a lastActive não existe mais → retorna null (sem ativa)
//
// Também atualiza o lastActiveOrganizationId caso tenha mudado,
// para que no próximo login já abra a org certa.
// ============================================================
export async function getOrganizations() {
  const { currentUser } = await getCurrentUser();

  // Passo 1: busca todas as "memberships" do usuário
  // (cada membership é uma relação user ↔ organização)
  const members = await db.member.findMany({
    where: {
      userId: currentUser.id,
    },
  });

  // Passo 2: busca as organizações correspondentes
  const organizations = await db.organization.findMany({
    where: {
      id: {
        in: members.map(
          (member: { organizationId: string }) => member.organizationId
        ),
      },
    },
  });

  // Passo 3: decide qual organização deveria estar ativa
  const hasSingleOrganization = organizations.length === 1;
  const preferredActiveOrganizationId = hasSingleOrganization
    ? // Se só tem uma org, seleciona ela automaticamente
    organizations[0].id
    : // Se tem várias, usa a última ativa (se ela ainda existe)
    currentUser.lastActiveOrganizationId &&
      organizations.some(
        (organization: { id: string }) =>
          organization.id === currentUser.lastActiveOrganizationId
      )
      ? currentUser.lastActiveOrganizationId
      : // Se a última ativa não existe mais, retorna null
      null;

  // Passo 4: atualiza o banco se a preferência mudou
  // (ex: uma org foi deletada e a lastActive não existe mais)
  if (currentUser.lastActiveOrganizationId !== preferredActiveOrganizationId) {
    await db.user.update({
      where: { id: currentUser.id },
      data: { lastActiveOrganizationId: preferredActiveOrganizationId },
    });
  }

  return {
    organizations,
    preferredActiveOrganizationId,
  };
}

// ============================================================
// 💾 persistActiveOrganization
// ============================================================
// Salva qual organização o usuário escolheu como "ativa".
// Chamada quando o usuário troca de organização no dropdown.
//
// Verificações de segurança:
// 1. O usuário precisa estar logado
// 2. Precisa ser membro da organização escolhida
//
// Retorna { ok: true } ou { ok: false, reason: "..." }
// ============================================================
export async function persistActiveOrganization(
  organizationId: string | null
) {
  // Passo 1: verifica se está logado
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return { ok: false as const, reason: "UNAUTHORIZED" as const };
  }

  // Passo 2: se organizationId é null, limpa a org ativa
  // (útil quando o usuário quer "desselecionar" a org)
  if (!organizationId) {
    await db.user.update({
      where: { id: session.user.id },
      data: { lastActiveOrganizationId: null },
    });

    return { ok: true as const };
  }

  // Passo 3: verifica se o usuário é membro da org escolhida
  // (segurança: não permite selecionar uma org alheia)
  const membership = await db.member.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
    },
  });

  if (!membership) {
    return { ok: false as const, reason: "NOT_A_MEMBER" as const };
  }

  // Passo 4: salva a org ativa no banco
  await db.user.update({
    where: { id: session.user.id },
    data: { lastActiveOrganizationId: organizationId },
  });

  return { ok: true as const };
}
