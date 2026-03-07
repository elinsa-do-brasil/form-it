# Raauth - Base Reutilizável de Autenticação

Uma base open source de autenticação com suporte a organizações multi-tenant, pronta para ser forkada e adaptada para qualquer projeto. Construída com **Better Auth**, **Next.js 16** e **Prisma**.

## 🎯 O que é isso?

Este projeto é um **template de autenticação** completo que você pode usar como ponto de partida para qualquer aplicação web. Em vez de configurar autenticação do zero toda vez, faça um fork deste repositório e adapte para o seu caso de uso.

### O que já vem pronto:

- 🔐 **Login por e-mail/senha** com validação
- 🌐 **Login social** (Microsoft, Google, GitHub) via OAuth
- 🏢 **Sistema de organizações** multi-tenant com roles
- 👥 **Gerenciamento de membros** (adicionar, remover, roles)
- 📨 **E-mails transacionais** (boas-vindas, remoção)
- 🎨 **UI completa** com shadcn/ui, tema claro/escuro
- 📝 **Comentários didáticos** em todo o código

## 🚀 Tecnologias

### Core

- **[Next.js 16](https://nextjs.org)** - Framework React full-stack
- **[React 19](https://react.dev)** - Biblioteca para interfaces
- **[TypeScript](https://www.typescriptlang.org)** - JavaScript tipado

### Autenticação & Autorização

- **[Better Auth](https://www.better-auth.com)** - Framework de autenticação moderno

### Banco de Dados & ORM

- **[PostgreSQL](https://postgresql.org)** - Banco relacional
- **[Prisma](https://www.prisma.io)** - ORM com type-safety

### UI & Estilização

- **[Tailwind CSS 4](https://tailwindcss.com)** - Utility-first CSS
- **[Radix UI](https://www.radix-ui.com)** - Componentes acessíveis
- **[Lucide React](https://lucide.dev)** - Ícones modernos
- **[Sonner](https://sonner.emilkowal.ski)** - Notificações toast

### Formulários & Validação

- **[React Hook Form](https://react-hook-form.com)** - Formulários performáticos
- **[Zod](https://zod.dev)** - Validação de schemas

### E-mail

- **[React Email](https://react.email)** - Templates de e-mail
- **[Resend](https://resend.com)** - Envio de e-mails

## 📁 Estrutura do Projeto

```
raauth/
├── app/                        # App Router do Next.js
│   ├── (auth)/                 # Rotas de autenticação (login, registro)
│   │   ├── entrar/             # Página de login
│   │   └── criar-conta/        # Página de registro
│   ├── (app)/                  # Rotas protegidas da aplicação
│   │   ├── page.tsx            # Home (customize para seu projeto)
│   │   └── org/[slug]/         # Página de detalhes da organização
│   └── api/auth/[...all]/      # API catch-all do Better Auth
├── server/                     # Lógica server-side
│   ├── actions/                # Server Actions (sessão, membros, etc.)
│   ├── mail/                   # Funções de envio de e-mail
│   └── permissions.ts          # Definição de roles e permissões
├── components/                 # Componentes React
│   ├── auth/                   # Formulários e botões de auth
│   ├── account/                # Menu de conta/perfil
│   ├── organization/           # Gestão de organizações
│   ├── structure/              # Header, logo, layout
│   └── ui/                     # shadcn/ui (primitivos)
├── lib/                        # Configurações e utilitários
│   ├── auth.ts                 # Config do Better Auth (server)
│   ├── auth-client.ts          # Config do Better Auth (client)
│   ├── db.ts                   # Instância do Prisma
│   ├── errors.ts               # Mapeamento de erros i18n
│   └── utils.ts                # Utilitários (cn)
└── prisma/
    └── schema.prisma           # Schema do banco de dados
```

## 🛠️ Como usar

### Pré-requisitos

- Node.js 18+
- PostgreSQL
- pnpm (recomendado)

### Instalação

1. Fork e clone o repositório:

```bash
git clone https://github.com/seu-usuario/seu-fork.git
cd seu-fork
```

2. Instale as dependências:

```bash
pnpm install
```

3. Configure as variáveis de ambiente:

```bash
cp .example.env .env
# Edite o .env com suas credenciais
```

4. Gere o client Prisma e execute as migrações:

```bash
pnpm run db:client
pnpm run db:migrate
```

5. Inicie o servidor de desenvolvimento:

```bash
pnpm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## 🔀 Como fazer fork e adaptar

### 1. Personalize o auth (`lib/auth.ts`)

- Remova ou adicione provedores OAuth
- Configure plugins adicionais (twoFactor, passkey, etc.)
- Ajuste o basePath se necessário

### 2. Adapte o schema (`prisma/schema.prisma`)

- Adicione seus models de domínio
- Crie relações com Organization (multi-tenant)
- Rode `pnpm run db:migrate` após alterações

### 3. Customize a home (`app/(app)/page.tsx`)

- Substitua pelo conteúdo do seu aplicativo
- Adicione rotas em `app/(app)/`

### 4. Ajuste o visual

- Edite as cores em `app/globals.css`
- Troque o logo em `components/structure/logo.tsx`
- Modifique o metadata em `app/layout.tsx`

### 5. Configure os e-mails

- Atualize o domínio de envio em `server/mail/membership.ts`
- Crie templates React Email em uma pasta `emails/`

## 📦 Scripts Disponíveis

| Script               | Descrição                            |
| -------------------- | ------------------------------------ |
| `pnpm run dev`       | Servidor de desenvolvimento          |
| `pnpm run build`     | Build de produção                    |
| `pnpm run start`     | Servidor de produção                 |
| `pnpm run lint`      | Linter                               |
| `pnpm run db:client` | Gera o client do Prisma              |
| `pnpm run db:migrate`| Executa migrações do banco           |
| `pnpm run db:studio` | Abre o Prisma Studio                 |
| `pnpm run dev:e`     | Preview de e-mails (React Email)     |

## 📄 Licença

MIT

---

Desenvolvido com ❤️ por **Raave Aires**
