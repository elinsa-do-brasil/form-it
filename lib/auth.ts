// ============================================================
// 🔐 CONFIGURAÇÃO DO BETTER AUTH (Lado do Servidor)
// ============================================================
// Este arquivo é o CORAÇÃO da autenticação do projeto.
// Aqui configuramos o Better Auth com:
//
// 1. BANCO DE DADOS: via Prisma adapter (PostgreSQL)
// 2. PROVEDORES OAUTH: Microsoft, Google e GitHub
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
// deve alterar os socialProviders conforme necessário e
// adicionar novos plugins (ex: twoFactor, passkey, admin).
// ============================================================

// Importação principal do Better Auth
import { betterAuth } from "better-auth";

// Plugin de organização: adiciona suporte multi-tenant com
// roles (owner, admin, member), convites, times, etc.
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { username } from "better-auth/plugins/username";
import { passkey } from "@better-auth/passkey";

// Nossas definições de permissões e roles customizadas.
// O "ac" é o Access Control (controle de acesso), e owner/admin/member
// são os roles disponíveis com suas respectivas permissões.
import { ac, owner, admin, member } from "@/server/permissions";

// Adaptador Prisma: traduz as operações do Better Auth
// para queries do Prisma (que por sua vez vira SQL).
import { prismaAdapter } from "better-auth/adapters/prisma";

// Nossa instância do banco de dados (ver lib/db.ts)
import { db } from "@/lib/db";

// Nossa função de envio de e-mail de autenticação
import {
  sendEmailVerificationLink,
  sendResetPasswordEmail,
} from "@/server/mail/auth";
import { buildPasskeyOptions } from "@/lib/passkey-config";

// Plugin nextCookies: integra os cookies do Better Auth
// com o sistema de cookies do Next.js (necessário para que
// Server Components consigam ler a sessão nos headers).
import { nextCookies } from "better-auth/next-js";

const passkeyOptions = buildPasskeyOptions({
  betterAuthUrl: process.env.BETTER_AUTH_URL,
  publicUrl: process.env.NEXT_PUBLIC_URL,
  passkeyOrigins: process.env.BETTER_AUTH_PASSKEY_ORIGINS,
  passkeyRpId: process.env.BETTER_AUTH_PASSKEY_RP_ID,
  passkeyRpName: process.env.BETTER_AUTH_PASSKEY_RP_NAME,
});

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
// - *_CLIENT_ID / *_CLIENT_SECRET: credenciais OAuth
// ============================================================
export const auth = betterAuth({
  // ── Banco de dados ──────────────────────────────────────
  // O prismaAdapter traduz as operações do Better Auth para
  // o Prisma, que por sua vez gera SQL para o PostgreSQL.
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),

  // ── Email & Password ────────────────────────────────────
  // Habilita e-mail/senha e ações como reset de senha.
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await sendResetPasswordEmail({
        user: { name: user.name, email: user.email },
        url
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmailVerificationLink({
        user: {
          name: user.name ?? "",
          email: user.email,
        },
        url,
      });
    },
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: false,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github", "microsoft"],
    },
  },

  // ── Provedores OAuth (Login Social) ─────────────────────
  // Cada provedor permite login com uma conta externa.
  // Para adicionar um novo: crie o app no portal do provedor,
  // pegue clientId e clientSecret, e adicione aqui.
  //
  // 💡 PONTO DE EXTENSÃO: remova provedores que não precisa
  // ou adicione novos (apple, discord, linkedin, etc.)
  socialProviders: {
    // Login com conta Microsoft (Azure AD)
    // tenantId "common" permite qualquer conta Microsoft
    // prompt "select_account" força a escolha de conta
    microsoft: {
      clientId: process.env.MICROSOFT_CLIENT_ID as string,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
      tenantId: "common",
      authority: "https://login.microsoftonline.com",
      prompt: "select_account",
    },

    // Login com conta Google
    // accessType "offline" gera um refresh token para acesso
    // prolongado (útil se precisar acessar APIs do Google)
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      accessType: "offline",
    },

    // Login com conta GitHub
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },

  // ── Plugins ─────────────────────────────────────────────
  // Plugins estendem as funcionalidades do Better Auth.
  // Cada plugin adicionado aqui precisa de seu equivalente
  // no client (ver lib/auth-client.ts).
  plugins: [
    // Plugin de organização: adiciona todo o sistema de
    // organizações, membros, roles e permissões.
    // O "ac" define quais ações cada role pode executar.
    organization({
      ac,
      roles: {
        owner, // Dono: acesso total, pode deletar a org
        admin, // Admin: gerencia membros e configurações
        member, // Membro: acesso básico
      },
    }),

    // Plugin nextCookies: OBRIGATÓRIO para Next.js.
    // Sem ele, os Server Components não conseguem ler a
    // sessão do usuário nos cookies da requisição.
    nextCookies(),

    // ================== NOVOS PLUGINS ================== //
    // 1. Two-Factor Authentication (MFA)
    // Permite uso restrito a TOTP (Authenticator app) e Códigos de Backup
    twoFactor(),

    // 2. Passkeys (WebAuthn)
    // Suporte nativo para autenticação biométrica / chaves de hardware
    passkey(passkeyOptions),

    // 3. Username
    // Permite login e registro usando 'username' além de 'email'
    username(),
  ],
});
