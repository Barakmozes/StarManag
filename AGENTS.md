# AGENTS.md

## Cursor Cloud specific instructions

### Overview
StarManag is a **single Next.js 14 application** (not a monorepo) — a full-stack restaurant management and food delivery platform. The tech stack:
- **Frontend**: React (Next.js App Router), TailwindCSS, Headless UI, Zustand (state), urql (GraphQL client)
- **Backend**: Apollo Server (GraphQL) via Next.js API routes, Pothos (code-first schema builder)
- **Database**: PostgreSQL via Prisma ORM, hosted on Supabase
- **Auth**: NextAuth with Google + Facebook OAuth providers
- **Storage**: Supabase Storage for image uploads (public bucket `Bucket_StarMang`)
- **Payments**: PayPlus API (Israeli payment gateway) — not Stripe (docs reference Stripe but codebase uses PayPlus)
- **Maps**: Mapbox for geocoding and delivery tracking

### Prerequisites
- **Node.js v22+** (available via nvm)
- **PostgreSQL 16** must be running (`sudo pg_ctlcluster 16 main start`) — needed only for local fallback; injected secrets point to remote Supabase DB
- **Yarn** is the package manager (lockfile: `yarn.lock`)

### Environment Variables
All required secrets are injected as environment variables in Cloud Agent VMs. They override values in `.env`. Key variables: `DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GRAPHQL_API_KEY`, `NEXT_PUBLIC_GRAPHQL_API`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_MAPBOX_TOKEN`, `PAYPLUS_API_KEY`, `PAYPLUS_SECRET_KEY`, `PAYPLUS_PAGE_UID`.

If running without injected secrets, create a `.env` file in the project root (see README for guidance). The `.env` file is gitignored.

### Running the Application
- `yarn dev` — starts Next.js dev server on port 3000
- The GraphQL API is available at `/api/graphql` (requires `GRAPHQL_API_KEY` as Bearer token in `Authorization` header)
- Auth routes at `/api/auth/[...nextauth]` (Google + Facebook OAuth)
- Payment routes at `/api/payplus/[total]`
- Google Reviews API at `/api/google-reviews`

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

### Application Architecture

#### Route Groups and Pages
The app uses Next.js route groups for organizational separation:

| Route Group | Pages | Access |
|-------------|-------|--------|
| `/` (public) | Homepage, `/login`, `/cart`, `/contact-us`, `/faqs`, `/help`, `/privacy`, `/shipping`, `/terms-of-use` | Public |
| `/payment-success`, `/payment-failure` | Payment result pages | Requires auth (307 redirect) |
| `(user)/user/*` | `/user`, `/user/orders`, `/user/favorites`, `/user/help` | Requires auth (307 redirect) |
| `(dashboard)/dashboard/*` | `/dashboard`, `/dashboard/orders`, `/dashboard/users`, `/dashboard/menu`, `/dashboard/deliveries`, `/dashboard/notifications`, `/dashboard/settings` | Requires ADMIN role (307 redirect) |

#### Role-Based Homepage Rendering
The homepage (`app/page.tsx`) renders different content based on user role:
- **USER / ADMIN / DELIVERY / unauthenticated**: Shows `HeroSection` + `Promos` + `Categories` + `MenuSection`
- **WAITER / MANAGER**: Shows `ZoneRestaurant` (table/floor management interface) + `Categories` + `MenuSection`

The **"Switch Role"** button in the header (visible when logged in) opens a modal that calls the `editUserRole` GraphQL mutation, allowing the current user to change their own role. This is how you switch between the customer view and the restaurant-interface view.

#### GraphQL Schema (16 domain modules)
Schema is built code-first with Pothos and organized under `graphql/schema/`:
- **Core**: User, Menu, Order, Category, Favorite, Profile, Notification
- **Restaurant**: Area, Table, GridConfig, TableUsage, Reservation, Waitlist, Restaurant
- **Operations**: Dashboard (KPIs/revenue queries), Delivery

The API exposes 47 queries and 55 mutations. Key query patterns:
- `getMenus(first, after)` — cursor-based pagination (Relay-style)
- `getCategories` — returns all categories
- `getAreas`, `getTables` — floor plan management
- `getDashboardKpis`, `getDashboardRevenue` — analytics with date-range comparison

#### Zustand Stores (`lib/store.ts`, `lib/AreaStore.ts`)
- **`useCartStore`** — cart items, table association, persisted to localStorage (key: `"You&i_cart"`)
- **`useSideBarDrawer`** — sidebar open/close state
- **`useLoginModal`** — login modal visibility
- **`useRestaurantStore`** — floor areas, tables, zoom/scale, dirty-state tracking for unsaved table positions (key: `"restaurant-areas"`)

#### Prisma Schema (18 models)
Models: Account, Session, User, Profile, VerificationToken, Notification, Restaurant, Menu, Category, Order, Delivery, Favorite, Area, GridConfig, Table, TableUsage, Reservation, Waitlist

Key enums: `Role` (USER, ADMIN, DELIVERY, WAITER, MANAGER), `OrderStatus`, `ReservationStatus`, `NotificationPriority`, `NotificationStatus`, `WaitlistStatus`

### Gotchas
- **No automated test suite exists** — there are no unit/integration tests configured. Validation is via linting (`yarn lint`) and manual testing.
- **Authentication required for ordering** — adding items to cart and accessing `/user/*`, `/dashboard/*`, `/cart` checkout requires OAuth login (Google/Facebook). The homepage and menu browsing work without auth.
- **Prisma generate must run before dev/build** — the Prisma client and Pothos types are generated into `node_modules`. After `yarn install`, always run `npx prisma generate`.
- **Remote Supabase DB** — the injected `DATABASE_URL` points to a remote Supabase PostgreSQL instance. Migrations are already applied. Use `npx prisma migrate deploy` (not `migrate dev`) to avoid creating new migrations against the remote DB.
- **`shadowDatabaseUrl` in schema.prisma** — Prisma schema references `SHADOW_DATABASE_URL` for migrations. This is pre-configured in secrets.
- **PayPlus, not Stripe** — the uploaded project docs reference Stripe, but the actual codebase uses PayPlus (Israeli payment gateway) at `/api/payplus/[total]`.
- **Hebrew content** — restaurant names, area names, user names, and some UI labels are in Hebrew. The app supports English (`en`) and Hebrew (`he`) locales via `LangCode` type.
- **Cart persistence key** — Zustand cart store persists to localStorage under key `"You&i_cart"` (the project's original name was "you-and-i" per `package.json`).
- **GraphQL API key validation** — the GraphQL endpoint at `/api/graphql` validates a Bearer token from the `Authorization` header against `process.env.GRAPHQL_API_KEY`. All client requests must include this header. To test queries: `curl -H "Authorization: Bearer $GRAPHQL_API_KEY" -H "Content-Type: application/json" -d '{"query":"{ getMenus(first:3) { edges { node { title } } } }"}' $NEXT_PUBLIC_GRAPHQL_API`
- **Middleware protects routes** — `middleware.ts` uses `withAuth` from `next-auth/middleware` to restrict `/dashboard/*`, `/user/*`, `/pay/*`, and `/payment-success` routes. Dashboard access requires ADMIN role specifically.
- **Restaurant interface visibility** — the `ZoneRestaurant` floor management component only renders on the homepage for WAITER or MANAGER roles. Use the "Switch Role" button in the header to change the current user's role.
- **Image domains** — `next.config.js` allows images from `lh3.googleusercontent.com`, `platform-lookaside.fbsbx.com`, and the Supabase storage domain. Adding new image hosts requires updating this config.
- **AreaStore merge strategy** — `useRestaurantStore.setTables()` uses a merge strategy that preserves locally "dirty" table positions during server refetches, preventing unsaved layout edits from being overwritten by reservation toggles or other updates.
