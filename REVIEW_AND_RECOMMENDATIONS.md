# StarManag — Application Review & Recommendations

## Executive Summary

This document contains a comprehensive code review of the StarManag restaurant management platform, focusing on the **Restaurant Interface** (ZoneRestaurant), its data layer, filtering logic, and overall application architecture. The review identifies **critical bugs**, **logical errors**, **interface gaps**, and provides a prioritized **action plan** for bringing the product to a professional, production-ready level.

---

## Part 1: Critical Bugs Found

### BUG-1: UNPAID Filter Shows Reserved Tables Instead of Unpaid Orders (CRITICAL)

**Location**: `app/components/Restaurant_interface/zone_restaurant.tsx` — lines 508–513

**Problem**: The "Unpaid" overview filter does NOT filter by unpaid orders. It incorrectly filters by `t.reserved`, which means it shows *reserved/occupied* tables — not tables with unpaid orders.

```typescript
// CURRENT (BROKEN):
const list =
  overviewMode === "AVAILABLE"
    ? group.filter((t) => !t.reserved)
    : overviewMode === "UNPAID"
    ? group.filter((t) => t.reserved) // ❌ Filters by reserved, NOT by unpaid orders
    : group;
```

**Root Cause**: The `unpaidOrdersCount` field is never populated in the Zustand store, so the developer fell back to using `reserved` as a proxy — which is semantically wrong.

**Impact**: Staff cannot identify tables that need to pay, which is a core operational feature for restaurant management.

**Fix Required**:
```typescript
// CORRECT:
const list =
  overviewMode === "AVAILABLE"
    ? group.filter((t) => !t.reserved)
    : overviewMode === "UNPAID"
    ? group.filter((t) => (t.unpaidOrdersCount || 0) > 0)
    : group;
```

---

### BUG-2: `unpaidOrdersCount` Not Fetched by GetTables Query (CRITICAL)

**Location**: `graphql/files/table.graphql` — line 36

**Problem**: The `.graphql` file contains a literal `+` character before `unpaidOrdersCount`:

```graphql
query GetTables {
  getTables {
    id
    tableNumber
    diners
    areaId
    reserved
    specialRequests
+   unpaidOrdersCount    # ← The "+" is literally in the file (copy-paste from git diff)
    position
    createdAt
    updatedAt
  }
}
```

This `+` character causes the codegen to either skip or fail to parse the field, resulting in the generated `GetTablesDocument` completely **missing** `unpaidOrdersCount`.

**Evidence** — Generated code at `graphql/generated.ts` line 2477–2491:
```typescript
export const GetTablesDocument = gql`
    query GetTables {
  getTables {
    areaId
    createdAt
    diners
    id
    position
    reserved
    specialRequests
    tableNumber
    updatedAt
    // ← unpaidOrdersCount is MISSING
  }
}`;
```

**Fix Required**:
1. Remove the `+` character from `graphql/files/table.graphql`
2. Run `yarn codegen` to regenerate `graphql/generated.ts`
3. Map `unpaidOrdersCount` in the table hydration code in `zone_restaurant.tsx`

---

### BUG-3: `unpaidOrdersCount` Never Mapped During Table Hydration (CRITICAL)

**Location**: `app/components/Restaurant_interface/zone_restaurant.tsx` — lines 182–193

**Problem**: Even if the GraphQL query were fixed, the hydration code does not map `unpaidOrdersCount` from the fetched data to the Zustand store:

```typescript
const fetched: TableInStore[] = data.map((t) => ({
  id: t.id,
  tableNumber: t.tableNumber,
  areaId: t.areaId,
  diners: t.diners,
  reserved: t.reserved,
  specialRequests: t.specialRequests ?? [],
  position: (t.position as any) ?? { x: 0, y: 0 },
  createdAt: t.createdAt,
  updatedAt: t.updatedAt,
  dirty: false,
  // ❌ MISSING: unpaidOrdersCount: t.unpaidOrdersCount ?? 0,
}));
```

**Fix Required**: Add `unpaidOrdersCount: t.unpaidOrdersCount ?? 0` to the mapping.

---

### BUG-4: `getTableOrder` Includes CANCELLED Orders (MEDIUM)

**Location**: `graphql/schema/Table/queries.ts` — lines 134–143

**Problem**: The `activeStatuses` array used by the `getTableOrder` query includes `OrderStatus.CANCELLED`:

```typescript
const activeStatuses = [
  OrderStatus.CANCELLED,  // ❌ Should not be included in "active" orders
  OrderStatus.COLLECTED,
  OrderStatus.DELIVERED,
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.UNASSIGNED,
  OrderStatus.SERVED
];
```

