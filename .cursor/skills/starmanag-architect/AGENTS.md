# StarManag — Production System Reference

> Architecture rules, code style, and anti-patterns are defined in `.cursor/rules/*.mdc`.
> Code patterns and templates are in `patterns.md`.
> This file contains **project-specific knowledge** not covered by those files.

---

## 1. Project Identity

| Key | Value |
|-----|-------|
| Name | StarManag (package: `you-and-i`) |
| Type | Single Next.js 14 application (not a monorepo) |
| Purpose | Full-stack restaurant management: floor plans, reservations, orders, menu, deliveries, payments |
| Locales | English (`en`) + Hebrew (`he`) — full RTL support |
| Package Manager | Yarn (`yarn.lock`) |
| Node | v22+ |
| Deploy | Vercel |

### Additional Libraries (beyond core stack)

| Library | Purpose |
|---------|---------|
| Recharts | Dashboard revenue graphs |
| react-dnd + html5-backend | Floor plan table drag & drop |
| react-icons | Icons |
| keen-slider | Promos/carousels |
| react-hot-toast | Toast notifications |
| react-confetti-explosion | Payment success animation |

> **Payment Note**: Legacy docs reference Stripe — the codebase uses **PayPlus**.

---

## 2. Environment Variables

### Server Only

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (Supabase pooled) |
| `DIRECT_URL` | Direct DB connection (bypasses pooler) |
| `SHADOW_DATABASE_URL` | Prisma shadow DB for migrations |
| `NEXTAUTH_SECRET` | NextAuth encryption secret |
| `NEXTAUTH_JWT_SECRET` | JWT signing secret |
| `NEXTAUTH_URL` | NextAuth redirect base URL |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` | Facebook OAuth |
| `GRAPHQL_API_KEY` | GraphQL endpoint Bearer token |
| `PAYPLUS_API_KEY` / `PAYPLUS_SECRET_KEY` / `PAYPLUS_PAGE_UID` | PayPlus payment |
| `GOOGLE_PLACES_API_KEY` | Google Places/Reviews |

### Client-Safe (`NEXT_PUBLIC_`)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_GRAPHQL_API` | GraphQL endpoint URL |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox API token |
| `NEXT_PUBLIC_NEXT_URL` | App base URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Google Maps client key |

---

## 3. Commands

| Task | Command |
|------|---------|
| Install | `yarn install` |
| Prisma generate | `npx prisma generate` |
| Migrate (local) | `npx prisma migrate dev` |
| Migrate (remote) | `npx prisma migrate deploy` |
| Codegen | `yarn codegen` (dev server must be running) |
| Dev server | `yarn dev` (port 3000) |
| Build | `yarn build` (runs `prisma generate` first) |
| Lint | `yarn lint` |

**Codegen config** (`codegen.yml`): introspects `http://localhost:3000/api/graphql` → generates into `graphql/generated.ts`.

---

## 4. Routes & API

### Route Groups

| Route | Access |
|-------|--------|
| `/` (public) | Homepage, `/login`, `/contact-us`, `/faqs`, `/help`, `/privacy`, `/shipping`, `/terms-of-use` |
| `/cart` | Public (checkout requires auth) |
| `/payment-success`, `/payment-failure` | Auth required (307 redirect) |
| `(user)/user/*` | Auth required (307 redirect) |
| `(dashboard)/dashboard/*` | ADMIN only (307 redirect) |

### API Routes

| Route | Purpose |
|-------|---------|
| `/api/graphql` | Apollo Server (requires Bearer token) |
| `/api/auth/[...nextauth]` | NextAuth Google + Facebook OAuth |
| `/api/payplus/[total]` | PayPlus payment (Base64-encoded total) |
| `/api/google-reviews` | Google Reviews proxy (1h LRU cache) |

### Role-Based Homepage

- **USER / ADMIN / DELIVERY / anon**: `HeroSection` + `Promos` + `Categories` + `MenuSection`
- **WAITER / MANAGER**: `ZoneRestaurant` (floor management) + `Categories` + `MenuSection`

### Middleware (`middleware.ts`)

```
matcher: ["/dashboard/:path*", "/user/:path*", "/pay/:path*", "/payment-success"]
```

---

## 5. Data Model (18 Models, 6 Enums)

### Enums

