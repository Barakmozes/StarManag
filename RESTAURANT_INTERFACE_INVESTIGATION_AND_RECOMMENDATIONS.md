# Restaurant Interface Investigation and Recommendations

**Last synchronized:** 2026-02-26  
**Purpose:** Keep investigation context in this branch so future agents can continue without the unmerged previous branch.

---

## 1) Synchronization Status (this branch)

| Topic from prior report | State in this branch | Notes |
|---|---|---|
| UNPAID filter used `reserved` instead of unpaid count | ✅ Synced and fixed | Filter now uses `unpaidOrdersCount > 0` in overview mode. |
| `unpaidOrdersCount` missing from tables data flow | ✅ Synced and fixed | Added to GraphQL query/type and mapped into `TableInStore`. |
| Role/management reliability in restaurant UI | ✅ Improved | `ZoneRestaurant` now receives `userRole`; manage/edit layout is role-gated (ADMIN/MANAGER). |
| Table release while unpaid orders exist | ✅ Improved | Backend blocks releasing tables that still have unpaid open orders. |
| Table order retrieval semantics | ✅ Improved | `getTableOrder` now returns only unpaid and non-cancelled/non-completed orders. |
| GraphQL document quality in `table.graphql` | ✅ Improved | Fixed invalid `+` marker and invalid empty `table {}` selection in reservation mutation doc. |
| MiniMap integration | ⏳ Not implemented yet | Component still exists but is not mounted in UI flow. |
| Edit Zone icon action wiring polish | ⏳ Not implemented yet | Still recommended for next iteration. |
| Real-time refresh/subscriptions | ⏳ Not implemented yet | Recommended enhancement for peak-hour operations. |

---

## 2) Code-Level Changes Applied

### A. UNPAID logic correctness
- `app/components/Restaurant_interface/zone_restaurant.tsx`
  - Added `unpaidOrdersCount` to hydrated store table mapping.
  - Updated `UNPAID` view/list filters to use unpaid count instead of `reserved`.

### B. GraphQL table data flow
- `graphql/files/table.graphql`
  - `GetTables` now contains `unpaidOrdersCount` as a valid field (syntax corrected).
  - `CancelReservation` document now selects `tableNumber` instead of empty `table {}`.
- `graphql/generated.ts`
  - `GetTablesDocument` includes `unpaidOrdersCount`.
  - `GetTablesQuery` type includes `unpaidOrdersCount: number`.

### C. Role-aware management behavior
- `app/page.tsx`
  - Passes `user?.role` into `ZoneRestaurant`.
- `app/components/Restaurant_interface/zone_restaurant.tsx`
  - `canManage` is now derived from role (`ADMIN` or `MANAGER`) instead of hardcoded true.

### D. Reservation and payment safety
- `graphql/schema/Table/queries.ts`
  - `getTableOrder` now filters to unpaid orders and excludes `CANCELLED`/`COMPLETED`.
- `graphql/schema/Table/mutations.ts`
  - `toggleTableReservation` blocks release if unpaid open orders exist.
  - `addOrderToTable` now sets table as reserved in the same transaction as order creation.

### E. UI robustness polish
- `app/components/Restaurant_interface/TableModal.tsx`
  - Removed invalid nested button structure around `ToggleReservation`.
  - Stabilized active orders memoization for cleaner hook behavior.
  - Standardized amount display to `₪` with fixed decimal output.

---

## 3) Runtime Validation Notes

Validated in this branch:
- Lint and production build pass.
- GraphQL runtime probes confirmed prior false-negative condition:
  - Reserved-based "old unpaid" count was lower than true unpaid count (`unpaidOrdersCount > 0`), proving old logic missed real unpaid tables.
- `getTableOrder` runtime output now excludes paid/cancelled/completed entries by resolver contract.
- GraphQL document parsing for `graphql/files/table.graphql` now succeeds.

---

## 4) Remaining Recommended Next Steps

1. Integrate `MiniMap` into active floor view and feed `unpaid` from `unpaidOrdersCount`.
2. Wire the zone edit icon/button to explicit modal open handler for clearer UX flow.
3. Add quick manual refresh control in overview modes and/or short polling in UNPAID mode.
4. Add explicit empty state text for UNPAID mode: "No tables with unpaid orders."
5. Add role matrix UX polish (WAITER vs MANAGER) for visible controls and disabled reasons.
6. Add subscriptions or event-driven invalidation for near-real-time table financial status.

---

## 5) Commits That Introduced the Sync

- `dd072d7` — Harden restaurant interface unpaid and role logic
- `3f13b17` — Fix invalid cancelReservation GraphQL selection