**Impact**: The TableModal stats (total items, total amount, time on table) include cancelled orders, inflating the displayed totals. Staff may see incorrect payment amounts.

**Fix Required**: Remove `OrderStatus.CANCELLED` from the `activeStatuses` array.

---

### BUG-5: MiniMap Unpaid Color Never Shown (LOW)

**Location**: `app/components/Restaurant_interface/TablesSection.tsx` → passes table data to `MiniMap.tsx`

**Problem**: The MiniMap checks for `t.unpaid` to show amber dots for tables with unpaid orders. However, `unpaid` is never set on the table data passed to the MiniMap because `unpaidOrdersCount` is never fetched (see BUG-2/BUG-3).

**Impact**: MiniMap always shows only green (available) and red (reserved) dots, never amber (unpaid). The minimap loses a critical visual status indicator.

**Fix Required**: After fixing BUG-2 and BUG-3, pass `unpaid: (t.unpaidOrdersCount || 0) > 0` when constructing the MiniMap's table data.

---

### BUG-6: Empty State Check in Overview Mode Duplicates UNPAID Bug (LOW)

**Location**: `app/components/Restaurant_interface/zone_restaurant.tsx` — lines 553–569

**Problem**: The "no results" empty state check at line 558–559 uses the same broken `t.reserved` logic:

```typescript
const list = overviewMode === "UNPAID" ? group.filter(t => t.reserved) : group;
```

This must be fixed in sync with BUG-1.

---

### BUG-7: Dashboard Revenue May Include Unpaid Orders (LOW-MEDIUM)

**Location**: `graphql/schema/Dashboard/queries.ts` — lines 199–206

**Problem**: The revenue KPI calculation sums `total` for all non-cancelled orders, regardless of the `paid` field:

```sql
SUM(total) WHERE status <> 'CANCELLED'
```

This means unpaid orders are counted as revenue. Depending on business requirements, this may overstate actual collected revenue.

**Recommendation**: Add an option to filter by `paid = true` for "collected revenue" vs. "total billed revenue", and clearly label the dashboard KPI accordingly.

---

### BUG-8: `visibleTables` Memo for UNPAID Mode Missing (MEDIUM)

**Location**: `app/components/Restaurant_interface/zone_restaurant.tsx` — lines 217–222

**Problem**: The `visibleTables` memo does not handle `UNPAID` mode. It only handles `ALL`, `AVAILABLE`, and per-area filtering:

```typescript
const visibleTables = useMemo(() => {
  if (overviewMode === "ALL") return tables;
  if (overviewMode === "AVAILABLE") return tables.filter((t) => !t.reserved);
  if (!selectedArea) return [];
  return tables.filter((t) => t.areaId === selectedArea.id);
}, [tables, selectedArea, overviewMode]);
```

When `overviewMode === "UNPAID"`, it falls through to the per-area filter logic, which may return an empty list if no area is selected. However, this `visibleTables` is only used in the "NONE" mode canvas view, so the impact is indirect. Still, for consistency and future-proofing, add explicit `UNPAID` handling.

---

## Part 2: Logical Issues & Code Quality

### LOGIC-1: Middleware Inconsistency — `/dashboard/orders` Access

**Middleware** (`middleware.ts` line 9–11) only allows `ADMIN` for `/dashboard/*` routes. But the **server-side check** in `app/(dashboard)/dashboard/orders/page.tsx` also allows `MANAGER`:

```typescript
if (!user || (user.role !== "ADMIN" && user.role !== "MANAGER")) {
  redirect("/");
}
```

A user with `MANAGER` role will be **redirected by middleware before reaching the page**, making the server-side MANAGER check dead code.

**Fix**: Either add `MANAGER` to the middleware dashboard check, or remove the MANAGER check from the orders page. Given that managers should likely access orders, updating middleware is the correct fix.

---

### LOGIC-2: `/payment-failure` Route Not Protected

**Location**: `middleware.ts` line 33

The matcher includes `/payment-success` but not `/payment-failure`. While payment failure may not contain sensitive data, the inconsistency suggests an oversight.

---

### LOGIC-3: `canManage` Always `true`

**Location**: `zone_restaurant.tsx` line 51

```typescript
const canManage = true;
```

This means all WAITER and MANAGER users get full CRUD permissions. In a professional setup, waiters should have limited permissions (e.g., toggle reservation, start order) but not zone/table creation and deletion.

**Recommendation**: Derive `canManage` from the user's role:
```typescript
const canManage = user?.role === "MANAGER" || user?.role === "ADMIN";
```