| Enum | Values |
|------|--------|
| `Role` | USER, ADMIN, DELIVERY, WAITER, MANAGER |
| `OrderStatus` | PREPARING, UNASSIGNED, COLLECTED, DELIVERED, PENDING, READY, SERVED, COMPLETED, CANCELLED |
| `ReservationStatus` | PENDING, CONFIRMED, CANCELLED, COMPLETED |
| `NotificationPriority` | LOW, NORMAL, HIGH |
| `NotificationStatus` | READ, UNREAD |
| `WaitlistStatus` | WAITING, CALLED, SEATED, CANCELLED |

### Models

| Model | Key Fields | Key Relations |
|-------|-----------|---------------|
| **User** | `email` (unique), `role`, `name`, `image` | Account[], Session[], Profile?, Order[], Favorite?, Reservation[], Notification[], Waitlist[] |
| **Profile** | `phone`, `img`, `email` (unique FK→User) | User (Cascade) |
| **Menu** | `title`, `price`, `sellingPrice`, `image`, `prepType[]`, `onPromo`, `categoryId` | Category? |
| **Category** | `title` (unique), `desc`, `img` | Menu[] |
| **Order** | `orderNumber` (unique), `cart` (Json[]), `total`, `status`, `paid`, `tableId` | User (Cascade), Delivery?, Table? (SetNull) |
| **Delivery** | `driverName`, `driverEmail`, `orderNum` (unique) | Order (Cascade) |
| **Favorite** | `userEmail` (unique), `menu[]` | User (Cascade) |
| **Restaurant** | `name`, `address`, `openTimes` (Json[]), `deliveryFee`, `serviceFee` | Area[] |
| **Area** | `name` (unique), `floorPlanImage`, `parentId`, `restaurantId` | Restaurant? (Cascade), parent/children, Table[], GridConfig?, Waitlist[] |
| **Table** | `tableNumber` (unique Int), `diners`, `reserved`, `specialRequests[]`, `position` (Json) | Area (Cascade), Reservation[], Order[], TableUsage? |
| **GridConfig** | `areaId` (unique), `gridSize` (default 20) | Area (Cascade) |
| **TableUsage** | `tableId` (unique), `usageCount`, `lastUsed` | Table (Cascade) |
| **Reservation** | `userEmail`, `tableId`, `status`, `reservationTime`, `numOfDiners`, `createdBy` (Role) | User (Cascade), Table (Cascade), createdByUser? (SetNull) |
| **Waitlist** | `userEmail`, `areaId`, `numOfDiners`, `status`, `priority` | User (Cascade), Area (Cascade) |
| **Notification** | `userEmail`, `type`, `priority`, `message`, `status` | User (Cascade) |

### Cascade Rules

- **Cascade**: User→Account/Session/Notification/Order/Favorite/Waitlist/Reservation, Restaurant→Area, Area→Table/GridConfig/Waitlist, Table→TableUsage/Reservation, Order→Delivery
- **SetNull**: Table on Order, createdByUser on Reservation

### Key Indexes

Performance: `order_orderDate_status_idx`, `order_userEmail_orderDate_idx`, `order_status_orderDate_idx`, `order_tableId_idx`.

### Schema Conventions

- All IDs: `@id @default(cuid())` (string CUIDs)
- Timestamps: `createdAt` + `updatedAt` on every model
- User-linked models use `email` FK (not `id`)
- No seed files exist

---

## 6. GraphQL Domains (16 Modules, 47 Queries, 55 Mutations)

**Core**: User, Menu, Order, Category, Favorite, Profile, Notification
**Restaurant**: Area, Table, GridConfig, TableUsage, Reservation, Waitlist, Restaurant
**Operations**: Dashboard (KPI/revenue), Delivery

### Key Query Patterns

| Query | Notes |
|-------|-------|
| `getMenus(first, after)` | Relay cursor pagination |
| `getOrders(first, after, search, statusIn, paid)` | Filtered + paginated |
| `getAreas`, `getTables` | Full lists for floor plan |
| `getDashboardKpis(from, to)` | KPI cards with date range |
| `getDashboardRevenue(from, to, groupBy)` | Time-series (DAY/WEEK/MONTH) |
| `getTableOrder(tableId)` | Single table's active orders |
| `getTableReservations(tableId, date)` | Reservations for specific table + date |
| `getGridConfigByArea(areaId)` | Grid size per zone |
| `getNotifications(status, search, skip, take)` | Filtered notification list |

### Key Mutation Groups

