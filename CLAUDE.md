# CLAUDE.md — StarManag (You&I) Restaurant Management System

> Production-grade SaaS — full-stack restaurant management and food ordering platform built with Next.js 14.

---

## CRITICAL RULES (Read First — Breaking These Corrupts Data or Breaks Builds)

- **`page.tsx` and `layout.tsx` are ALWAYS server components** — never add `"use client"` to them
- **Always** fetch user via `getCurrentUser()` from `@/lib/session` in server components, pass as `user={user as User}` prop to client children
- **Never** use `(user as any)` — use `user as User` from `@prisma/client`
- **Never** call `getCurrentUser()` or `getServerSession()` inside client components
- Run `npx prisma generate` before `yarn dev` or `yarn build` — Prisma client lives in `node_modules`
- Run `yarn codegen` after changing any `.graphql` file or Pothos schema — breaks typed hooks otherwise
- Run `npx prisma migrate dev` after modifying `schema.prisma` — never skip migrations
- Use `npx prisma migrate deploy` (not `migrate dev`) against remote Supabase DB
- **Payment system uses PayPlus API — NOT Stripe.** All Stripe references in old docs are incorrect
- GraphQL API requires `GRAPHQL_API_KEY` as Bearer token — never hardcode secrets or use fallback keys
- Enforce authorization in GraphQL resolvers via `context.user?.role` — never rely on frontend-only auth
- Do not replace `useRestaurantStore.setTables()` merge strategy — it preserves unsaved drag-and-drop positions

---

## 1. Project Overview

- **Name**: StarManag (You&I) — restaurant management + food ordering platform
- **Users**: Restaurant staff (admin, manager, waiter, delivery) + customers
- **Architecture**: Next.js 14 App Router monolith (no separate client/server repos)
- **Deployment**: Vercel (serverless) + Supabase (PostgreSQL + Storage)
- **Localization**: Hebrew (primary, RTL) + English via `LangCode` type

---

## 2. Tech Stack (Mandatory — Do Not Replace)

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js 14 App Router | `^14.0.0` |
| Language | TypeScript (strict mode) | `^5.2.2` |
| Database | PostgreSQL via Prisma ORM | Prisma `^5.5.2` |
| API | GraphQL — Apollo Server + Pothos (code-first) | Apollo `^4.9.5`, Pothos `^3.38.0` |
| GraphQL Client | urql + GraphQL Code Generator | urql `^4.0.5` |
| Auth | NextAuth v4 (JWT strategy) + Prisma adapter | `^4.24.4` |
| State | Zustand (4 stores) | `^4.4.4` |
| Styling | TailwindCSS 3 + Headless UI | `^3.3.5`, `^1.7.17` |
| Image Storage | Supabase Storage (bucket `Bucket_StarMang`) | `^2.38.4` |
| Payments | **PayPlus API** (Israeli gateway) | REST via axios |
| Maps | Mapbox GL + react-map-gl | `^2.15.0` |
| UI Extras | react-hot-toast, react-icons, keen-slider, recharts, react-dnd, react-confetti-explosion | — |
| Package Manager | Yarn | Lockfile: `yarn.lock` |
| Node.js | v22+ | — |

Do not introduce alternative frameworks or libraries unless explicitly requested.

---

## 3. Project Structure

