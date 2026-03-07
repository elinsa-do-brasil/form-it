// ============================================================
// 🔑 SERVER ACTIONS: SESSÃO DO USUÁRIO
// ============================================================
// Este arquivo contém funções que rodam NO SERVIDOR para
// verificar e obter a sessão do usuário logado.
//
// 📌 POR QUE SERVER ACTIONS?
// No Next.js, Server Actions são funções marcadas com
// "use server" que rodam exclusivamente no servidor. Elas
// podem acessar o banco de dados, checar cookies e fazer
// coisas que seriam inseguras no navegador.
//
// 🐤 Analogia: é como perguntar ao porteiro do prédio
// "quem está neste apartamento?" — só o porteiro (servidor)
// tem acesso ao registro de moradores (banco de dados).
// ============================================================

"use server";

// A função `cache` do React garante que, durante uma mesma
// renderização de página, se getServerSession() for chamada
// múltiplas vezes, o Better Auth só faz UMA consulta ao banco.
import { cache } from "react";

// `headers()` do Next.js retorna os headers HTTP da request.
// O Better Auth precisa deles para ler o cookie de sessão.
import { headers } from "next/headers";

// Nossa instância do Better Auth (configuração do servidor)
import { auth } from "@/lib/auth";

// Nossa instância do Prisma (banco de dados)
import { db } from "@/lib/db";

// Função de redirecionamento do Next.js
import { redirect } from "next/navigation";

// ============================================================
// 📋 getServerSession
// ============================================================
// Retorna a sessão do usuário atual (ou null se não logado).
// É a forma mais LEVE de verificar se alguém está logado.
//
// Uso típico:
//   const session = await getServerSession();
//   if (!session) redirect("/entrar");
//
// O `cache()` garante que múltiplas chamadas na mesma request
// reutilizam o resultado (evita consultas repetidas ao banco).
// ============================================================
export const getServerSession = cache(async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session;
});

// ============================================================
// 👤 getCurrentUser
// ============================================================
// Retorna a sessão + dados completos do usuário do banco.
// Se não estiver logado, REDIRECIONA para /entrar.
//
// Diferente do getServerSession, esta função:
// 1. Garante que há sessão (redireciona se não houver)
// 2. Busca dados extras do User no banco (via Prisma)
// 3. Retorna tudo junto (sessão + user completo)
//
// 🐤 Analogia: getServerSession é perguntar "tem alguém aqui?"
// enquanto getCurrentUser é "tem alguém aqui? SE SIM, me diz
// tudo sobre essa pessoa."
// ============================================================
export async function getCurrentUser() {
  // Passo 1: verifica se o usuário está logado
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  // Passo 2: se não estiver logado, redireciona para login
  if (!session) {
    redirect("/entrar");
  }

  // Passo 3: busca dados completos do usuário no banco
  // (a sessão só contém id, name, email, image — dados básicos)
  const currentUser = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  // Passo 4: se o usuário não existe no banco (improvável, mas seguro)
  if (!currentUser) {
    redirect("/entrar");
  }

  // Retorna tudo: sessão do Better Auth + dados do Prisma
  return {
    ...session,
    currentUser,
  };
}
