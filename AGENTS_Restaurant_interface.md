# AGENTS — Restaurant Interface (ZoneRestaurant)

## Smart Summary

The **Restaurant Interface** is a comprehensive floor-plan management system embedded in the StarManag homepage for **MANAGER** and **WAITER** roles. It replaces the customer-facing hero/promos section with a real-time, interactive floor plan where staff can manage zones, tables, reservations, orders, and special requests — all from a single view.

> **Access**: Homepage (`/`) → requires authenticated user with role `MANAGER` or `WAITER`.
> **Switch Role**: Header → "Switch Role" button → select MANAGER → Save → sign out/in to refresh JWT.

---

## 1. Architecture Overview

| Layer | Technology | Details |
|-------|-----------|---------|
| **Rendering** | Next.js 14 Server Component | `app/page.tsx` conditionally renders `<ZoneRestaurant />` for WAITER/MANAGER roles |
| **State** | Zustand (`useRestaurantStore`) | Areas, tables, scale, dirty-state tracking; persisted to localStorage key `"restaurant-areas"` |
| **Cart Integration** | Zustand (`useCartStore`) | `startOrderForTable(tableId, tableNumber)` links table to cart; persisted key `"You&i_cart"` |
| **API** | GraphQL (Pothos + Apollo Server) | 15+ queries/mutations for areas, tables, grid configs, reservations, orders |
| **Image Storage** | Supabase Storage | Floor plan images uploaded to `Bucket_StarMang` public bucket |
| **UI Framework** | TailwindCSS + Headless UI | Responsive design with RTL (Hebrew) support |

---

## 2. Component Tree

```
ZoneRestaurant (zone_restaurant.tsx)
├── AreaSelector                    — Zone tabs with search + table counts
├── FloorToolbar                    — Zoom, grid, edit mode, save layout, undo
├── TablesSection                   — Interactive floor canvas with draggable tables
│   ├── FloorTable (per table)      — Draggable table with snap-to-grid
│   └── MiniMap                     — Overview navigation minimap
├── TableModal                      — Full detail modal on table click
│   ├── ToggleReservation           — Reserve/Release button
│   ├── Start_an_order_Table        — Start order → navigates to menu
│   ├── specialRequests             — Add/remove special requests
│   └── TableReservations           — Full reservation calendar + form
├── CRUD Modals
│   ├── AddZoneForm / AddZoneModal  — Create new zone/area
│   ├── EditZoneModal               — Edit zone name, description, floor plan image, grid size
│   ├── DeleteZoneModal             — Delete zone with confirmation
│   ├── AddTableModal               — Create table with auto-suggested number
│   ├── EditTableModal              — Edit table properties, move between zones
│   └── DeleteTableModal            — Delete table with confirmation
└── UI Primitives
    ├── ModalBase                   — Accessible modal with focus trap, portal rendering
    └── useToast (ToastProvider)    — Context-based toast notification system
```

---

## 3. Feature Matrix

| Feature | Component | GraphQL Operations | Status |
|---------|-----------|-------------------|--------|
| **Zone/Area Management** | `AddZoneForm`, `EditZoneModal`, `DeleteZoneModal` | `addArea`, `editArea`, `deleteArea`, `getAreasNameDescription` | ✅ Full CRUD |
| **Table Management** | `AddTableModal`, `EditTableModal`, `DeleteTableModal` | `addTable`, `editTable`, `deleteTable`, `getTables` | ✅ Full CRUD |
| **Floor Plan Layout** | `TablesSection`, `FloorTable`, `FloorToolbar` | `updateManyTables`, `getGridConfigByArea` | ✅ Drag-and-drop with grid snap |
| **Table Status** | `TableCard`, `ToggleReservation` | `toggleTableReservation` | ✅ Optimistic UI updates |
| **Overview Modes** | `zone_restaurant.tsx` | Client-side filtering | ✅ ALL / AVAILABLE / UNPAID |
| **Table Detail Modal** | `TableModal` | `getTableOrder`, `editTable` | ✅ Stats, requests, actions |
| **Reservation System** | `TableReservations` | `addReservation`, `addGuestReservation`, `editReservation`, `cancelReservation`, `completeReservation` | ✅ Full calendar + guest support |
| **Special Requests** | `specialRequests` | `editTable` (updates `specialRequests` array) | ✅ Add/remove per table |
| **Start Order from Table** | `Start_an_order_Table` | Cart store `startOrderForTable()` | ✅ Links table → cart → menu |
| **Floor Plan Image** | `EditZoneModal`, `TablesSection` | `editArea` (stores Supabase URL) | ✅ Upload + display as background |
| **Grid Configuration** | `EditZoneModal` | `addGridConfig`, `editGridConfig`, `getGridConfigByArea` | ✅ Per-zone grid size (10-100px) |
| **Zoom & Pan** | `FloorToolbar`, `TablesSection`, `MiniMap` | Client-side | ✅ 50%-200% zoom, minimap nav |
| **Collision Detection** | `floorUtils.ts`, `TablesSection` | Client-side | ✅ Red ring on overlapping tables |
| **Dirty State Tracking** | `useRestaurantStore` | Client-side merge strategy | ✅ Preserves unsaved positions during refetch |

