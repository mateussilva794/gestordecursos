# Gestor de Cursos e Certificados

Plataforma interna de treinamentos e certificação para empresa de contabilidade. Cada colaborador faz login individual, assiste o curso em link externo (Cefis), responde quiz de validação e recebe certificado nominal em PDF.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript** strict
- **PostgreSQL 16** + **Prisma** ORM
- **NextAuth.js v4** (credentials)
- **Tailwind CSS** + **shadcn/ui**
- **@react-pdf/renderer** (Fase 7)
- **react-hook-form + zod** (Fase 3+)

## Pre-requisitos

- **Node.js 22 LTS** — https://nodejs.org/
- **pnpm 9+** — `npm install -g pnpm`
- **Docker Desktop** (para Postgres local)
- **Git**

## Setup local (primeira vez)

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env

# Gere o NEXTAUTH_SECRET e cole em .env:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# 3. Subir o banco local (Postgres em Docker)
pnpm db:up

# 4. Sincronizar o schema com o banco (Fase 0: apenas testa a conexão)
pnpm db:push

# 5. Rodar o dev server
pnpm dev
```

Abra http://localhost:3000.

## Comandos uteis

| Comando             | Descrição                                            |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Inicia o servidor de desenvolvimento                 |
| `pnpm build`        | Build de produção                                    |
| `pnpm start`        | Roda o build de produção                             |
| `pnpm lint`         | ESLint                                               |
| `pnpm typecheck`    | TypeScript sem emitir arquivos                       |
| `pnpm db:up`        | Sobe o Postgres via Docker                           |
| `pnpm db:down`      | Para os containers Docker                            |
| `pnpm db:studio`    | Abre o Prisma Studio (GUI do banco)                  |
| `pnpm db:migrate`   | Cria/aplica uma nova migration                       |
| `pnpm db:push`      | Sincroniza schema sem migration (dev rápido)         |
| `pnpm db:reset`     | Reseta o banco e reaplica migrations                 |
| `pnpm db:seed`      | Roda o script de seed                                |

## Estrutura de pastas

```
.
├─ app/                Rotas e páginas (App Router)
├─ components/         Componentes reutilizáveis (ui/, forms/, layouts/)
├─ lib/                Utilitários (db, auth, validators, pdf)
├─ prisma/             Schema, migrations, seed
├─ public/             Assets estáticos
├─ types/              Ampliações de tipos
├─ docker-compose.yml  Postgres local
└─ ...                 Configs (next, ts, tailwind, postcss, eslint)
```

## Adicionar componentes shadcn/ui

```bash
npx shadcn@latest add button
npx shadcn@latest add input
# ...
```

Os componentes vão para `components/ui/`.

## Troubleshooting

**Porta 5432 já está em uso**
Outro Postgres rodando localmente. Pare-o ou altere a porta no `docker-compose.yml` e em `DATABASE_URL` no `.env`.

**Erro de conexão com o banco**
Confira `docker ps` se o container `treinamentos-postgres` está saudável (`healthy`). Se não, `pnpm db:up` de novo e aguarde o healthcheck.

**`NEXTAUTH_SECRET` ausente em produção**
Variável obrigatória em produção. Gere e configure no host antes do deploy.

**Permissão negada no Windows ao rodar Docker**
Garanta que o Docker Desktop está em execução e que o usuário pertence ao grupo `docker-users`.

## Roadmap por fases

- [x] **Fase 0** — Setup (Next.js, Prisma, Docker, Tailwind, NextAuth skeleton)
- [ ] **Fase 1** — Schema completo + migrations + seed de dados de teste
- [ ] **Fase 2** — Autenticação (login, logout, recuperação, middleware de roles)
- [ ] **Fase 3** — Admin: CRUD de cursos, perguntas, alternativas
- [ ] **Fase 4** — Admin: CRUD de usuários e matrículas
- [ ] **Fase 5** — Colaborador: dashboard e página de curso
- [ ] **Fase 6** — Motor do quiz
- [ ] **Fase 7** — Certificado PDF + página pública de validação
- [ ] **Fase 8** — Relatórios e exportação CSV
- [ ] **Fase 9** — Auditoria, LGPD, segurança final
- [ ] **Fase 10** — Polimento, testes e2e, deploy

## Licença

Uso interno — Dacto.
