// ============================================================
// 👤 SERVER ACTIONS: USUÁRIOS
// ============================================================
// Este arquivo contém funções para consultar USUÁRIOS que
// ainda NÃO são membros de uma organização específica.
//
// 📌 CASO DE USO:
// Quando o admin quer adicionar alguém à organização, ele
// precisa ver uma lista de usuários que AINDA NÃO são membros.
// Esta função filtra exatamente isso.
//
// 🐤 Analogia: imagine uma festa com lista de convidados.
// Esta função retorna quem ainda não foi convidado.
// ============================================================

import { db } from "@/lib/db";

// ============================================================
// 📋 getAllUsers
// ============================================================
// Retorna todos os usuários que NÃO são membros da org informada.
//
// Como funciona:
// 1. Busca todos os membros da organização
// 2. Pega os IDs desses membros
// 3. Busca todos os usuários EXCETO esses IDs
//
// ⚠️ Retorna null em caso de erro.
// ============================================================
export const getAllUsers = async (organizationId: string) => {
  try {
    // Passo 1: busca quem JÁ é membro da organização
    const members = await db.member.findMany({
      where: {
        organizationId,
      },
    });

    // Passo 2: busca todos os usuários que NÃO estão na lista
    // de membros. O operador "notIn" do Prisma faz essa filtragem.
    const users = await db.user.findMany({
      where: {
        id: {
          notIn: members.map((member) => member.userId),
        },
      },
    });

    return users;
  } catch (error) {
    console.log(error);
    return null;
  }
};