---

## 4. Data Model

### 4.1 Prisma Models (Restaurant Domain)

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **Area** | `id`, `name`, `description`, `floorPlanImage`, `parentId`, `restaurantId` | → `Restaurant`, → parent `Area`, → `Table[]`, → `GridConfig`, → `Waitlist[]` |
| **Table** | `id`, `tableNumber` (unique), `diners`, `reserved`, `specialRequests[]`, `position` (JSON), `areaId` | → `Area`, → `Reservation[]`, → `Order[]`, → `TableUsage` |
| **GridConfig** | `id`, `areaId` (unique), `gridSize` (default 20) | → `Area` |
| **Reservation** | `id`, `userEmail`, `tableId`, `status`, `reservationTime`, `numOfDiners`, `createdBy` (Role), `createdByUserEmail` | → `User`, → `Table` |
| **TableUsage** | `id`, `tableId` (unique), `usageCount`, `lastUsed` | → `Table` |
| **Waitlist** | `id`, `userEmail`, `areaId`, `numOfDiners`, `status`, `calledAt`, `seatedAt`, `priority` | → `User`, → `Area` |

### 4.2 Enums

| Enum | Values |
|------|--------|
| `ReservationStatus` | `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` |
| `WaitlistStatus` | `WAITING`, `CALLED`, `SEATED`, `CANCELLED` |

---

## 5. Zustand Store: `useRestaurantStore`

| State | Type | Description |
|-------|------|-------------|
| `selectedArea` | `BasicArea \| null` | Currently active zone |
| `areas` | `BasicArea[]` | All loaded zones |
| `scale` | `number` | Zoom level (0.5 – 2.0) |
| `scaleLimits` | `{ min: 0.5, max: 2 }` | Zoom boundaries |
| `tables` | `TableInStore[]` | All tables with local dirty-state tracking |

| Action | Behavior |
|--------|----------|
| `setAreas(areas)` | Replaces area list |
| `setSelectedArea(idOrName)` | Finds and sets active area by ID or name |
| `setScale(n)` / `adjustScale(delta)` | Clamped zoom |
| `setTables(fetched)` | **Merge strategy**: preserves local dirty positions; refreshes server fields (reserved, diners, requests) |
| `moveTable(id, areaId, pos)` | Updates position + marks `dirty: true` |
| `setTableReserved(id, bool)` | Optimistic reservation toggle |
| `markTablesClean(ids?)` | Clears dirty flags after save |

> **Key Gotcha**: `setTables` uses a merge strategy that preserves locally-dirty table positions during server refetches. This prevents `ToggleReservation` or other mutations from wiping unsaved drag-and-drop layout changes.

---

## 6. GraphQL Operations Reference

### 6.1 Queries

| Query | Arguments | Returns | Used By |
|-------|-----------|---------|---------|
| `getAreas` | — | `Area[]` with tables | Zone loading |
| `getAreasNameDescription` | — | `BasicArea[]` (id, name, floorPlanImage) | Area selector, CRUD modals |
| `getArea(id)` | `id: String!` | Full `Area` | Edit zone modal |
| `getTables` | — | `Table[]` | Floor plan rendering |
| `getTableOrder(tableId)` | `tableId: String!` | Active orders for table | Table modal stats |
| `getGridConfigByArea(areaId)` | `areaId: String!` | `GridConfig` | Grid size per zone |
| `getReservations` | — | `Reservation[]` | Reservation calendar |
| `getTableReservations(tableId)` | `tableId: String!` | Reservations for specific table | Table reservations panel |
| `getAvailableTables` | — | Available `Table[]` | Available filter |

### 6.2 Mutations