```
app/
  layout.tsx                    — Root layout (Providers, fonts, metadata)
  page.tsx                      — Homepage (role-based: HeroSection vs ZoneRestaurant)
  Providers.tsx                 — Client wrapper: urql, Toaster, AuthModal
  (dashboard)/dashboard/        — Admin routes (7 pages: KPIs, orders, users, menu, deliveries, notifications, settings)
  (user)/user/                  — User routes (4 pages: profile, orders, favorites, help)
  components/
    Common/                     — Shared UI: Header, SideBar, Footer, AuthModal, LocationBtn, FavoritesBtn (17 files)
    Home/                       — Customer sections: HeroSection, MenuSection, Categories, Promos (11 files)
    Restaurant_interface/       — Floor management: ZoneRestaurant, FloorTable, MiniMap, CRUD modals (26 files)
  api/
    auth/[...nextauth]/         — NextAuth (Google + Facebook OAuth)
    graphql/                    — Apollo Server endpoint + context creation
    payplus/[total]/            — PayPlus payment link generation
    google-reviews/             — Google Places API with 1h LRU cache
graphql/
  builder.ts                    — Pothos SchemaBuilder (Prisma + Relay plugins)
  schema/                       — 16 domain modules (47 queries, 55 mutations)
  files/                        — .graphql operation documents (13 files)
  generated.ts                  — Auto-generated types + urql hooks
lib/
  session.ts                    — getCurrentUser() server-side helper
  prisma.ts                     — Prisma client singleton (hot-reload safe)
  store.ts                      — Zustand: useCartStore, useSideBarDrawer, useLoginModal
  AreaStore.ts                  — Zustand: useRestaurantStore (floor plan state)
  supabaseStorage.ts            — Image upload/delete (Supabase Storage)
  createOrderNumber.ts          — Order number generator (BARAK + YYMMDDhhmmss)
  localeUtils.ts                — Locale detection from cookies (en/he)
  menuCategory.ts               — Zustand: useMenuFilterStore (category filtering)
prisma/
  schema.prisma                 — SINGLE SOURCE OF TRUTH: 18 models, 6 enums
  migrations/                   — 15 migrations (Oct 2023 → Feb 2026)
types.ts                        — Shared types: CartItemType, PromoTypes, LangCode
globals.d.ts                    — NextAuth type augmentation (adds role to JWT/Session)
middleware.ts                   — Route protection via NextAuth withAuth
```

### File Naming Conventions
- Components: PascalCase (`MenuSection.tsx`, `FloorTable.tsx`)
- Utilities: camelCase (`session.ts`, `floorUtils.ts`)
- Hooks: `use` prefix (`useCartStore`, `useToast`)
- GraphQL domains: PascalCase folders (`User/`, `Table/`, `Reservation/`)

---

## 4. Route Map & Access Control

| Route | Access | Renders |
|-------|--------|---------|
| `/` | Public | Role-based: HeroSection (USER/ADMIN/DELIVERY/anon) or ZoneRestaurant (WAITER/MANAGER) |
| `/login` | Public | OAuth buttons (Google, Facebook) |
| `/cart` | Public | Role-based: CartSummary (customers) or TableCartSummary (WAITER/MANAGER) |
| `/contact-us`, `/faqs`, `/help`, `/privacy`, `/shipping`, `/terms-of-use` | Public | Static info pages |
| `/payment-success`, `/payment-failure` | Auth required | Payment result |
| `/user/*` (profile, orders, favorites, help) | Auth required | User account pages |
| `/dashboard/*` (KPIs, orders, users, menu, deliveries, notifications, settings) | **ADMIN only** | Admin dashboard |

### API Routes
- `POST/GET /api/graphql` — Apollo Server (requires Bearer token)
- `POST/GET /api/auth/[...nextauth]` — NextAuth handler
- `POST /api/payplus/[total]` — PayPlus payment link (Base64-encoded total)
- `GET /api/google-reviews?query=` — Google Places with 1h cache

---

## 5. Roles & Authorization

| Role | Homepage | Dashboard | Restaurant Interface | Cart View |
|------|----------|-----------|---------------------|-----------|
| `USER` | HeroSection + Promos | No | No | CartSummary |
| `ADMIN` | HeroSection + Promos | Full access | No | CartSummary |
| `MANAGER` | ZoneRestaurant | Orders, Users, Settings | Full CRUD | TableCartSummary |
| `WAITER` | ZoneRestaurant | No | View + reserve | TableCartSummary |
| `DELIVERY` | HeroSection + Promos | No | No | CartSummary |

### Authorization Layers
- **Middleware** (`middleware.ts`): Route-level protection via `withAuth` — `/dashboard/*` requires ADMIN, `/user/*` requires auth
- **GraphQL resolvers**: Check `context.user?.role` — throw `GraphQLError` for unauthorized access
- **UI**: Conditional rendering based on `user.role` prop (supplementary only, never sole guard)

