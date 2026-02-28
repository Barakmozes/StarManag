# CLAUDE.md — StarManag Restaurant Management System

> **Single Next.js 14 application** (NOT a monorepo). Full-stack restaurant management and food delivery platform.

---

## 1. Technology Stack

| Layer               | Technology                                         | Notes                                                    |
|---------------------|----------------------------------------------------|---------------------------------------------------------|
| Framework           | **Next.js 14** (App Router, Server Components)     | File-system routing under `/app`                         |
| Language            | **TypeScript** (strict)                            | All files `.ts` / `.tsx`                                 |
| Database            | **PostgreSQL 16** (Supabase-hosted in production)  | Local PG for dev, Supabase cloud for prod                |
| ORM                 | **Prisma** (schema-first)                          | `prisma/schema.prisma`, generators: `prisma-client-js` + `prisma-pothos-types` |
| API                 | **GraphQL** via Next.js API route (`/api/graphql`)  | Schema built code-first with **Pothos** + Prisma plugin  |
| GraphQL Client      | **urql** + **GraphQL Code Generator**              | Typed hooks `useQuery` / `useMutation`, generated into `graphql/generated.ts` |
| Authentication      | **NextAuth.js** with Prisma Adapter                | Providers: Google, Facebook OAuth                        |
| State Management    | **Zustand** (with `persist` + `devtools` middleware)| Cart, sidebar, login modal, area store                   |
| Styling             | **Tailwind CSS** + **Headless UI**                 | Utility-first; reusable classes in `globals.css` via `@layer components` |
| Icons               | **React Icons**                                    | Consistent iconography via React components              |
| Charts              | **Recharts**                                       | Sales/revenue graphs on admin dashboard                  |
| Payments            | **PayPlus API** (primary payment processor)        | Route: `/api/payplus/[total]/route.ts`. **Note:** Stripe quick-connect is possible as an alternative—some legacy code and docs reference Stripe, but production uses **PayPlus** |
| Image Storage       | **Supabase Storage** (public bucket)               | UUIDs for filenames; URLs stored as strings in DB        |
| Maps & Geolocation  | **Mapbox** (`react-map-gl`, Mapbox GL JS)          | Address autocomplete, delivery route visualization       |
| Toast Notifications | **React Toastify**                                 | User feedback on actions (add to cart, payment, errors)  |
| Package Manager     | **Yarn** (lockfile: `yarn.lock`)                   | Always use `yarn`, not npm                               |
| Deployment          | **Vercel**                                         | Environment variables must be configured in Vercel dashboard |
| Node.js             | **v22+** (use nvm)                                 |                                                          |

---

## 2. Project Architecture

### 2.1 Monolith Structure (Single Next.js App)

```
root/
├── app/                          # Next.js App Router (pages, layouts, API routes)
│   ├── (dashboard)/dashboard/    # Admin dashboard (route group)
│   ├── (user)/user/              # User account pages (route group)
│   ├── api/                      # API routes
│   │   ├── auth/[...nextauth]/   # NextAuth OAuth endpoints
│   │   ├── graphql/              # GraphQL endpoint (context.ts, route.ts)
│   │   ├── payplus/[total]/      # PayPlus payment API
│   │   └── google-reviews/       # Google reviews integration
│   ├── cart/                     # Cart page
│   ├── components/               # Shared UI components
│   │   ├── Common/               # Header, Footer, Sidebar, AuthModal, etc.
│   │   ├── Home/                 # Hero, Menu, Promos, Categories
│   │   └── Restaurant_interface/ # Floor plan, tables, zones, reservations
│   ├── payment-success/          # Post-payment success page
│   ├── payment-failure/          # Payment failure page
│   ├── contact-us/, faqs/, help/, login/, privacy/, shipping/, terms-of-use/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (server component)
│   ├── Providers.tsx             # urql + session providers (client component)
│   └── globals.css               # Global Tailwind styles
├── graphql/
│   ├── schema/                   # Pothos GraphQL schema modules (per domain)
│   │   ├── User/                 # index.ts, queries.ts, mutations.ts, enum.ts
│   │   ├── Menu/                 # index.ts, queries.ts, mutations.ts
│   │   ├── Order/                # index.ts, queries.ts, mutations.ts, enum.ts
│   │   ├── Category/             # ...
│   │   ├── Favorite/             # ...
│   │   ├── Profile/              # ...
│   │   ├── Delivery/             # ...
│   │   ├── Notification/         # ...
│   │   ├── Restaurant/           # ...
│   │   ├── Area/                 # ...
│   │   ├── Table/                # ...
│   │   ├── TableUsage/           # ...
│   │   ├── GridConfig/           # ...
│   │   ├── Reservation/          # ...
│   │   ├── Waitlist/             # ...
│   │   ├── Dashboard/            # KPIs, revenue queries, enum.ts
│   │   └── index.ts              # Barrel export aggregating all schemas
│   ├── files/                    # .graphql document files (client-side operations)
│   │   ├── user.graphql, menu.graphql, order.graphql, category.graphql, ...
│   │   ├── area.graphql, table.graphql, gridconfig.graphql, Reservation.graphql, ...
│   │   └── dashboard.graphql, restaurant.graphql, notification.graphql, ...
│   ├── builder.ts                # Pothos SchemaBuilder instance
│   └── generated.ts              # Auto-generated types from codegen (DO NOT EDIT)
├── lib/
│   ├── prisma.ts                 # Singleton Prisma client instance
│   ├── session.ts                # getCurrentUser() server-side helper
│   ├── store.ts                  # Zustand stores (cart, sidebar, login modal)
│   ├── AreaStore.ts              # Zustand store for restaurant floor areas
│   ├── supabaseStorage.ts        # Supabase upload/delete helpers
│   ├── createOrderNumber.ts      # Timestamp-based unique order number generator
│   ├── localeUtils.ts            # Locale/translation utilities
│   └── menuCategory.ts           # Category mapping helpers
├── prisma/
│   ├── schema.prisma             # Database schema (models, enums, relations)
│   └── migrations/               # Sequential migration files
├── data/                         # Static/dummy data files for development
├── public/img/                   # Static images (categories, food, banners, logos)
├── middleware.ts                  # Next.js middleware (role-based route protection)
├── types.ts                      # Shared TypeScript type definitions
├── globals.d.ts                  # Global type augmentations (NextAuth session/JWT)
├── codegen.yml                   # GraphQL Code Generator configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── next.config.js                # Next.js configuration (image domains, etc.)
├── .env                          # Environment variables (gitignored)
└── yarn.lock                     # Yarn lockfile
```