| Group | Mutations |
|-------|----------|
| Menu CRUD | `addMenu`, `editMenu`, `deleteMenu` |
| Category CRUD | `addCategory`, `editCategory`, `deleteCategory` |
| Area CRUD | `addArea`, `editArea`, `deleteArea` |
| Table CRUD | `addTable`, `editTable`, `deleteTable`, `updateManyTables` (batch) |
| Table State | `toggleTableReservation`, `movePositionTable` |
| Orders | `addOrder`, `addOrderToTable`, `editOrder`, `editOrderOnPayment` |
| Delivery | `assignDriverToOrder`, `removeDriverFromOrder`, `markDeliveryReady`, `markDeliveryDelivered` |
| Reservations | `addReservation`, `addGuestReservation`, `editReservation`, `cancelReservation`, `completeReservation` |
| Waitlist | `addWaitlistEntry`, `callWaitlistEntry`, `seatWaitlistEntry`, `cancelWaitlistEntry` |
| Grid Config | `addGridConfig`, `editGridConfig` |
| User | `editUserRole`, `updateUserProfile`, `deleteUser` |
| Notifications | `addNotification`, `markNotificationAsRead`, `markAllNotificationsAsRead` |
| Favorites | `addFavorite`, `removeFavorite` |

---

## 7. Zustand Stores — Deep Reference

### Cart Store (`useCartStore` — `lib/store.ts`)

| State | Type |
|-------|------|
| `menus` | `CartItemType[]` |
| `tableId` | `string?` |
| `tableNumber` | `number?` |

| Action | Behavior |
|--------|----------|
| `addToCart(item)` | Normalizes `sellingPrice`/`basePrice` before adding |
| `deleteFromcart(id)` | Remove by ID |
| `increaseCartItem` / `decreaseCartItem` | Quantity adjustments |
| `resetCart()` | Clear all state |
| `startOrderForTable(tableId, tableNumber)` | Reset + link table → navigate to `/#menuSection` |
| `syncCartPrices()` | Runs on rehydration — normalizes legacy items |

Price normalization: if `sellingPrice > 0 && sellingPrice < basePrice`, effective `price` = `sellingPrice`.

### Restaurant Store (`useRestaurantStore` — `lib/AreaStore.ts`)

| State | Type |
|-------|------|
| `selectedArea` | `BasicArea | null` |
| `areas` | `BasicArea[]` |
| `scale` | `number` (0.5–2.0) |
| `tables` | `TableInStore[]` |

| Action | Behavior |
|--------|----------|
| `setTables(fetched)` | **MERGE**: preserves dirty local positions |
| `moveTable(id, areaId, pos)` | Updates position + marks `dirty: true` |
| `setTableReserved(id, bool)` | Optimistic reservation toggle |
| `markTablesClean(ids?)` | Clears dirty flags after batch save |

**Critical merge behavior**: When a table is locally "dirty", `setTables()` preserves local `areaId`/`position` while refreshing server fields (`reserved`, `specialRequests`, `diners`).

### TableInStore Type

```typescript
interface TableInStore {
  id: string;
  tableNumber: number;
  areaId: string;
  diners: number;
  reserved: boolean;
  specialRequests: string[];
  position: { x: number; y: number };
  dirty?: boolean;
  unpaidOrdersCount?: number;
  hasReservationToday?: boolean;
}
```

---

## 8. Restaurant Interface (Floor Management)

Located at `app/components/Restaurant_interface/`. Renders on homepage for MANAGER/WAITER only.

### Component Tree

```
ZoneRestaurant — Main orchestrator
├── AreaSelector          — Zone tabs + search + table counts
├── FloorToolbar          — Zoom, grid, edit mode, save, undo
├── TablesSection         — Interactive floor canvas
│   ├── FloorTable        — Draggable table with grid snap
│   └── MiniMap           — Overview navigation minimap
├── TableCard             — Status card: seats, badges
├── TableModal            — Full detail modal
│   ├── ToggleReservation — Reserve/Release (optimistic UI)
│   ├── Start_an_order    — Start order → cart → menu
│   ├── specialRequests   — Add/remove text requests
│   └── TableReservations — Calendar + guest reservations
├── TableSheet            — Mobile bottom sheet
├── TableInspector        — Multi-select, lock, edit mode
├── CRUD_Zone-CRUD_Table/ — Zone & table CRUD modals
├── floorUtils.ts         — Grid snap, collision detection, position clamping
└── ui/ ModalBase, useToast
```

### Floor Behaviors