---

## 6. Database Schema (Prisma — 18 Models, 6 Enums)

### Enums
- `Role`: USER, ADMIN, DELIVERY, WAITER, MANAGER
- `OrderStatus`: PREPARING, UNASSIGNED, COLLECTED, DELIVERED, PENDING, READY, SERVED, COMPLETED, CANCELLED
- `ReservationStatus`: PENDING, CONFIRMED, CANCELLED, COMPLETED
- `NotificationPriority`: LOW, NORMAL, HIGH | `NotificationStatus`: READ, UNREAD | `WaitlistStatus`: WAITING, CALLED, SEATED, CANCELLED

### Key Models & Relations
- **User** (`email` unique, `role`) → Account[], Session[], Order[], Favorite?, Profile?, Reservation[], Notification[], Waitlist[]
- **Menu** (`title`, `price`, `sellingPrice?`, `prepType[]`, `onPromo`, `category` + `categoryId?`) — backward-compatible string + FK
- **Order** (`orderNumber` unique, `cart` JSON[], `status`, `total`, `paid`, `tableId?`) — indexed on `orderDate+status`
- **Restaurant** → Area[] → Table[] (+ GridConfig?, Waitlist[]) — Area supports self-referencing parent/children
- **Table** (`tableNumber` unique, `position` JSON, `areaId`) → Reservation[], Order[], TableUsage?
- **Reservation** — dual user relations: guest (`userEmail`) + creator (`createdByUserEmail`)
- **Cascade**: most child records cascade on parent delete; `SetNull` for Order.tableId and Reservation.createdByUserEmail
- All models use `id` (cuid), `createdAt`/`updatedAt` defaults; email-based FKs (not userId); no seed files

---

## 7. GraphQL Layer (Pothos — 16 Domain Modules, 47 Queries, 55 Mutations)

Each domain at `graphql/schema/DomainName/` has: `index.ts`, `queries.ts`, `mutations.ts`, optional `enum.ts`.
**Domains**: User, Menu, Order, Category, Favorite, Profile, Area, Table, GridConfig, Reservation, Waitlist, Notification, Restaurant, TableUsage, Dashboard, Delivery

- **Relay pagination**: `getMenus(first, after)` → `MenuConnection`, `getOrders(first, after, search, statusIn, paid)` → `OrderConnection`
- **Dashboard**: `getDashboardKpis(from, to)`, `getDashboardRevenue(from, to, groupBy)` with period comparison
- **Batch ops**: `updateManyTables(updates: [UpdateManyTablesInput!]!)` for floor layout save
- **Guest reservations**: `addGuestReservation` creates synthetic user (no registered email needed)
- **Context** (`app/api/graphql/context.ts`): validates Bearer token, provides `prisma` + `user` to resolvers
- **Client**: write `.graphql` in `graphql/files/` → `yarn codegen` → use `useQuery`/`useMutation` from `@urql/next`

---

## 8. State Management (Zustand — 5 Stores)

| Store | File | localStorage Key | Purpose |
|-------|------|-----------------|---------|
| `useCartStore` | `lib/store.ts` | `"You&i_cart"` | Cart items, tableId, tableNumber; price normalization on hydration |
| `useSideBarDrawer` | `lib/store.ts` | — | Sidebar open/close |
| `useLoginModal` | `lib/store.ts` | — | Login modal visibility |
| `useRestaurantStore` | `lib/AreaStore.ts` | `"restaurant-areas"` | Areas, tables, zoom scale (0.5–2.0), dirty-state tracking |
| `useMenuFilterStore` | `lib/menuCategory.ts` | `"menu_filter"` | Category filter selection |

### Rules
- Extend existing stores before creating new ones
- Use `persist` middleware with `skipHydration: true` for SSR safety
- **Critical**: `useRestaurantStore.setTables()` merges server data while preserving locally "dirty" table positions

### Table-to-Order Flow
`startOrderForTable(tableId, tableNumber)` → clears cart → links table → navigates to `/#menuSection`