---

### LOGIC-4: Date/Timezone Handling in Reservations

**Location**: `graphql/schema/Table/queries.ts` — lines 171–175

```typescript
const startOfDay = new Date(args.date);
startOfDay.setHours(0, 0, 0, 0);
```

`new Date("2024-06-01")` creates a UTC midnight date, but `setHours(0,0,0,0)` adjusts to local server time. This can cause off-by-one-day errors if the server timezone differs from the restaurant's timezone (Israel: UTC+2/+3).

**Recommendation**: Use explicit timezone handling or a date library like `date-fns-tz`.

---

### LOGIC-5: Guest User Creation Without Cleanup

**Location**: `graphql/schema/Reservation/mutations.ts` — lines 56–67

The `addGuestReservation` mutation creates fake user records with emails like `guest_name_123456@internal.local`. These users accumulate in the database with no cleanup mechanism. Over time, this will pollute the user table.

**Recommendations**:
1. Add a periodic cleanup job for `@internal.local` users
2. Or mark them with a `isGuest: true` flag on the User model
3. Or use a separate `GuestReservation` approach that doesn't create User records

---

### LOGIC-6: `activeOrders` Memoization Warning

**Location**: `app/components/Restaurant_interface/TableModal.tsx` line 78, `app/cart/TableCartSummary.tsx` line 124

ESLint warns that the `activeOrders` logical expression could change memo dependencies on every render. Wrap in `useMemo`:

```typescript
const activeOrders = useMemo(() => ordersData?.getTableOrder || [], [ordersData]);
```

---

## Part 3: Interface Improvement Recommendations

### UI-1: Add Table Lifecycle Status System

**Current**: Tables have only two states — `reserved` (occupied) and `!reserved` (available).

**Problem**: In a real restaurant, a table goes through multiple stages: Available → Seated → Ordering → Food Preparing → Served → Waiting for Payment → Paid/Cleared. Using a single boolean `reserved` cannot capture this workflow.

**Recommendation**: Add a `tableStatus` enum to the Table model:
```
AVAILABLE | SEATED | ORDERING | FOOD_PREPARING | SERVED | AWAITING_PAYMENT | CLEANING
```

This enables:
- Color-coded table cards showing exact status
- Automated status transitions (e.g., when an order is placed, status moves to ORDERING)
- Better filtering (e.g., show all tables awaiting payment)
- Staff can see at a glance what action each table needs

---

### UI-2: Add Real-Time Updates (WebSocket / Polling)

**Current**: Data refreshes only on page load or after explicit mutations. There's no mechanism for one waiter's action to appear on another waiter's screen in real-time.

**Recommendation**: Implement one of:
- **GraphQL Subscriptions** via WebSocket (Apollo Server supports this)
- **Polling** at 10–15 second intervals for the `getTables` query
- **Server-Sent Events (SSE)** for lightweight push updates

Priority: HIGH — this is critical for multi-staff environments where two waiters may serve the same zone.

---

### UI-3: Add Table Timer / Occupancy Duration

**Current**: The TableModal shows "time since last order" but there's no visible timer on the floor plan showing how long each table has been occupied.

**Recommendation**: 
- Track `occupiedSince` timestamp when a table is reserved
- Show elapsed time on the TableCard (e.g., "45 min" in a badge)
- Highlight tables exceeding a configurable threshold (e.g., > 2 hours → orange warning)

This helps managers identify tables that are taking too long and may need attention.

---

### UI-4: Integrate Waitlist UI into Restaurant Interface

**Current**: The Waitlist API is fully built (add, call, seat, cancel entries) but there is **no UI component** for it. The waitlist has no representation in the restaurant interface.

**Recommendation**: Add a `WaitlistPanel` component that:
- Shows current waitlist per zone
- Allows staff to add walk-in guests to the waitlist
- Shows estimated wait time based on table turnover
- Provides "Call" and "Seat" actions
- Integrates with SMS/notification when their table is ready

This is a major missing feature for any restaurant that experiences high traffic.

---

### UI-5: Add Overview Filter Counts

**Current**: The filter buttons (All Tables, Available, Unpaid) don't show how many tables match each filter.

**Recommendation**: Add count badges to each filter button:
```
[All Tables (24)] [Available (12)] [Unpaid (5)]
```

This gives staff instant visibility into the restaurant's state without clicking each filter.

---

### UI-6: Add Kitchen Display Integration

**Current**: Orders are created and tracked, but there's no kitchen-facing view showing incoming orders, preparation queue, and ready-to-serve items.