| Mutation | Arguments | Used By |
|----------|-----------|---------|
| `addArea(name, description)` | `name!, description` | Add zone form |
| `editArea(id, name, description, floorPlanImage)` | `id!, name, desc, img` | Edit zone modal |
| `deleteArea(id)` | `id!` | Delete zone modal |
| `addTable(tableNumber, diners, areaId, position)` | `tableNumber!, diners!, areaId!, pos` | Add table modal |
| `editTable(id, tableNumber, diners, areaId, reserved, position, specialRequests)` | `id!, ...fields` | Edit table, special requests |
| `deleteTable(id)` | `id!` | Delete table modal |
| `updateManyTables(tables[])` | `[{id, areaId, position}]` | Save layout (batch) |
| `toggleTableReservation(id)` | `id!` | Toggle reservation button |
| `addReservation(...)` | `userEmail, tableId, numOfDiners, reservationTime, createdBy` | Reservation form |
| `addGuestReservation(...)` | `customerName, tableId, numOfDiners, reservationTime, createdBy` | Guest reservation form |
| `editReservation(id, ...)` | `id!, fields` | Reservation edit |
| `cancelReservation(id)` | `id!` | Cancel reservation |
| `completeReservation(id)` | `id!` | Mark reservation complete |
| `addGridConfig(areaId, gridSize)` | `areaId!, gridSize!` | Create grid config |
| `editGridConfig(id, gridSize)` | `id!, gridSize!` | Update grid config |
| `movePositionTable(id, areaId, position)` | `id!, areaId!, position!` | Single table move |

---

## 7. UI Behaviors & Interaction Patterns

### 7.1 Floor Plan Canvas

| Behavior | Description |
|----------|-------------|
| **Grid Snap** | Tables snap to grid (configurable per zone, default 20px) |
| **Collision Detection** | Red pulsing ring shown when tables overlap |
| **Drag vs Click** | Distinguished by movement threshold — small movement = click (opens modal), large = drag |
| **Floor Plan Image** | Zone background image from Supabase; canvas sized to image dimensions |
| **MiniMap** | Collapsible overview with color-coded dots: 🟢 available, 🔴 reserved, 🟡 unpaid, ⚪ locked |
| **Zoom** | 50%–200% via toolbar buttons or scroll wheel; displayed as percentage |

### 7.2 Table Cards (Visual States)

| State | Indicator | Background | Number Color |
|-------|-----------|-----------|-------------|
| **Available** | 🟢 Green dot + "פנוי" label | White | Dark slate |
| **Reserved/Occupied** | 🔴 Red dot + "תפוס" label | Light rose | Red |
| **Has Unpaid Orders** | Blue badge with count | Rose tint | Red |
| **Dirty (unsaved position)** | Amber "unsaved" badge | — | — |

### 7.3 Table Modal Sections

| Section | Content |
|---------|---------|
| **Header** | Table number badge, area name, status indicator |
| **Toggle Button** | "Reserve" (green) or "Release" (red) depending on state |
| **Stats Row** | Diners count, time on table, items ordered, total payment |
| **Start Order** | Orange button → sets cart table context → navigates to `/#menuSection` |
| **Special Requests** | Add/remove text requests; saved via `editTable` mutation |
| **Reservations** | Blue button opens full reservation management modal |
| **Actions** | Edit (opens `EditTableModal`) / Delete (opens `DeleteTableModal`) |

### 7.4 Reservation Calendar

| Feature | Details |
|---------|---------|
| **Date Filter** | Calendar date picker; filters reservations by selected date |
| **New Reservation** | Form: customer name OR email, diners count, date, time |
| **Guest Reservations** | No email required — uses `addGuestReservation` mutation |
| **Status Actions** | Edit, Complete, Cancel, Restore — with color-coded badges |
| **History Sidebar** | Left panel shows full timeline with PENDING (blue), COMPLETED (gray), CANCELLED (red) |
| **RTL Layout** | Full right-to-left support for Hebrew interface |

---

## 8. File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `zone_restaurant.tsx` | ~600 | Main orchestrator: zones, tables, overview modes, edit mode, CRUD coordination |
| `TablesSection.tsx` | ~180 | Canvas with floor plan image, grid overlay, zoom/pan, collision detection |
| `FloorTable.tsx` | ~170 | Single draggable table: grid snap, drag/click detection, selection ring |
| `FloorToolbar.tsx` | ~120 | Toolbar: zoom, grid toggle, edit mode, save, undo, dirty count |
| `MiniMap.tsx` | ~180 | Collapsible overview: color-coded dots, viewport rectangle, click-to-navigate |
| `AreaSelector.tsx` | ~100 | Zone tabs: searchable, table count badges, keyboard navigation |
| `TableCard.tsx` | ~120 | Table card: status colors, seat count, unpaid badge, special requests badge |
| `TableModal.tsx` | ~350 | Detail modal: stats, requests, order start, reservation link, edit/delete |
| `TableSheet.tsx` | ~100 | Mobile bottom sheet: quick actions |
| `TableInspector.tsx` | ~100 | Enhanced inspector: multi-select, lock, edit mode features |
| `floorUtils.ts` | ~60 | Utilities: grid snap, collision detection, position clamping, date formatting |
| `CRUD_Zone-CRUD_Table/AddZoneForm.tsx` | ~80 | Zone creation form + modal |
| `CRUD_Zone-CRUD_Table/EditZoneModal.tsx` | ~180 | Zone edit: name, description, floor plan upload, grid config |
| `CRUD_Zone-CRUD_Table/DeleteZoneModal.tsx` | ~80 | Zone deletion confirmation |
| `CRUD_Zone-CRUD_Table/AddTableModal.tsx` | ~130 | Table creation: auto-suggest number, zone selection, position |
| `CRUD_Zone-CRUD_Table/EditTableModal.tsx` | ~150 | Table edit: area transfer, number, diners, position, reserved |
| `CRUD_Zone-CRUD_Table/DeleteTableModal.tsx` | ~70 | Table deletion confirmation |
| `Table_Settings/ToggleReservation.tsx` | ~60 | Toggle reserved/available with optimistic update |
| `Table_Settings/specialRequests.tsx` | ~90 | Special requests CRUD (add/remove text entries) |
| `Table_Settings/Start_an_order_Table.tsx` | ~30 | Start order button → links table to cart store |
| `Table_Settings/TableReservations.tsx` | ~350 | Full reservation management: calendar, form, guest, history, status actions |
| `ui/ModalBase.tsx` | ~120 | Accessible modal: focus trap, escape key, portal, mobile sheet |
| `ui/useToast.tsx` | ~100 | Toast system: success/error/info, auto-dismiss, max 4 visible |

