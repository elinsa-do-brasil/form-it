// ============================================================
// 📱 LAYOUT DA APLICAÇÃO (Grupo de Rotas: app)
// ============================================================
// Este layout envolve TODAS as páginas autenticadas da
// aplicação — a home, organizações, e qualquer página que
// o usuário só vê após fazer login.
//
// Contém o Header (barra de navegação) no topo e um
// container centralizado para o conteúdo.
//
// 💡 PONTO DE EXTENSÃO: adicione sidebars, breadcrumbs,
// ou outros elementos de navegação aqui.
// ============================================================

import { Header } from "@/components/structure/header";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Header: barra de navegação fixa no topo */}
      <Header />

      {/* Container principal do conteúdo */}
      <main className="container mx-auto px-4 py-4">{children}</main>
    </>
  );
}
