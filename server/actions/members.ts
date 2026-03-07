// ============================================================
// 👥 SERVER ACTIONS: MEMBROS
// ============================================================
// Este arquivo contém funções para ADICIONAR e REMOVER membros
// de organizações. Estas são operações administrativas —
// apenas admins e owners devem executá-las.
//
// 📌 FLUXO DE ADIÇÃO DE MEMBRO:
// 1. Chama auth.api.addMember() → Better Auth cria o membro
// 2. Busca dados do user e da org para o e-mail
// 3. Envia e-mail de boas-vindas
// 4. Retorna { success: true/false }
//
// 📌 FLUXO DE REMOÇÃO DE MEMBRO:
// 1. Busca dados do membro ANTES de remover (para o e-mail)
// 2. Chama auth.api.removeMember() → Better Auth remove
// 3. Envia e-mail de notificação
// 4. Retorna { success: true/false }
//
// ⚠️ A ordem importa! Na remoção, buscamos os dados ANTES
// de remover, senão não teríamos o e-mail para notificar.
//
// 🐤 Analogia: é como o processo de RH — quando alguém
// entra na empresa, você cria o crachá E envia um "welcome
// kit". Quando sai, anota os dados PRIMEIRO e depois
// desativa o crachá.
// ============================================================

"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { sendRemovalEmail, sendWelcomeEmail } from "@/server/mail/membership";
import { db } from "@/lib/db";

// ── Tipos ─────────────────────────────────────────────────

// Dados necessários para adicionar um membro
interface AddMemberProps {
  organizationId: string;
  userId: string;
  role: "member" | "owner" | "admin";
}

// Resultado da operação (sucesso ou falha)
interface AddMemberResult {
  success: boolean;
}

// Dados necessários para remover um membro
interface RemoveMemberProps {
  memberId: string;
  organizationId: string;
}

// Resultado da remoção
interface RemoveMemberResult {
  success: boolean;
}

// ============================================================
// ➕ addMember
// ============================================================
// Adiciona um usuário a uma organização com um role específico.
//
// O parâmetro _prevState existe porque esta função pode ser
// usada com useFormState do React (onde o primeiro argumento
// é sempre o estado anterior).
// ============================================================
export async function addMember(
  _prevState: AddMemberResult | null,
  { organizationId, userId, role }: AddMemberProps
): Promise<AddMemberResult> {
  try {
    // Passo 1: usa a API do Better Auth para criar o membro
    // Isso cria o registro na tabela "member" do banco
    await auth.api.addMember({
      body: {
        userId,
        organizationId,
        role,
      },
    });

    // Passo 2: busca dados do usuário e da org em paralelo
    // (Promise.all executa ambas ao mesmo tempo = mais rápido)
    const [memberUser, org] = await Promise.all([
      db.user.findUnique({
        where: { id: userId },
      }),
      db.organization.findUnique({
        where: { id: organizationId },
      }),
    ]);

    // Verificações de segurança — se os dados não existem,
    // algo está muito errado
    if (!memberUser) {
      throw new Error("Usuário não encontrado");
    }

    if (!org) {
      throw new Error("Organização não encontrada");
    }

    // Passo 3: envia o e-mail de boas-vindas
    // Se o envio falhar, a exceção propaga e a operação
    // inteira é marcada como falha
    await sendWelcomeEmail({ user: memberUser, org });

    // Passo 4: tudo deu certo!
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
}

// ============================================================
// ➖ removeMember
// ============================================================
// Remove um membro de uma organização.
//
// ⚠️ ORDEM IMPORTANTE:
// 1. Busca dados do membro (para ter e-mail/nome)
// 2. Remove o membro (via Better Auth API)
// 3. Envia e-mail de notificação
//
// Se invertermos 1 e 2, não teríamos os dados do membro
// para enviar o e-mail (o registro já teria sido deletado).
// ============================================================
export async function removeMember(
  _prevState: RemoveMemberResult | null,
  { organizationId, memberId }: RemoveMemberProps
): Promise<RemoveMemberResult> {
  try {
    // Passo 1: busca dados do membro ANTES de remover
    const member = await db.member.findUnique({
      where: {
        id: memberId,
        organizationId: organizationId,
      },
      include: {
        user: true, // inclui dados do usuário (nome, email)
      },
    });

    if (!member) {
      throw new Error("Membro não encontrado");
    }

    const org = await db.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new Error("Organização não encontrada");
    }

    // Passo 2: remove o membro via API do Better Auth
    await auth.api.removeMember({
      body: {
        memberIdOrEmail: memberId,
        organizationId,
      },
      headers: await headers(),
    });

    // Passo 3: envia e-mail de notificação da remoção
    // Se o e-mail falhar, não queremos que a operação inteira
    // falhe (o membro já foi removido), então tratamos o erro
    // separadamente
    try {
      await sendRemovalEmail({ user: member.user, org });
    } catch (emailError) {
      console.error("Erro ao enviar email de remoção:", emailError);
      // Membro já foi removido, então apenas logamos o erro
      // do e-mail. É melhor que o membro seja removido sem
      // e-mail do que não ser removido por causa do e-mail.
    }

    // Passo 4: sucesso!
    return { success: true };
  } catch (error) {
    console.log(error);
    return { success: false };
  }
}