**Recommendation**: Add a Kitchen Display System (KDS) page at `/dashboard/kitchen` with:
- Incoming orders queue (sorted by time)
- Order preparation timer
- "Mark as Ready" button per order/item
- Audio notification for new orders
- Display by course (appetizer → main → dessert)

This is essential for professional restaurant operation.

---

### UI-7: Add Bill Splitting & Payment Tracking

**Current**: Orders are linked to a table, but there's no support for:
- Splitting a bill among multiple guests
- Partial payments
- Tracking who paid what

**Recommendation**: Add a `Payment` model with:
- Split by equal parts, by item, or custom amounts
- Support for multiple payment methods per table (cash + card mix)
- Payment status tracking per split
- Integrate with PayPlus for individual payment links per split

---

### UI-8: Add Table Merging / Linking

**Current**: Each table is independent. There's no way to merge tables for large groups.

**Recommendation**: Add a `tableGroup` concept:
- Select multiple adjacent tables to create a group
- Combined view for orders across the group
- Single bill option for the group
- Visual indicator on the floor plan (tables connected by a dotted line)

---

### UI-9: Add Staff Assignment to Tables/Zones

**Current**: `canManage = true` for all staff. There's no concept of which waiter is responsible for which zone or tables.

**Recommendation**: Add a `StaffAssignment` model:
- Assign waiters to specific zones
- Show waiter name/avatar on table cards
- Filter tables "my tables" vs "all tables"
- Track waiter performance metrics (tables served, average time, tips)

---

### UI-10: Improve TableCard Information Density

**Current**: Table cards show table number, status (reserved/available), diners count, special requests count, and the unpaid badge (when working).

**Recommendation**: Enhance table cards with:
- **Elapsed time** since table was seated (timer badge)
- **Current order status** (Ordering / Preparing / Served / Awaiting Payment)
- **Revenue indicator** (total amount for current session)
- **Reservation indicator** (upcoming reservation for this table within 1 hour)
- **Quick actions** on hover (reserve/release toggle without opening modal)

---

### UI-11: Add Notification/Alert System for Table Events

**Current**: The `Notification` model exists in the schema but is not integrated into the restaurant interface.

**Recommendation**: Add real-time alerts for:
- Order ready (food is prepared, needs to be served)
- Table occupied too long (configurable threshold)
- New reservation arriving soon (30-min warning)
- Table requesting attention (customer can signal via QR code)
- Payment received / Payment failed

Display these as push notifications, toast messages, and a notification bell in the toolbar.

---

### UI-12: Add Mobile-Optimized Waiter View

**Current**: The restaurant interface works on mobile but is essentially the desktop view scaled down. The full floor plan with drag-and-drop is not ideal for mobile.

**Recommendation**: Add a dedicated mobile view for waiters:
- **Card list view** (not floor plan) as default on small screens
- **Swipe actions** on table cards (swipe to reserve/release, swipe to start order)
- **Bottom navigation** with quick filters (My Tables / All / Unpaid)
- **Large touch targets** for all interactive elements
- **Offline support** for viewing table status when WiFi is spotty

---

### UI-13: Add Floor Plan Editor Improvements

**Current**: The floor plan editor supports drag-and-drop, grid snap, collision detection, and background images.

**Recommendations**:
- **Table shapes**: Support round, square, rectangular tables with visual differentiation
- **Furniture/decor elements**: Add non-interactive elements (walls, bars, columns, plants) for accurate floor representation
- **Table capacity indicator**: Show max capacity vs current diners visually
- **Copy/duplicate table**: Quick way to add similar tables
- **Multi-select drag**: Select and move multiple tables at once
- **Undo/redo stack**: Currently only one level of undo — add full undo history
- **Auto-layout**: Suggest optimal table placement for a given number of tables

---

### UI-14: Add QR Code for Customer Self-Service

**Recommendation**: Generate a unique QR code per table that customers can scan to:
- View the menu on their phone
- Place orders directly (sent to kitchen)
- Request waiter attention
- View their bill
- Pay from their phone

This reduces waiter workload and improves customer experience.

---

## Part 4: Prioritized Action Plan

### Phase 1 — Fix Critical Bugs (Immediate — 1-2 days)

