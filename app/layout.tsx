// ============================================================
// 🏠 LAYOUT RAIZ (Root Layout)
// ============================================================
// Este é o layout principal de TODA a aplicação Next.js.
// Ele envolve todas as páginas e define:
//
// 1. HTML base (idioma, metatags, body)
// 2. Fontes do Google Fonts
// 3. Tema claro/escuro (via next-themes)
// 4. Toaster para notificações (via Sonner)
//
// 📌 NO NEXT.JS, layouts são "cascata":
// Root Layout → envolve TUDO
//   ├── (auth) layout → envolve páginas de login/registro
//   └── (app) layout → envolve páginas autenticadas
//
// 🐤 Analogia: é a "casca" do aplicativo — o container que
// define coisas globais como fontes, cores e tema.
//
// 💡 PONTO DE EXTENSÃO:
// - Altere o metadata para o nome do seu projeto
// - Troque as fontes se quiser um visual diferente
// - Adicione providers globais aqui (ex: QueryClient)
// ============================================================

// Tipo do Next.js para definir metadados da página
import type { Metadata } from "next";

// CSS global da aplicação (variáveis de tema, reset, utilities)
import "./globals.css";

// Fontes do Google Fonts carregadas via next/font
// (otimiza o carregamento e evita FOIT - Flash of Invisible Text)
import { Averia_Serif_Libre, Geist, Geist_Mono } from "next/font/google";

// ThemeProvider: gerencia o tema claro/escuro da aplicação
import { ThemeProvider } from "@/components/ui/theme-provider";

// Toaster: componente que renderiza notificações toast
// (aquelas mensagens popups que aparecem e somem)
import { Toaster } from "@/components/ui/sonner";

// ── Configuração de Fontes ────────────────────────────────
// Cada fonte é instanciada com suas configurações.
// O "variable" cria uma CSS variable (ex: --font-averia)
// que pode ser usada no Tailwind ou CSS puro.

const averia = Averia_Serif_Libre({
  weight: ["300", "400", "700"],
  style: "normal",
  variable: "--font-averia",
  subsets: ["latin"],
  display: "swap", // Mostra texto imediatamente, troca a fonte quando carrega
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ── Metadados Globais ─────────────────────────────────────
// Estes metadados aparecem na aba do navegador e nos
// resultados de busca do Google.
//
// 💡 ALTERAR: troque pelo nome do seu projeto ao fazer fork
export const metadata: Metadata = {
  title: {
    template: "Raauth: %s", // Páginas: "Raauth: Nome da Página"
    default: "Raauth", // Página sem título específico
  },
  generator: "Next.js",
  applicationName: "raauth",
  authors: [{ name: "Raave Aires", url: "https://github.com/raave-aires" }],
  creator: "Raave Aires",
  publisher: "Raave Aires",
};

// ── Componente Root Layout ────────────────────────────────
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning // Evita warnings do next-themes
      className="overflow-x-hidden no-scrollbar"
    >
      <body
        className={`${averia.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* ThemeProvider envolve tudo para gerenciar dark/light mode */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system" // Segue o tema do sistema operacional
          enableSystem
          disableTransitionOnChange // Evita flash ao trocar de tema
        >
          {children}
          {/* Toaster fica aqui para estar disponível em TODAS as páginas */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
