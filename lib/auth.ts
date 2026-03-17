// ============================================================
// 🔐 CONFIGURAÇÃO DO BETTER AUTH (Lado do Servidor)
// ============================================================
// Este arquivo é o CORAÇÃO da autenticação do projeto.
// Aqui configuramos o Better Auth com:
//
// 1. BANCO DE DADOS: via Prisma adapter (PostgreSQL)
// 2. PROVEDOR OAUTH: Microsoft
// 3. PLUGINS: organização (multi-tenant) + cookies do Next.js
//
// 📌 COMO FUNCIONA:
// O Better Auth expõe uma API REST automaticamente.
// Todas as rotas ficam em /api/auth/* (catch-all route).
// Esta config é usada APENAS no servidor (Server Components,
// API Routes, Server Actions).
//
// 🐤 Analogia: este arquivo é como o "painel de controle"
// de uma portaria — define quais crachás são aceitos (OAuth),
// como verificar identidades (banco de dados) e quais regras
// de acesso existem (permissões/roles).
//
// 💡 PONTO DE EXTENSÃO: ao fazer fork deste projeto, você
// deve alterar os socialProviders conforme necessário.
// ============================================================

// Importação principal do Better Auth
import { betterAuth } from "better-auth";

// Plugin de organização: adiciona suporte multi-tenant com
// roles (owner, admin, member), convites, times, etc.
import { organization } from "better-auth/plugins/organization";

// Nossas definições de permissões e roles customizadas.
// O "ac" é o Access Control (controle de acesso), e owner/admin/member
// são os roles disponíveis com suas respectivas permissões.
import { ac, owner, admin, member } from "@/server/permissions";

// Adaptador Prisma: traduz as operações do Better Auth
// para queries do Prisma (que por sua vez vira SQL).
import { prismaAdapter } from "better-auth/adapters/prisma";

// Nossa instância do banco de dados (ver lib/db.ts)
import { db } from "@/lib/db";

// Plugin nextCookies: integra os cookies do Better Auth
// com o sistema de cookies do Next.js (necessário para que
// Server Components consigam ler a sessão nos headers).
import { nextCookies } from "better-auth/next-js";

// ============================================================
// 🎯 EXPORTAÇÃO DA INSTÂNCIA DO AUTH
// ============================================================
// Esta instância `auth` é usada em:
// - app/api/auth/[...all]/route.ts → expõe a API
// - server/actions/*.ts → verificar sessão, adicionar membros, etc.
//
// ⚠️ VARIÁVEIS DE AMBIENTE NECESSÁRIAS:
// - BETTER_AUTH_SECRET: chave de criptografia (min 32 chars)
// - BETTER_AUTH_URL: URL base da aplicação
// - DATABASE_URL: URL de conexão do PostgreSQL
// - MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET: credenciais OAuth
// ============================================================
export const auth = betterAuth({
  // ── Banco de dados ──────────────────────────────────────
  // O prismaAdapter traduz as operações do Better Auth para
  // o Prisma, que por sua vez gera SQL para o PostgreSQL.
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["microsoft"],
    },
  },

  // ── Provedor OAuth (Login Social) ───────────────────────
  // A aplicação aceita autenticação apenas com a Microsoft.
  socialProviders: {
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: process.env.MICROSOFT_TENANT_ID as string,
      authority: "https://login.microsoftonline.com",
      prompt: "select_account",
    },
  },

  // ── Plugins ─────────────────────────────────────────────
  // Plugins estendem as funcionalidades do Better Auth.
  plugins: [
    organization({
      ac,
      roles: {
        owner,
        admin,
        member,
      },
    }),

    nextCookies(),
  ],
});