---

## 9. Payment Processing (PayPlus API)

- **Endpoint**: `POST /api/payplus/[total]/route.ts`
- **Flow**: Client sends Base64-encoded total + order details → server calls PayPlus `generateLink` API → returns `paymentLink` → user redirected to PayPlus hosted page
- **Callbacks**: Success → `/payment-success?orderId=X`, Failure → `/payment-failure/X?status=failure`
- **Env vars**: `PAYPLUS_API_KEY`, `PAYPLUS_SECRET_KEY`, `PAYPLUS_PAGE_UID`
- **API base**: `https://restapidev.payplus.co.il/api/v1.0/PaymentPages/generateLink`

---

## 10. Authentication & Session

- **Providers**: Google OAuth + Facebook OAuth (with `allowDangerousEmailAccountLinking`)
- **Strategy**: JWT (not database-backed sessions) — role stored in token
- **Adapter**: Prisma (`@auth/prisma-adapter`) — stores Account/Session/User in DB
- **Sign-in page**: `/login`
- **Events**: `createUser` sends WELCOME notification on first signup
- **JWT callback**: Injects `role` claim from User model
- **Session callback**: Propagates `role` to client session
- **Role change**: JWT requires sign-out/sign-in to refresh after `editUserRole` mutation

---

## 11. Restaurant Interface (ZoneRestaurant)

Floor-plan management for MANAGER/WAITER roles. Renders on homepage instead of HeroSection.

### Component Tree
```
ZoneRestaurant → AreaSelector + FloorToolbar + TablesSection (FloorTable[], MiniMap) + TableModal (ToggleReservation, Start_an_order, specialRequests, TableReservations) + CRUD Modals
```

### Features
- Drag-and-drop tables with grid snap (configurable 10–100px per zone via GridConfig)
- Collision detection (red pulsing ring on overlap) — see `floorUtils.ts:getCollisionIds()`
- Table size: 110x84px — see `floorUtils.ts:TABLE_SIZE`
- MiniMap with color-coded dots: green=available, red=reserved, yellow=unpaid
- Zoom 50%–200% via toolbar or scroll wheel
- Optimistic UI for reservation toggles
- Dirty-state tracking + batch save via `updateManyTables` mutation
- Floor plan images from Supabase as zone backgrounds

---

## 12. Frontend Architecture

### Server → Client Pattern (Mandatory)
```tsx
// page.tsx (SERVER) — every page follows this
export default async function Page() {
  const user = await getCurrentUser();
  return <ClientComponent user={user as User} />;
}
```

### Client Component Rules
Add `"use client"` only when component needs: React hooks, event handlers, browser APIs, Zustand, urql, or third-party client libraries.

### Key UI Libraries
- **Modals**: `Modal.tsx` (Headless UI Dialog), `ModalBase.tsx`, `DialogComponent.tsx` (sliding drawer)
- **Toasts**: `react-hot-toast` (primary) + custom `useToast()` context in Restaurant_interface
- **Carousel**: Keen Slider (HeroSection auto-play)
- **Charts**: Recharts (Dashboard revenue graphs)
- **DnD**: react-dnd + HTML5 backend (floor table layout)
- **Icons**: react-icons

### Providers (`app/Providers.tsx`)
- Wraps app with `UrqlProvider` (GraphQL client with Bearer token auth)
- Includes `<Toaster />` and `<AuthModal />`

---

## 13. Code Style & Conventions

- **Indentation**: 2 spaces
- **TypeScript**: Strict mode — avoid `any`, use Prisma/generated types
- **Path aliases**: `@/` maps to project root (`@/lib/session`, `@/graphql/generated`)
- **Import order**: React/Next.js → third-party → `@/` internal → relative (`./`)
- **Naming**: Components=PascalCase, utils=camelCase, enums=SCREAMING_SNAKE, GraphQL ops=camelCase verb+noun
- **ESLint**: `next/core-web-vitals` preset (no custom rules)
- **No Prettier** configured — relies on ESLint defaults

---

## 14. Commands