---

## 9. Key Conclusions

| # | Conclusion |
|---|-----------|
| 1 | The restaurant interface is a **production-grade floor management system** with 24 components, full CRUD, real-time state management, and drag-and-drop layout editing. |
| 2 | **Role gating is server-side** (`app/page.tsx` checks `user.role`), but JWT refresh requires sign-out/sign-in after role change via the "Switch Role" modal. |
| 3 | **Zustand merge strategy** in `setTables` is critical — it prevents server refetches from overwriting unsaved local layout edits (dirty-state pattern). |
| 4 | **Guest reservations** are first-class — `addGuestReservation` allows reservations without a registered user email (uses customer name instead). |
| 5 | **Table-to-order flow**: "Start order" button → `useCartStore.startOrderForTable(tableId, tableNumber)` → router navigates to `/#menuSection` → cart is now linked to that table. |
| 6 | The floor plan supports **per-zone grid configs** (10–100px), **background images** (Supabase), and **collision detection** between overlapping tables. |
| 7 | **Overview modes** (All/Available/Unpaid) switch between zone-specific canvas view and a cross-zone list view for quick scanning. |
| 8 | All CRUD operations use **GraphQL mutations** with toast feedback, loading states, and automatic list refresh after changes. |
| 9 | The **MiniMap** provides viewport navigation on large floor plans — color-coded dots show table status at a glance. |
| 10 | **Hebrew/RTL** is fully supported throughout — labels, reservation forms, and modal layouts all render right-to-left. |

---

## 10. Testing Notes for Agents

| Test | How to Execute | Expected Result |
|------|---------------|-----------------|
| **View restaurant interface** | Switch role to MANAGER → sign out → sign in → homepage | ZoneRestaurant component renders instead of HeroSection + Promos |
| **Switch zones** | Click zone tab in header or AreaSelector | Tables refresh for selected zone; floor plan image changes |
| **Filter tables** | Click "Available" or "Unpaid" in toolbar | Cross-zone list view showing only matching tables |
| **Open table modal** | Click any table card | Modal shows stats, actions (Reserve/Release, Start Order, Special Requests, Reservations) |
| **Toggle reservation** | In table modal → click "Reserve" or "Release" | Optimistic UI update → green/red status changes immediately |
| **Start order from table** | In table modal → click orange "Start order" button | Cart store sets tableId/tableNumber → redirects to `/#menuSection` |
| **Manage reservations** | In table modal → click blue "Manage Reservations" button | Full-screen calendar with reservation CRUD, guest support, status actions |
| **Edit zone** | Toolbar → "Edit Zone" | Modal with name, description, floor plan upload, grid size config |
| **Add table** | Toolbar → "+ Add Table" | Form with auto-suggested number, zone selector, position inputs |
| **Drag table (edit mode)** | Toolbar → "View mode" (toggles to edit) → drag table | Table snaps to grid; marked dirty; "Save layout" button activates |
| **Save layout** | After dragging → click "Save layout" | Batch `updateManyTables` mutation; dirty flags cleared |
| **Zoom floor plan** | Toolbar zoom buttons or scroll wheel | Canvas scales 50%–200%; MiniMap viewport updates |
| **Test collision** | In edit mode → drag table over another | Red pulsing ring on overlapping tables |

---

*Generated from source code analysis of 24 component files under `app/components/Restaurant_interface/` and live testing of the MANAGER role interface.*
