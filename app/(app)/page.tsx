// ============================================================
// 🏠 PÁGINA INICIAL (Home Page)
// ============================================================
// Esta é a primeira página que o usuário vê após fazer login.
// Mostra uma mensagem de boas-vindas e informações sobre
// a organização ativa (se houver uma selecionada).
//
// 📌 COMPORTAMENTO:
// - Sem org ativa → mostra prompt para selecionar uma
// - Com org ativa → mostra painel de boas-vindas com dados
//
// 💡 PONTO DE EXTENSÃO: ao fazer fork deste projeto, esta
// é a página que você vai personalizar para o seu caso de
// uso. Pode adicionar:
// - Dashboard com métricas
// - Lista de itens recentes
// - Atalhos rápidos
// - Qualquer conteúdo específico do seu projeto
// ============================================================

import { getServerSession } from "@/server/actions/session";

export default async function HomePage() {
  // Obtém a sessão do usuário (se está logado)
  const session = await getServerSession();

  // ── Cenário 1: Sem organização ativa ────────────────────
  // Quando o usuário não tem nenhuma organização selecionada.
  // Isso acontece quando:
  // - Ele acabou de criar a conta e não pertence a nenhuma org
  // - Ele tem várias orgs mas não selecionou nenhuma
  if (!session?.session?.activeOrganizationId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-bold mb-2">Bem-vindo ao RAAuth</h2>
        <p className="text-muted-foreground">
          Selecione uma organização no menu de conta para começar.
        </p>
      </div>
    );
  }

  // ── Cenário 2: Com organização ativa ────────────────────
  // O usuário tem uma org selecionada — mostra o painel.
  //
  // 💡 CUSTOMIZE AQUI: substitua este bloco pelo conteúdo
  // principal do seu aplicativo.
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h2 className="text-2xl font-bold mb-2">Bem-vindo ao RAAuth</h2>
      <p className="text-muted-foreground">
        Você está conectado. Use o menu de conta para gerenciar sua organização.
      </p>
    </div>
  );
}