| Task | Command |
|------|---------|
| Install dependencies | `yarn install` |
| Start dev server | `yarn dev` (port 3000) |
| Production build | `yarn build` (runs `prisma generate` first) |
| Lint | `yarn lint` |
| Generate Prisma client | `npx prisma generate` |
| Create migration (local) | `npx prisma migrate dev` |
| Apply migrations (production) | `npx prisma migrate deploy` |
| Regenerate GraphQL types | `yarn codegen` (requires dev server running) |

### Feature Delivery Order (Mandatory)
1. Prisma: Update `schema.prisma` → `npx prisma migrate dev` → `npx prisma generate`
2. GraphQL: Add/update schema in `graphql/schema/*`
3. Codegen: Write `.graphql` docs in `graphql/files/` → `yarn codegen`
4. Client: Use generated hooks in components
5. UI: Integrate with role-aware rendering

---

## 15. Environment Variables

### Required — Server Only
| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL pooler connection (Supabase) |
| `DIRECT_URL` | Direct DB connection (bypasses pooler for migrations) |
| `SHADOW_DATABASE_URL` | Prisma shadow DB for migration diffing |
| `NEXTAUTH_SECRET` | NextAuth encryption key |
| `NEXTAUTH_JWT_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | NextAuth redirect base URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Facebook OAuth |
| `GRAPHQL_API_KEY` | GraphQL API Bearer token |
| `PAYPLUS_API_KEY` / `PAYPLUS_SECRET_KEY` / `PAYPLUS_PAGE_UID` | PayPlus payment gateway |
| `GOOGLE_PLACES_API_KEY` | Google Places/Reviews API |

### Required — Client-Safe (`NEXT_PUBLIC_`)
| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GRAPHQL_API` | GraphQL endpoint URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL token |
| `NEXT_PUBLIC_NEXT_URL` | App base URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps client key |

---

## 16. Gotchas & Important Notes

1. **No automated test suite** — validation via `yarn lint` and manual testing only
2. **codegen requires running dev server** — schema is fetched from `http://localhost:3000/api/graphql`
3. **Hebrew content** — area names, restaurant names, UI labels use Hebrew; RTL layout supported
4. **Cart key** — Zustand cart persists to localStorage as `"You&i_cart"`
5. **Order number format** — `BARAK` + YYMMDDhhmmss (generated at import time, not per-order — see `lib/createOrderNumber.ts`)
6. **Image domains** — adding new image hosts requires updating `next.config.js` `remotePatterns`
7. **Allowed domains**: `lh3.googleusercontent.com`, `platform-lookaside.fbsbx.com`, `mmturupiypmbgdgrgfva.supabase.co`
8. **Guest reservations** are first-class — `addGuestReservation` mutation creates reservations without registered user email
9. **Order-table linking** — `Order.tableId` is optional (SetNull on delete); dine-in orders link to tables
10. **Role change** — `editUserRole` mutation changes DB role but JWT requires re-login to reflect new role
11. **Google Reviews** — cached in-memory LRU (max 300 items, 1h TTL) at `/api/google-reviews`
12. **AreaStore merge** — `setTables()` preserves locally-dirty positions during server refetches; do not replace

---

## 17. Anti-Patterns (DO NOT)

- `"use client"` in `page.tsx` or `layout.tsx` → create child client components instead
- `getCurrentUser()` in client components → fetch in server component, pass as prop
- `(user as any)` → use `user as User` from `@prisma/client`
- REST calls for domain data → use urql + generated GraphQL hooks
- React Context for cart/UI state → use Zustand stores
- New state libraries (Redux, Jotai) → extend existing Zustand stores
- Hardcoded API keys → use `process.env.*`
- Frontend-only auth checks → enforce in resolvers + middleware
- Skip migrations after schema changes → always run `prisma migrate dev`
- Skip codegen after GraphQL changes → always run `yarn codegen`
- Mix role string casing (`"admin"`) → use Prisma enum values (`ADMIN`)
- Bypass Prisma with raw SQL → use Prisma ORM
- Architecture rewrites → extend existing modules
