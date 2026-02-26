# AGENTS.md

## Cursor Cloud specific instructions

### Overview
StarManag is a **single Next.js 14 application** (not a monorepo) serving as a restaurant management and food delivery platform. It uses Apollo Server (GraphQL) via Next.js API routes, Prisma ORM with PostgreSQL, and Zustand for state management.

### Prerequisites
- **Node.js v22+** (available via nvm)
- **PostgreSQL 16** must be running (`sudo pg_ctlcluster 16 main start`)
- **Yarn** is the package manager (lockfile: `yarn.lock`)

### Environment Variables
All required secrets are injected as environment variables in Cloud Agent VMs. They override values in `.env`. Key variables: `DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GRAPHQL_API_KEY`, `NEXT_PUBLIC_GRAPHQL_API`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

If running without injected secrets, create a `.env` file in the project root (see README for guidance). The `.env` file is gitignored.

### Running the Application
- `yarn dev` — starts Next.js dev server on port 3000
- The GraphQL API is available at `/api/graphql` (requires `GRAPHQL_API_KEY` as Bearer token)
- Auth routes at `/api/auth/[...nextauth]` (Google + Facebook OAuth)

### Key Commands
| Task | Command |
|------|---------|
| Install deps | `yarn install` |
| Generate Prisma client | `npx prisma generate` |
| Apply migrations | `npx prisma migrate deploy` |
| Lint | `yarn lint` |
| Dev server | `yarn dev` |
| GraphQL codegen | `yarn codegen` |
| Build | `yarn build` |

### Gotchas
- **No automated test suite exists** — there are no unit/integration tests configured. Validation is via linting (`yarn lint`) and manual testing.
- **Authentication required for ordering** — adding items to cart and accessing `/user/*`, `/dashboard/*`, `/cart` checkout requires OAuth login (Google/Facebook). The homepage and menu browsing work without auth.
- **Prisma generate must run before dev/build** — the Prisma client and Pothos types are generated into `node_modules`. After `yarn install`, always run `npx prisma generate`.
- **Remote Supabase DB** — the injected `DATABASE_URL` points to a remote Supabase PostgreSQL instance. Migrations are already applied. Use `npx prisma migrate deploy` (not `migrate dev`) to avoid creating new migrations against the remote DB.
- **`shadowDatabaseUrl` in schema.prisma** — Prisma schema references `SHADOW_DATABASE_URL` for migrations. This is pre-configured in secrets.
