// ============================================================
// 🔗 ROTA CATCH-ALL DO BETTER AUTH
// ============================================================
// Este arquivo é a "porta de entrada" da API do Better Auth.
// Ele captura TODAS as requisições feitas para /api/auth/*
// e deixa o Better Auth processá-las.
//
// 📌 COMO FUNCIONA:
// O Better Auth expõe vários endpoints automaticamente:
//   POST /api/auth/sign-in/email → login por e-mail
//   POST /api/auth/sign-up/email → criar conta
//   POST /api/auth/sign-in/social → login OAuth
//   GET  /api/auth/session → obter sessão atual
//   POST /api/auth/sign-out → logout
//   ... e muitos outros (veja a documentação)
//
// O [...all] no nome da pasta é uma "catch-all route" do
// Next.js — captura qualquer caminho após /api/auth/.
//
// 🐤 Analogia: é como uma recepcionista que atende QUALQUER
// ligação que chega no ramal /api/auth/ e encaminha para o
// departamento certo (login, registro, logout, etc.).
//
// ⚠️ NÃO MODIFIQUE este arquivo ao fazer fork, a menos que
// precise mudar o basePath do Better Auth.
// ============================================================

import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// toNextJsHandler converte a instância do Better Auth em
// handlers HTTP compatíveis com o Next.js App Router.
// Exportamos GET e POST pois o Better Auth usa ambos os métodos.
export const { POST, GET } = toNextJsHandler(auth);