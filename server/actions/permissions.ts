// ============================================================
// 🛡️ SERVER ACTIONS: VERIFICAÇÃO DE PERMISSÕES
// ============================================================
// Este arquivo contém funções para verificar se o usuário
// logado tem permissões específicas na organização ativa.
//
// 📌 COMO FUNCIONA:
// O Better Auth tem um sistema de permissões baseado em
// "statements" (ações) e "roles" (papéis). Cada role pode
// executar certas ações.
//
// A função isAdmin() verifica se o usuário logado pode
// UPDATE e DELETE a organização — ou seja, se é admin/owner.
//
// 🐤 Analogia: é como mostrar o crachá na entrada VIP —
// o segurança (servidor) verifica se o crachá (role) tem
// acesso à área restrita (permissão).
//
// 💡 PONTO DE EXTENSÃO: crie funções similares para
// verificar permissões customizadas. Ex:
//   export const canCreateReports = async () => {
//     return auth.api.hasPermission({
//       headers: await headers(),
//       body: { permission: { report: ["create"] } }
//     });
//   };
// ============================================================

"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ============================================================
// 🔒 isAdmin
// ============================================================
// Verifica se o usuário logado é admin ou owner da org ativa.
//
// Retorna:
// - true (boolean) se tem permissão
// - { success: false, error: ... } se não tem
//
// Usa a API hasPermission do Better Auth, que verifica:
// 1. Se há sessão ativa
// 2. Se há organização ativa na sessão
// 3. Se o role do usuário na org tem as permissões pedidas
// ============================================================
export const isAdmin = async () => {
  try {
    const { success, error } = await auth.api.hasPermission({
      headers: await headers(),
      body: {
        permission: {
          // Pede permissão de "update" e "delete" na organização.
          // Apenas admin e owner têm essas permissões nos
          // statements padrão do Better Auth.
          organization: ["update", "delete"],
        },
      },
    });

    if (error) {
      return {
        success: false,
        error: error || "Você não tem permissão para realizar esta ação",
      };
    }

    return success;
  } catch (error) {
    return {
      success: false,
      error: error || "Você não tem permissão para realizar esta ação",
    };
  }
};