| Behavior | Details |
|----------|---------|
| Grid Snap | Configurable per zone (10-100px, default 20) |
| Table Size | 110x84px (`floorUtils.ts:TABLE_SIZE`) |
| Collision | Red pulsing ring on overlap (`getCollisionIds()`) |
| Drag vs Click | Movement threshold — small=click (modal), large=drag |
| Floor Plan Image | Zone background from Supabase; canvas sized to image |
| MiniMap | Green=available, Red=reserved, Yellow=unpaid, White=locked |
| Zoom | 50%-200% via toolbar or scroll wheel |
| Overview Modes | ALL / AVAILABLE / UNPAID — cross-zone list view |
| Batch Save | `updateManyTables` mutation; dirty flags cleared |

### Table Visual States

| State | Indicator | Background |
|-------|-----------|------------|
| Available | Green dot + "פנוי" | White |
| Reserved | Red dot + "תפוס" | Light rose |
| Unpaid Orders | Blue badge with count | Rose tint |
| Dirty (unsaved) | Amber "unsaved" badge | — |

---

## 9. Auth & Session

- **Providers**: Google OAuth + Facebook OAuth (`allowDangerousEmailAccountLinking`)
- **Strategy**: JWT — role stored in token
- **Adapter**: `@auth/prisma-adapter` (stores Account/Session/User)
- **Sign-in page**: `/login`
- **Events**: `createUser` sends WELCOME notification
- **JWT callback**: Injects `role` from User model
- **Session callback**: Propagates `role` to client session
- **Role change**: `editUserRole` mutation changes DB — JWT requires sign-out/sign-in to refresh
- **Type augmentations**: `globals.d.ts` extends Session/JWT/User with `role: Role`

---

## 10. Payment System

- **Active**: PayPlus API — `/api/payplus/[total]/route.ts`
- **Flow**: Client sends Base64-encoded total → server calls PayPlus `generateLink` → returns `paymentLink` → redirect
- **API base**: `https://restapidev.payplus.co.il/api/v1.0/PaymentPages/generateLink`
- **Success**: `/payment-success?orderId=X` (updates order `paid: true`, clears cart, confetti)
- **Failure**: `/payment-failure/X?status=failure`

---

## 11. Image & Media

- **Storage**: Supabase via `lib/supabaseStorage.ts`
- **Bucket**: `Bucket_StarMang` (public)
- **Upload**: `uploadPublicImage()` (modern), `SupabaseImageUpload()` (legacy)
- **Delete**: `SupabaseImageDelete()`
- **Component**: `UploadImg.tsx` — drag/drop, preview, size validation
- **Allowed domains** (`next.config.js`): `lh3.googleusercontent.com`, `platform-lookaside.fbsbx.com`, `mmturupiypmbgdgrgfva.supabase.co`

---

## 12. Dashboard Analytics

- `getDashboardKpis(from, to)` → ordersCount, grossRevenue, avgOrderValue, completedOrders, canceledOrders, newCustomers, uniqueCustomers, usersCount, menusCount, categoriesCount, tablesCount
- `getDashboardKpisCompare(from, to)` → current vs previous period
- `getDashboardRevenue(from, to, groupBy: DAY|WEEK|MONTH)` → time-series data points
- **Charts**: `SalesRevenueGraph` (Recharts)
- **Components**: `TotalCards`, `SearchAndFilter`, `TableWrapper`, `PanelWrapper`

---

## 13. Critical Gotchas

| # | Gotcha |
|---|--------|
| 1 | **No automated tests** — `yarn lint` + manual testing only |
| 2 | **Prisma generate before dev/build** — `npx prisma generate` after `yarn install` |
| 3 | **Remote Supabase DB** — `migrate deploy` only; `migrate dev` creates unintended migrations |
| 4 | **Shadow database** — `SHADOW_DATABASE_URL` required for migration diffing |
| 5 | **PayPlus, NOT Stripe** — despite legacy doc references |
| 6 | **Hebrew/RTL** — area names, restaurant names, UI labels may be in Hebrew |
| 7 | **Cart persistence** — localStorage key `"You&i_cart"` |
| 8 | **GraphQL API key** — all `/api/graphql` requests need `Authorization: Bearer <key>` |
| 9 | **JWT after role change** — sign out/in required to refresh |
| 10 | **AreaStore merge** — `setTables()` preserves dirty positions; don't replace |
| 11 | **Image domains** — new sources require `next.config.js` update |
| 12 | **Restaurant interface** — only renders for WAITER/MANAGER on homepage |
| 13 | **Codegen needs dev server** — introspects `http://localhost:3000/api/graphql` |
| 14 | **Guest reservations** — first-class via `addGuestReservation` (no email needed) |
| 15 | **Order-table linking** — `tableId` optional (SetNull on delete) |
| 16 | **Cart price normalization** — `syncCartPrices()` runs on rehydration |
| 17 | **Order number format** — `BARAK` + YYMMDDhhmmss (generated at import time) |

