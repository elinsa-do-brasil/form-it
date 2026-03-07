// ============================================================
// 🗄️ INSTÂNCIA DO BANCO DE DADOS (Prisma Client)
// ============================================================
// Este arquivo cria UMA ÚNICA instância do Prisma Client para
// toda a aplicação. Isso é importante porque:
//
// 1. Em desenvolvimento, o Next.js faz "hot reload" (recarrega
//    o código quando você salva). Cada reload criaria uma NOVA
//    conexão com o banco, e o PostgreSQL tem um limite de
//    conexões simultâneas (geralmente 100).
//
// 2. Para evitar isso, guardamos a instância no `globalThis`
//    (um objeto global do Node.js que sobrevive ao hot reload).
//    Assim, reutilizamos a mesma conexão.
//
// 3. Em produção, isso não é necessário (não tem hot reload),
//    mas não causa problemas — é apenas uma garantia.
//
// 🐤 Analogia: imagine que cada conexão com o banco é uma
// linha telefônica. Em vez de abrir uma nova ligação a cada
// reload, guardamos a ligação aberta num "bolso global".
// ============================================================

// Carrega as variáveis de ambiente do arquivo .env
import "dotenv/config";

// PrismaPg é o adaptador que conecta o Prisma ao PostgreSQL
// usando o driver nativo `pg` (mais performático que o padrão)
import { PrismaPg } from "@prisma/adapter-pg";

// PrismaClient é a classe gerada pelo Prisma a partir do nosso
// schema.prisma. Ela contém os métodos para cada model:
// db.user.findMany(), db.organization.create(), etc.
import { PrismaClient } from "@/prisma/client/client";

// Pega a URL de conexão do banco de dados da variável de ambiente.
// Exemplo: "postgresql://user:password@host:5432/database"
const connectionString = `${process.env.DATABASE_URL}`;

// Cria o adaptador PostgreSQL com a URL de conexão.
// Este adaptador gerencia o pool de conexões automaticamente.
const adapter = new PrismaPg({ connectionString });

// Declara uma variável global para armazenar a instância do Prisma.
// O `declare global` diz ao TypeScript: "confia, essa variável existe
// no escopo global, mesmo que você não veja ela sendo criada aqui."
declare global {
  var prisma: PrismaClient | undefined;
}

// A "mágica" do singleton:
// - Se já existe uma instância no globalThis, reutiliza ela
// - Se não existe (primeiro load), cria uma nova
const db = globalThis.prisma || new PrismaClient({ adapter });

// Em desenvolvimento, guarda a instância no globalThis para
// sobreviver ao hot reload. Em produção, isso é desnecessário
// porque o servidor não faz hot reload.
if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = db;
}

export { db };