### 2.2 Key Architectural Patterns

- **Server Components by default** — `page.tsx` files are server components; use `getCurrentUser()` from `lib/session.ts` to fetch the session server-side and pass `user` as props to client children.
- **Client Components** — marked with `"use client"` directive; used for interactive UI (modals, forms, state-dependent rendering).
- **GraphQL schema is modularized per domain** — each domain (User, Menu, Order, etc.) has its own folder under `graphql/schema/` with `index.ts`, `queries.ts`, `mutations.ts`, and optionally `enum.ts`.
- **Route Groups** — `(dashboard)` and `(user)` are Next.js route groups that share layouts without affecting URL structure.
- **Singleton Prisma Client** — `lib/prisma.ts` prevents multiple DB connection instances in development/serverless.

### 2.3 Critical Server Component Pattern

```typescript
// In page.tsx (server component):
import { getCurrentUser } from "@/lib/session";

const user = await getCurrentUser();
// Pass as props:
<ClientComponent user={user as User} />
```

**NEVER call `getCurrentUser()` in client components.** Always fetch in server components and pass down.

---

## 3. Database Schema (Prisma)

### 3.1 Enums

| Enum                   | Values                                                                 |
|------------------------|------------------------------------------------------------------------|
| `Role`                 | `USER`, `ADMIN`, `DELIVERY`, `WAITER`, `MANAGER`                       |
| `OrderStatus`          | `PREPARING`, `UNASSIGNED`, `COLLECTED`, `DELIVERED`, `PENDING`, `READY`, `SERVED`, `COMPLETED`, `CANCELLED` |
| `ReservationStatus`    | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`                       |
| `NotificationPriority` | `LOW`, `NORMAL`, `HIGH`                                                |
| `NotificationStatus`   | `READ`, `UNREAD`                                                       |
| `WaitlistStatus`       | `WAITING`, `CALLED`, `SEATED`, `CANCELLED`                             |

### 3.2 Core Models & Relations

| Model              | Key Fields                                                                  | Relations                                          |
|--------------------|----------------------------------------------------------------------------|---------------------------------------------------|
| `User`             | id (cuid), name, email (unique), role (enum), image                        | has many: Account, Session, Order, Reservation, Notification, Waitlist; has one: Profile, Favorite |
| `Profile`          | phone, img, name, email (unique, FK to User.email)                         | belongs to User (via email)                        |
| `Account`          | provider, providerAccountId, tokens                                        | belongs to User (cascade delete)                   |
| `Session`          | sessionToken, expires                                                      | belongs to User (cascade delete)                   |
| `Menu`             | title, shortDescr, longDescr, price, sellingPrice, image, prepType[], onPromo, category (string + categoryId FK) | optional belongs to Category |
| `Category`         | title (unique), desc, img                                                  | has many Menu                                      |
| `Order`            | orderNumber (unique), cart (Json[]), total, status, paid, paymentToken, deliveryAddress, deliveryFee, serviceFee, note, discount, items (Json), preOrder, tableId | belongs to User (via email, cascade delete), has one Delivery, optional belongs to Table |
| `Delivery`         | driverName, driverEmail, driverPhone, orderNum (unique)                    | belongs to Order (via orderNumber, cascade delete)  |
| `Favorite`         | userEmail (unique), menu (String[])                                        | belongs to User (via email, cascade delete)         |
| `Notification`     | userEmail, type, priority, message, status                                 | belongs to User (via email, cascade delete)         |
| `Restaurant`       | name, address, openTimes (Json[]), deliveryFee, serviceFee, bannerImg, rating | has many Area                                    |
| `Area`             | name (unique), description, floorPlanImage, parentId (self-ref)            | belongs to Restaurant (cascade), self-referential parent/children, has many Table, Waitlist; has one GridConfig |
| `Table`            | tableNumber (unique int), diners, reserved, specialRequests[], position (Json) | belongs to Area (cascade), has many Reservation, Order; has one TableUsage |
| `TableUsage`       | usageCount, lastUsed                                                       | belongs to Table (cascade)                         |
| `Reservation`      | userEmail, tableId, status, reservationTime, numOfDiners, createdBy (Role), createdByUserEmail | belongs to User, Table (cascade); optional createdByUser (SetNull) |
| `Waitlist`         | userEmail, areaId, numOfDiners, status, calledAt, seatedAt, priority       | belongs to User, Area (cascade)                    |
| `GridConfig`       | areaId (unique), gridSize                                                  | belongs to Area (cascade)                          |
| `VerificationToken`| identifier, token, expires                                                 | standalone                                         |

### 3.3 Key Schema Conventions

- **IDs**: All models use `@id @default(cuid())` (string CUIDs, not auto-increment integers).
- **Timestamps**: Every model has `createdAt` and `updatedAt` fields.
- **Soft relations via email**: User-related models (Order, Favorite, Notification, Profile) link to User via `email` field, not `id`.
- **Cascade deletes**: Established on Account, Session, Profile, Order, Delivery, Favorite, Notification, Area, Table, Reservation, Waitlist, GridConfig, TableUsage.
- **Json fields**: `Order.cart` (Json[]), `Order.items` (Json), `Restaurant.openTimes` (Json[]), `Table.position` (Json).
- **Array fields**: `Menu.prepType` (String[]), `Favorite.menu` (String[]), `Table.specialRequests` (String[]).
- **Indexes**: Performance indexes on foreign keys and commonly queried combinations (orderDate+status, userEmail+orderDate, status+orderDate).

### 3.4 Migration Strategy

- **Local development**: `npx prisma migrate dev` (creates new migrations).
- **Production (Supabase)**: `npx prisma migrate deploy` (applies existing migrations — NEVER use `migrate dev` against remote).
- **After any schema change**: Always run `npx prisma generate` to regenerate the Prisma client and Pothos types.
- **Shadow database**: Prisma schema references `SHADOW_DATABASE_URL` for migration diffing.

---

## 4. GraphQL API (Pothos)

### 4.1 Schema Architecture

- **Code-first** using Pothos SchemaBuilder with Prisma plugin.
- Builder instance defined in `graphql/builder.ts`.
- Each domain has its own folder under `graphql/schema/`:
  - `index.ts` — barrel export, registers the Pothos PrismaObject type
  - `queries.ts` — `builder.queryField(...)` definitions
  - `mutations.ts` — `builder.mutationField(...)` definitions
  - `enum.ts` — Pothos enum type definitions (where applicable)
- All schemas aggregated in `graphql/schema/index.ts`.

### 4.2 Available Domains

**User**, **Menu**, **Order**, **Category**, **Favorite**, **Profile**, **Delivery**, **Notification**, **Restaurant**, **Area**, **Table**, **TableUsage**, **GridConfig**, **Reservation**, **Waitlist**, **Dashboard** (KPIs + Revenue analytics).

### 4.3 Query Patterns

- **Single entity**: `getUser(email)`, `getMenu(id)`, `getOrder(id)`, `getTable(id)`, etc.
- **List queries**: `getUsers`, `getCategories`, `getTables`, `getAreas`, etc.
- **Paginated (cursor-based, Relay-style)**: `getMenus`, `getOrders`, `getDeliveryOrders` — return `Connection` types with `edges[]{cursor, node}` and `pageInfo{endCursor, hasNextPage, ...}`.
- **Dashboard analytics**: `getDashboardKpis(from, to)`, `getDashboardKpisCompare(from, to)`, `getDashboardRevenue(from, to, groupBy)`, `getDashboardRevenueCompare(from, to, groupBy)`.
- **Filtered queries**: `getOrders` supports `search`, `statusIn[]`, `paid`, `preOrder`, `tableId`, `from`, `to` filters; `getNotifications` supports `status`, `search`, `skip`, `take`.

### 4.4 Mutation Patterns

- **CRUD**: `addMenu`, `editMenu`, `deleteMenu` (same pattern for Category, Restaurant, Area, Table, etc.)
- **Order lifecycle**: `addOrder`, `addOrderToTable`, `editOrder(status)`, `editOrderOnPayment`, `markDeliveryReady`, `markDeliveryDelivered`
- **User management**: `editUserRole`, `updateUserProfile`, `deleteUser`
- **Delivery**: `assignDriverToOrder`, `removeDriverFromOrder`
- **Favorites**: `addFavorite`, `removeFavorite`
- **Reservations**: `addReservation`, `addGuestReservation`, `editReservation`, `cancelReservation`, `completeReservation`
- **Waitlist**: `addWaitlistEntry`, `callWaitlistEntry`, `seatWaitlistEntry`, `cancelWaitlistEntry`, `removeWaitlistEntry`, `updateWaitlistEntry`
- **Tables**: `addTable`, `editTable`, `deleteTable`, `movePositionTable`, `toggleTableReservation`, `updateManyTables`
- **Notifications**: `addNotification`, `markNotificationAsRead`, `markAllNotificationsAsRead`, `updateNotification`, `deleteNotification`

### 4.5 Authorization in Resolvers

- Resolvers access the logged-in user via `context` (from NextAuth session).
- Admin-only operations throw `GraphQLError` if user role is not `ADMIN`.
- The GraphQL endpoint is further protected by **API key validation** in headers (`GRAPHQL_API_KEY` as Bearer token).

### 4.6 Client-Side GraphQL

- `.graphql` document files live in `graphql/files/` (e.g., `menu.graphql`, `order.graphql`).
- **GraphQL Code Generator** (`codegen.yml`) generates TypeScript types + urql hooks into `graphql/generated.ts`.
- **NEVER manually edit `generated.ts`** — run `yarn codegen` to regenerate.
- urql client is configured in `app/Providers.tsx` with the API endpoint `/api/graphql` and API key header.

---

## 5. Authentication & Authorization

### 5.1 NextAuth Configuration

- API route: `/api/auth/[...nextauth]/route.ts`
- **Providers**: Google OAuth, Facebook OAuth
- **Adapter**: Prisma adapter (stores users, accounts, sessions in PostgreSQL)
- **Session strategy**: JWT-based
- **Callbacks**: JWT and session callbacks inject `user.role` into the token and session objects
- **Type augmentations**: `globals.d.ts` extends NextAuth `Session`, `JWT`, and `User` types to include `role`

### 5.2 Role System

| Role       | Access Level                                                  |
|------------|--------------------------------------------------------------|
| `USER`     | Browse menu, manage cart, place orders, manage favorites/profile, view own orders |
| `ADMIN`    | Full dashboard access: manage users, orders, menus, deliveries, notifications, settings, restaurant, tables, areas, reservations |
| `DELIVERY` | Delivery-specific views (driver assignment, route tracking)   |
| `WAITER`   | Restaurant interface access (tables, orders at tables)        |
| `MANAGER`  | Extended management permissions                               |

### 5.3 Middleware Protection (`middleware.ts`)

- Intercepts requests to `/dashboard/*` and `/api/graphql`
- Validates JWT token, checks `role` field
- Unauthorized users are redirected to homepage or login page
- Protected user routes: `/user/*`, `/cart` (checkout) require authentication

### 5.4 Server-Side Session

```typescript
// lib/session.ts
import { getCurrentUser } from "@/lib/session";
// Returns the current user with role — ONLY use in server components
```

---

## 6. Payment Integration

### 6.1 PayPlus API (Primary — Production)

- **API Route**: `/api/payplus/[total]/route.ts`
- Dynamic route parameter `[total]` receives the encoded order amount
- Creates a payment page/intent via PayPlus API
- On successful payment → redirect to `/payment-success` → update order status via `editOrderOnPayment` mutation → clear cart → redirect to orders page
- On failure → redirect to `/payment-failure`

### 6.2 Stripe (Quick-Connect Alternative)

> **Note:** Original tutorial references and some legacy code use Stripe (React Stripe.js, payment intents). Stripe integration is available for quick connection if needed, but the **production system uses PayPlus API**. If switching to Stripe: install `@stripe/stripe-js` + `@stripe/react-stripe-js`, create payment intent API route, use Stripe Elements for checkout form.

### 6.3 Payment Flow

1. User proceeds to checkout from cart page
2. Frontend calls payment API route with encoded total amount
3. API creates payment intent/page with the payment provider
4. User completes payment on the payment form
5. Redirect to `/payment-success` with payment intent ID + order ID
6. `editOrderOnPayment` mutation updates order: sets `paid: true`, stores `paymentToken`
7. Cart is reset via Zustand
8. Confetti animation shown, user redirected to order history

---

## 7. State Management (Zustand)

### 7.1 Store Files

- **`lib/store.ts`** — Main store: sidebar state, login modal state, cart state
- **`lib/AreaStore.ts`** — Restaurant floor/area state management

### 7.2 Cart Store

```typescript
// Cart actions:
addToCart(item)        // Add item or increment if exists
removeFromCart(id)     // Remove item entirely
increaseQuantity(id)   // +1 quantity
decreaseQuantity(id)   // -1 quantity (minimum 1)
resetCart()            // Clear cart (after order placement)
```

- Cart item type combines menu item fields + `quantity`, `preparation`, `instructions`
- **Persisted in localStorage** via Zustand `persist` middleware
- **Devtools** middleware enabled for debugging
- Cart count displayed dynamically in Header cart icon badge

### 7.3 UI State

- `isOpen` / `openSidebar()` / `closeSidebar()` — sidebar toggle
- `isLoginOpen` / `openLogin()` / `closeLogin()` — login modal toggle
- When unauthenticated user tries to add to cart → login modal opens + toast notification

### 7.4 Hydration

- Use `"use client"` directive for all components consuming Zustand stores
- Handle Next.js hydration mismatch carefully when using persisted state

---

## 8. Frontend Patterns & Conventions

### 8.1 Component Organization

- **Common components**: `app/components/Common/` — Header, Footer, Sidebar, AuthModal, DialogComponent, Container, FavoritesBtn, LocationSearchForm, etc.
- **Home components**: `app/components/Home/` — HeroSection, MenuCard, MenuModal, MenuSection, Categories, Promos, PromoCard
- **Restaurant interface**: `app/components/Restaurant_interface/` — TableCard, FloorTable, AreaSelector, MiniMap, CRUD modals for tables/zones
- **Dashboard components**: `app/(dashboard)/dashboard/Components/` — DashHeader, DashSideBar, TableWrapper, SearchAndFilter, SalesRevenueGraph, TotalCards, UploadImg

### 8.2 Reusable Dialog/Modal Pattern

- Built on **Headless UI `Dialog`** component
- Central `DialogComponent` accepts `isVisible`, `onClose`, `children` props
- Used consistently for: login modal, menu details, favorites, sidebar drawer, admin edit forms, role editing, order details, delivery tracking
- Wrapped with `Transition` for smooth enter/exit animations
- Always include close button with clear focus/hover states

### 8.3 Data Fetching Pattern

- **Server components** (`page.tsx`): Fetch session via `getCurrentUser()`, pass user data as props
- **Client components**: Use urql `useQuery` / `useMutation` hooks with generated typed documents
- **Pagination**: Cursor-based with `first` + `after` variables; "Load More" button or infinite scroll
- **Loading states**: React Suspense + custom spinner components (`loading.tsx` files per route)

### 8.4 Styling Conventions

- **Tailwind CSS** exclusively — no CSS modules, no styled-components
- Responsive breakpoints: `sm:`, `md:`, `lg:` (grid cols: 1 mobile → 2 small → 3 medium → 4 large)
- Custom reusable classes in `globals.css` under `@layer components` (e.g., `.form-button`)
- Transitions: `transition duration-200 ease-out` for hover/focus effects
- Use `group-hover` and `peer` selectors for interactive elements like sidebar tooltips
- Semantic HTML elements (`section`, `article`, `nav`, `aside`) combined with Tailwind

### 8.5 Routing Conventions

- **Route groups** with parentheses: `(dashboard)`, `(user)` — share layouts without URL impact
- Each route folder has `page.tsx` (server component) + `loading.tsx` (suspense fallback)
- Nested layouts (`layout.tsx`) share UI (e.g., dashboard sidebar/header)

### 8.6 Image Handling

- Static images: `public/img/` (categories, food, banners, logos, human avatars)
- Dynamic images (user uploads): Supabase Storage public bucket
- Upload: UUID filename → Supabase upload → store URL in DB
- `next.config.js` must whitelist external image domains (Supabase, Google/Facebook avatars)

---

## 9. Admin Dashboard

### 9.1 Dashboard Routes (`/dashboard/*`)

| Route                    | Purpose                                                    |
|--------------------------|------------------------------------------------------------|
| `/dashboard`             | Landing: KPI cards (visits, profit, orders) + sales revenue graph (Recharts) with day/week/month filters |
| `/dashboard/users`       | User table with search, pagination, edit role modal        |
| `/dashboard/orders`      | Orders table with status filters, mark collected/delivered, order detail modal |
| `/dashboard/menu`        | Menu CRUD table: add, edit, preview, delete with image upload + category/price filters |
| `/dashboard/deliveries`  | Delivery assignments, driver management, Mapbox route tracking, status updates |
| `/dashboard/notifications` | Notification list with read/unread filter, infinite scroll |
| `/dashboard/settings`    | Restaurant details, banner upload, delivery/service fees, opening hours, category management |

### 9.2 Dashboard Components

- `DashWrapper` — layout wrapper with sidebar + header
- `DashSideBar` — collapsible sidebar with icon tooltips, navigation links
- `DashHeader` — top bar with notification dropdown + account dropdown
- `TotalCards` — KPI stat cards with percentage change indicators
- `SalesRevenueGraph` — Recharts line/bar chart with dynamic filters
- `TableWrapper` — generic scrollable table with search + filter + pagination
- `SearchAndFilter` — reusable search input + filter dropdowns
- `UploadImg` — image upload component using Supabase storage

### 9.3 Dashboard Analytics (GraphQL)

- `getDashboardKpis(from, to)` → returns: ordersCount, grossRevenue, avgOrderValue, completedOrders, canceledOrders, newCustomers, uniqueCustomers, usersCount, menusCount, categoriesCount, tablesCount
- `getDashboardKpisCompare(from, to)` → returns current vs previous period KPIs
- `getDashboardRevenue(from, to, groupBy: DAY|WEEK|MONTH)` → time-series revenue data points
- `getDashboardRevenueCompare(from, to, groupBy)` → current vs previous period revenue comparison

---

## 10. Restaurant Interface (Tables, Areas, Reservations)

### 10.1 Floor Management

- **Areas** (zones): hierarchical structure with parent/child relationships; associated with a Restaurant
- **GridConfig**: configurable grid size per area for floor plan layout
- **Tables**: positioned on the floor plan via JSON `{x, y}` coordinates; drag-and-drop via `movePositionTable` mutation; `updateManyTables` for batch updates
- **Floor components**: `FloorTable`, `FloorToolbar`, `AreaSelector`, `MiniMap`, `TableCard`, `TableInspector`, `TableSheet`, `TablesSection`

### 10.2 Table Operations

- CRUD: Add/Edit/Delete tables and zones via modal forms
- Toggle reservation status: `toggleTableReservation`
- Track usage: `TableUsage` model with `incrementUsageCount`
- Special requests: array of strings per table
- Orders linked to tables: `addOrderToTable`, `getTableOrder`

### 10.3 Reservations

- Create by user or staff (guest reservations don't require existing user account)
- `addReservation` — for registered users
- `addGuestReservation` — for walk-ins (creates by customerName + phone)
- Lifecycle: `PENDING` → `CONFIRMED` → `COMPLETED` or `CANCELLED`
- `createdBy` field stores the role of the person who made the reservation
- `createdByUserEmail` with `SetNull` on delete (reservation persists even if creator is removed)
- `getTableReservations(tableId, date)` — fetch reservations for a specific table on a date

### 10.4 Waitlist

- Area-based waitlist: users wait for availability in a specific area
- Lifecycle: `WAITING` → `CALLED` → `SEATED` or `CANCELLED`
- Priority system: optional integer priority field
- Timestamps: `calledAt`, `seatedAt` for tracking flow

---

## 11. Business Rules & Logic

### 11.1 Order Flow

1. User browses menu → adds items to cart (Zustand store, persisted)
2. User must be **authenticated** to add to cart (triggers login modal if not)
3. Proceed to cart page → adjust quantities, add delivery address (Mapbox autocomplete)
4. Checkout → payment via PayPlus API
5. On payment success → `editOrderOnPayment` mutation sets `paid: true` + stores `paymentToken`
6. Order status lifecycle: `PREPARING` → `UNASSIGNED` → `COLLECTED` → `DELIVERED`
7. Admin manages status transitions from dashboard
8. For dine-in: `addOrderToTable` links order to a specific table

### 11.2 Order Number Generation

- `lib/createOrderNumber.ts` — generates timestamp-based unique identifiers

### 11.3 Favorites

- Stored as array of menu IDs (`String[]`) in `Favorite` model
- One Favorite record per user (identified by `userEmail`)
- `addFavorite` / `removeFavorite` mutations toggle individual menu items
- Frontend: heart icon toggles with immediate color change + server sync

### 11.4 Fees

- `deliveryFee` (default: 4) and `serviceFee` (default: 3) set at Restaurant level
- Copied to each Order at creation time
- Optional `discount` field on Order

### 11.5 User Roles

- New users default to `USER` role
- Admins can change roles via `editUserRole` mutation from dashboard
- Role changes immediately affect route access (middleware checks on next request)

### 11.6 Notifications

- Created for events: new sign-ups, order events, etc.
- Priority levels: LOW, NORMAL, HIGH
- Mark as read individually or bulk (`markAllNotificationsAsRead`)
- Filtered views: all/read/unread with search support

---

## 12. Environment Variables

### Required Variables

```env
# Database
DATABASE_URL=            # PostgreSQL connection string (Supabase pooler URL)
DIRECT_URL=              # Direct PostgreSQL connection (bypasses pooler, for migrations)
SHADOW_DATABASE_URL=     # Shadow DB for Prisma migration diffing

# Authentication
NEXTAUTH_SECRET=         # openssl rand -base64 32
NEXTAUTH_URL=            # http://localhost:3000 (dev) or production URL
GOOGLE_CLIENT_ID=        # Google OAuth client ID
GOOGLE_CLIENT_SECRET=    # Google OAuth client secret
FACEBOOK_CLIENT_ID=      # Facebook OAuth app ID (optional)
FACEBOOK_CLIENT_SECRET=  # Facebook OAuth app secret (optional)

# GraphQL
GRAPHQL_API_KEY=         # Bearer token for GraphQL endpoint protection
NEXT_PUBLIC_GRAPHQL_API= # GraphQL endpoint URL (e.g., /api/graphql)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anonymous key

# PayPlus
PAYPLUS_API_KEY=         # PayPlus API key for payment processing
PAYPLUS_SECRET_KEY=      # PayPlus secret key

# Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN= # Mapbox public access token

# Stripe (alternative/legacy — for quick-connect if needed)
# STRIPE_SECRET_KEY=
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

- `NEXT_PUBLIC_*` prefixed variables are exposed to the client
- `.env` file is gitignored — never commit secrets
- Production: configure in Vercel dashboard

---

## 13. Commands Reference

| Task                    | Command                       |
|-------------------------|-------------------------------|
| Install dependencies    | `yarn install`                |
| Generate Prisma client  | `npx prisma generate`        |
| Run migrations (dev)    | `npx prisma migrate dev`     |
| Deploy migrations (prod)| `npx prisma migrate deploy`  |
| Start dev server        | `yarn dev` (port 3000)       |
| GraphQL codegen         | `yarn codegen`               |
| Build for production    | `yarn build`                 |
| Lint                    | `yarn lint`                  |
| Prisma Studio (GUI)     | `npx prisma studio`          |

### Startup Sequence

```bash
yarn install
npx prisma generate    # MUST run before dev/build
npx prisma migrate deploy  # for remote DB
yarn dev
```

---

## 14. Code Style & Conventions

### 14.1 Naming

- **Files**: PascalCase for components (`MenuCard.tsx`, `DashHeader.tsx`), camelCase for utilities (`createOrderNumber.ts`, `floorUtils.ts`)
- **GraphQL operations**: camelCase verbs (`getUsers`, `addMenu`, `editOrder`, `deleteCategory`)
- **GraphQL files**: kebab or camelCase (`.graphql` documents match domain names)
- **Prisma models**: PascalCase singular (`User`, `Menu`, `Order`)
- **Enums**: UPPER_SNAKE_CASE values (`PREPARING`, `DELIVERED`)
- **React components**: PascalCase function names matching file names

### 14.2 TypeScript

- Strict TypeScript throughout — all files are `.ts` / `.tsx`
- Generated types from GraphQL codegen (`generated.ts`) used for all query/mutation typing
- Prisma types used for database entities in server-side code
- `globals.d.ts` extends third-party types (NextAuth session, JWT)
- Never use `any` unless absolutely necessary — prefer generated types

### 14.3 GraphQL Schema Organization

Each domain module follows this structure:
```
graphql/schema/DomainName/
├── index.ts      # builder.prismaObject() type definition + barrel exports
├── queries.ts    # builder.queryField() definitions
├── mutations.ts  # builder.mutationField() definitions
└── enum.ts       # builder.enumType() definitions (optional)
```

### 14.4 Component Patterns

- Reuse `DialogComponent` for all modals
- Use `Container` component for consistent max-width layouts
- Toast notifications via `react-toastify` for all user actions (success, error)
- Loading states via `loading.tsx` per route + skeleton/spinner components
- Conditional rendering based on user role and authentication status

---

## 15. Important Gotchas

1. **No automated test suite** — no unit/integration tests exist. Validation is via `yarn lint` and manual testing only.
2. **Prisma generate MUST run before dev/build** — Prisma client and Pothos types are generated into `node_modules`.
3. **Remote Supabase DB** — use `migrate deploy` only (never `migrate dev` against remote).
4. **Authentication required for ordering** — adding to cart and accessing `/user/*`, `/dashboard/*`, `/cart` checkout requires OAuth login.
5. **`generated.ts` is auto-generated** — NEVER edit manually; run `yarn codegen` to regenerate.
6. **Image domains** — must be whitelisted in `next.config.js` for Next.js Image optimization.
7. **Hydration issues** — Zustand persisted state can cause hydration mismatches; ensure `"use client"` on consuming components.
8. **`shadowDatabaseUrl`** — required in `schema.prisma` for Prisma migrations; pre-configured in secrets.

---

## 16. Source File Summaries

### 16.1 `AGENTS.md`
Quick-reference for AI agents: project overview, prerequisites (Node 22+, PG 16, Yarn), environment variables, key commands, gotchas (no tests, Prisma generate required, remote Supabase DB rules).

### 16.2 `__Introduction and Project Overview__.md`
Full tutorial transcript covering: app demo (menu, cart, payments, admin dashboard), project setup, backend tools (NextAuth, Prisma, Pothos, urql, Supabase, Stripe/PayPlus, Mapbox), database connection, schema design (all models and enums), authentication setup (Google/Facebook OAuth, JWT role injection, type augmentations), login flow UI, GraphQL schema development (user, menu, order, category, favorites, profiles), API security middleware, frontend integration (urql client, codegen, Zustand cart, Stripe checkout, profile management), admin dashboard (orders, menu, users CRUD), and Supabase deployment.

### 16.3 `Summary Core Concepts and Technologies.md`
Structured summary of backend and frontend implementation: core technologies table, backend development (project setup, auth, schema design, GraphQL API, API security), frontend development (Zustand state, login UI, menu display, cart, Stripe payment, profile management, admin dashboard). Includes FAQ section, implementation timeline, and detailed technology mechanics for Pothos, urql, Prisma, PostgreSQL, and Zustand — including how each works and best practices.

### 16.4 `only the frontend design and some client-side logic.md`
Comprehensive frontend design documentation: key features, tech stack, development timeline, core workflow (user side + admin side), detailed component descriptions (header, sidebar, home sections, cart, user routes, admin dashboard pages), state management, UI construction principles (Next.js routing, Tailwind CSS mechanics, Headless UI Dialog patterns, Zustand patterns, integration points). Covers the complete UI/UX architecture.

### 16.5 `implementation of the backend.md`
Detailed backend implementation guide: core concepts, backend development steps (setup, auth, schema, GraphQL API, security), frontend development steps (Zustand, login, menu, cart, payment, profile, admin), technology mechanics deep-dive, feature highlights table, implementation timeline, key insights, recommendations. Includes critical server component pattern for `getCurrentUser()` + props passing.

### 16.6 `Industry Report Summary.md`
Professional industry analysis: application overview, modern stack trends, opportunities (RBAC, real-time features, modular GraphQL), challenges (complex schema, TypeScript integration, pagination, third-party services), recommendations (branch strategy, env vars, modular schemas, middleware, Supabase storage, Stripe/PayPlus docs, Zustand persistence, testing), technical insights (enums, pagination, nested relations, image UUID naming), UX features, security considerations.

### 16.7 `NoteGPT_MindMap_1772129881403.md`
Mind map summary of backend focus: project structure overview, backend setup (PG, Prisma, enums, API key middleware, Pothos), auth (NextAuth, role restriction, middleware), frontend state (Zustand cart, favorites, address form, infinite scrolling), payment integration (Stripe/PayPlus intent, redirect, success), admin dashboard features.

### 16.8 `NoteGPT_MindMap_1772130165513.md`
Mind map summary of frontend focus: project overview (auth, address, menu, cart, orders, multi-language, profiles), technologies (React, Next.js, TypeScript, Zustand, Tailwind, Headless UI, Apollo/GraphQL, Prisma, Stripe/PayPlus, Mapbox, Vercel), application structure (modular components, responsive design, admin dashboard).

### 16.9 `Project structure.md`
Complete file tree of the entire application: every file and folder listed hierarchically, including all page components, API routes, GraphQL schema modules, lib utilities, Prisma migrations, public assets, and configuration files.

### 16.10 `schema.prisma`
Full Prisma database schema: 6 enums (Role, OrderStatus, ReservationStatus, NotificationPriority, NotificationStatus, WaitlistStatus), 16 models (Account, Session, User, Profile, VerificationToken, Notification, Restaurant, Menu, Category, Order, Delivery, Favorite, Area, GridConfig, Table, TableUsage, Reservation, Waitlist) with complete field definitions, relations, indexes, and cascade delete rules.

### 16.11 `generated.ts`
Auto-generated TypeScript types from GraphQL Code Generator: all GraphQL types (Area, Category, DashboardKpis, Delivery, Favorite, GridConfig, Menu, Notification, Order, Profile, Reservation, Restaurant, Table, TableUsage, User, Waitlist), all Query/Mutation type definitions with argument types, all enum definitions, connection/edge/pageInfo types for pagination, and urql document/hook exports for all operations.