---

## 14. Manual Testing Scenarios

| Test | Steps | Expected |
|------|-------|----------|
| Restaurant interface | Switch to MANAGER → sign out/in → homepage | ZoneRestaurant renders |
| Zone CRUD | Toolbar → Add/Edit/Delete zone | Toast feedback |
| Table CRUD | Toolbar → Add table / click → Edit/Delete | Auto-refresh |
| Table drag & drop | Edit mode → drag table | Snaps to grid, marks dirty |
| Save layout | Drag tables → "Save layout" | Batch save, dirty cleared |
| Reservation toggle | Table modal → Reserve/Release | Optimistic UI update |
| Start order | Table modal → "Start order" | Cart links table, redirects |
| Payment flow | Add items → checkout → PayPlus | Success/failure redirect |
| Role switching | Header → "Switch Role" | JWT refreshes after re-login |

---

## 15. Full Project Structure

```
app/
  (dashboard)/dashboard/           # Admin panel (ADMIN only)
    Components/                    # DashHeader, DashSideBar, DashWrapper, TotalCards,
                                   # SalesRevenueGraph, SearchAndFilter, TableWrapper,
                                   # UploadImg, NotifyDropDown, PanelWrapper
    deliveries/                    # AssignDriver, DeliveriesTable, ViewDeliveryStatus
    menu/                          # AdminAddMenu, AdminEditMenu, AdminDeleteMenu,
                                   # AdminMenuTable, AdminPreviewMenu, CategoryDropDown
    notifications/                 # NotificationsList
    orders/                        # AdminFetchedOrders, AdminOrderModal, AdminOrderTable
    settings/                      # AdminAddCategory, AdminEditCategory, AdminDeleteCategory,
                                   # OpeningHours, RestaurantDetails
    users/                         # AdminUserTable, EditRoleForm, EditRoleModal
  (user)/user/                     # Customer-facing pages
    favorites/                     # FavoriteCard, FavoriteModal, FavoritesSection
    help/                          # RequestHelpForm
    orders/                        # UserOrders, UserDeliveredModal, UserOnDeliveryModal
  api/
    auth/[...nextauth]/route.ts    # NextAuth
    graphql/context.ts + route.ts  # Apollo Server
    payplus/[total]/route.ts       # PayPlus
    google-reviews/route.ts        # Google Reviews proxy
  cart/                            # CartList, CartSummary, CartTopSection
  components/
    Common/                        # Header, Footer, SideBar, AuthModal, AccountDropDown,
                                   # AppMap, FavoritesBtn, TranslateToggle
    Home/                          # HeroSection, MenuSection, MenuCard, MenuModal,
                                   # Categories, Promos, PromoCard, EntryFullscreenModal
    Restaurant_interface/          # ZoneRestaurant, TablesSection, FloorTable, FloorToolbar,
                                   # MiniMap, AreaSelector, TableCard, TableModal, TableSheet
      CRUD_Zone-CRUD_Table/        # Add/Edit/Delete Zone & Table modals
      Table_Settings/              # ToggleReservation, Start_an_order, specialRequests,
                                   # TableReservations
      ui/                          # ModalBase, useToast
  Providers.tsx                    # UrqlProvider + Toaster + AuthModal

graphql/
  builder.ts                       # Pothos (PrismaPlugin + RelayPlugin + scalars)
  generated.ts                     # Auto-generated — DO NOT EDIT
  files/                           # .graphql documents (16 domains)
  schema/                          # 16 domain modules
    Area, Category, Dashboard, Delivery, Favorite, GridConfig,
    Menu, Notification, Order, Profile, Reservation, Restaurant,
    Table, TableUsage, User, Waitlist

lib/
  prisma.ts                        # Prisma singleton
  session.ts                       # getCurrentUser()
  store.ts                         # Zustand: cart, sidebar, login modal
  AreaStore.ts                     # Zustand: restaurant floor state
  supabaseStorage.ts               # Image upload/delete
  createOrderNumber.ts             # Order number generation
  menuCategory.ts                  # Menu filter store
  localeUtils.ts                   # Locale utilities

prisma/schema.prisma               # SOURCE OF TRUTH — 18 models, 6 enums
types.ts                           # Shared TS types (Cart, Promo, Category, Lang)
globals.d.ts                       # NextAuth type augmentations
middleware.ts                      # Route protection (withAuth)
```