| Priority | Task | Files Affected |
|----------|------|---------------|
| P0 | Fix `+` prefix in `table.graphql` and regenerate code | `graphql/files/table.graphql`, `graphql/generated.ts` |
| P0 | Fix UNPAID filter to use `unpaidOrdersCount` | `zone_restaurant.tsx` |
| P0 | Map `unpaidOrdersCount` in table hydration | `zone_restaurant.tsx` |
| P0 | Remove `CANCELLED` from `getTableOrder` active statuses | `graphql/schema/Table/queries.ts` |
| P1 | Fix MiniMap to pass `unpaid` flag | `TablesSection.tsx` or `zone_restaurant.tsx` |
| P1 | Fix middleware to allow MANAGER access to `/dashboard/orders` | `middleware.ts` |
| P1 | Fix `activeOrders` memoization warnings | `TableModal.tsx`, `TableCartSummary.tsx` |

### Phase 2 — Core Professional Features (1-2 weeks)

| Priority | Task | Estimated Effort |
|----------|------|-----------------|
| P1 | Add overview filter count badges | 2 hours |
| P1 | Add table occupancy timer | 1 day |
| P1 | Add real-time polling for table updates (10s interval) | 4 hours |
| P1 | Implement role-based `canManage` permissions | 4 hours |
| P2 | Build Waitlist UI panel | 2-3 days |
| P2 | Add table lifecycle status enum | 2-3 days |
| P2 | Add notification/alert system for table events | 2-3 days |

### Phase 3 — Advanced Features (2-4 weeks)

| Priority | Task | Estimated Effort |
|----------|------|-----------------|
| P2 | Build Kitchen Display System (KDS) | 1 week |
| P2 | Add bill splitting and payment tracking | 1 week |
| P3 | Add staff assignment to tables/zones | 3-4 days |
| P3 | Add table merging/linking | 3-4 days |
| P3 | Build mobile-optimized waiter view | 1 week |
| P3 | Implement QR code self-service | 1 week |

### Phase 4 — Polish & Scale (Ongoing)

| Priority | Task | Estimated Effort |
|----------|------|-----------------|
| P3 | Floor plan editor improvements (shapes, furniture, multi-select) | 1-2 weeks |
| P3 | Guest user cleanup / flagging system | 2-3 days |
| P3 | Timezone-aware date handling | 1-2 days |
| P4 | Performance optimization (virtualization for large floor plans) | 3-4 days |
| P4 | Automated test suite setup | 1-2 weeks |
| P4 | Accessibility audit and fixes | 1 week |

---

## Part 5: Architecture Recommendations

### ARCH-1: Add Automated Test Suite

The project has **zero automated tests**. For a production restaurant management system, this is a significant risk. Recommend:
- **Unit tests**: Zustand store logic (especially the merge strategy in `setTables`)
- **Integration tests**: GraphQL resolvers (especially order/payment flows)
- **E2E tests**: Critical user flows (login → switch role → manage tables → place order)
- **Framework**: Vitest for unit/integration, Playwright for E2E

### ARCH-2: Add Error Boundary Components

No error boundaries exist in the React component tree. A crash in one component (e.g., MiniMap) will bring down the entire restaurant interface. Add error boundaries around:
- `ZoneRestaurant` (main interface)
- `TablesSection` (floor plan canvas)
- `TableModal` (detail modal)
- `TableReservations` (reservation management)

### ARCH-3: Add Logging & Monitoring

No structured logging or error monitoring exists. For a production system, add:
- **Sentry** or similar for client-side error tracking
- **Structured server logging** for GraphQL resolvers
- **Performance monitoring** for slow queries (especially dashboard KPIs with raw SQL)

### ARCH-4: Optimize N+1 Queries

The `unpaidOrdersCount` field on Table executes a separate `prisma.order.count()` query **for each table**. With 50+ tables, this means 50+ database queries per `getTables` call.

**Recommendation**: Use Prisma's `_count` relation or a DataLoader pattern to batch these queries.

### ARCH-5: Add Database Indexes

Ensure indexes exist for:
- `Order.tableId` (already has `@@index([tableId])`)
- `Order.paid` + `Order.status` (composite index for unpaid order counts)
- `Reservation.tableId` + `Reservation.reservationTime` (for date-range queries)

---

## Summary

The StarManag restaurant interface is a well-structured and feature-rich system with a solid architectural foundation. However, the **UNPAID filter is completely non-functional** due to a chain of three bugs (syntax error in GraphQL file → missing field in codegen → missing mapping in hydration). This is the highest-priority fix.

Beyond bugs, the system lacks several features essential for professional restaurant operation: real-time updates, table lifecycle tracking, waitlist management (UI), kitchen display, bill splitting, and staff assignment. The prioritized action plan above provides a clear path from bug fixes to a fully professional system.

---

*Review conducted on February 26, 2026 — based on full source code analysis of 24+ component files, 16 GraphQL schema modules, Prisma schema, and Zustand stores.*
