// ============================================================
// 🛡️ PERMISSÕES E ROLES (Controle de Acesso)
// ============================================================
// Este arquivo define o sistema de RBAC (Role-Based Access
// Control) da aplicação. Aqui decidimos "quem pode fazer o quê".
//
// 📌 COMO FUNCIONA:
// 1. Definimos STATEMENTS (permissões possíveis)
// 2. Criamos um ACCESS CONTROL com esses statements
// 3. Para cada ROLE, dizemos quais statements ele tem
//
// 🐤 Analogia: pense em um hotel.
// - "statement" = lista de coisas que alguém pode fazer
//   (abrir porta, usar piscina, acessar cozinha...)
// - "role" = tipo de hóspede (vip, regular, funcionário)
// - Cada tipo de hóspede tem diferentes permissões
//
// O Better Auth já vem com permissões padrão para organizações
// (defaultStatements), e aqui nós as herdamos.
//
// 💡 PONTO DE EXTENSÃO: para adicionar permissões customizadas:
// 1. Adicione ao objeto `statement`
// 2. Distribua nos roles (member, admin, owner)
// 3. Use authClient.organization.hasPermission() para verificar
//
// Exemplo de permissão customizada:
//   const statement = {
//     ...defaultStatements,
//     report: ["read", "create", "delete"] as const,
//   };
//   const admin = ac.newRole({
//     ...adminAc.statements,
//     report: ["read", "create"],
//   });
// ============================================================

// createAccessControl cria a instância do controle de acesso
import { createAccessControl } from "better-auth/plugins/access";

// Importa as permissões padrão do plugin organization:
// - defaultStatements: todas as ações possíveis (member, invitation, organization)
// - memberAc: permissões do role "member" (acesso básico)
// - adminAc: permissões do role "admin" (gerencia membros/convites)
// - ownerAc: permissões do role "owner" (tudo, inclusive deletar org)
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";

// ── Definição dos Statements (Permissões Possíveis) ───────
// Aqui listamos TODAS as ações que alguém pode fazer.
// Por enquanto, usamos apenas as padrões do Better Auth.
// Para adicionar permissões customizadas, estenda este objeto.
const statement = {
  ...defaultStatements,
  // 💡 Adicione suas permissões customizadas aqui:
  // report: ["read", "create", "delete"] as const,
} as const;

// Cria a instância do Access Control com nossos statements.
const ac = createAccessControl(statement);

// ── Definição dos Roles ───────────────────────────────────

// MEMBER (Membro): acesso básico à organização
// Pode: ver membros, ver convites, ver organização
// Não pode: editar, deletar, convidar
const member = ac.newRole({
  ...memberAc.statements,
  // 💡 Adicione permissões extras para member aqui
});

// ADMIN (Administrador): gerencia a organização
// Pode: tudo do member + convidar/remover membros,
// editar configurações da org
// Não pode: deletar a organização
const admin = ac.newRole({
  ...adminAc.statements,
  // 💡 Adicione permissões extras para admin aqui
});

// OWNER (Dono): acesso total
// Pode: absolutamente tudo, incluindo deletar a organização
// É o role atribuído automaticamente ao criador da org
const owner = ac.newRole({
  ...ownerAc.statements,
  // 💡 Adicione permissões extras para owner aqui
});

export { ac, owner, admin, member };
