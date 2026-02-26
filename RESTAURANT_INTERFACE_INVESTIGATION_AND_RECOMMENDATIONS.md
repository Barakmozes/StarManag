# Restaurant Interface — Investigation Report & Recommendations

**Date:** February 26, 2025  
**Scope:** StarManag Restaurant Interface (ZoneRestaurant) — logical errors, reliability, and professional upgrades

---

## 1. Executive Summary

This report documents findings from investigating the restaurant floor management interface, including a **critical logical error** in the UNPAID filter, data flow gaps, and recommendations for professional-grade improvements.

### Key Findings

| Severity | Issue | Status |
|----------|-------|--------|
| **Critical** | UNPAID filter showed all reserved tables instead of tables with unpaid orders | ✅ Fixed |
| **High** | `unpaidOrdersCount` was not fetched or stored | ✅ Fixed |
| **Medium** | MiniMap component exists but is not rendered | Documented |
| **Low** | Various UX and feature enhancements | Recommendations below |

---

## 2. Critical Bug: UNPAID Filter Logic (FIXED)

### Problem

The "Unpaid" overview mode filter was **incorrectly** built on `t.reserved` (occupied/reserved status) instead of `unpaidOrdersCount` (tables with unpaid orders).

**Original logic (zone_restaurant.tsx):**
```javascript
overviewMode === "UNPAID"
  ? group.filter((t) => t.reserved)  // WRONG: Shows ALL occupied tables
  : group;
```

**Impact:**
- Clicking "Unpaid" showed **all occupied/reserved tables**, not just those with unpaid orders
- A table could be reserved (occupied) but have no orders — it would still appear in "Unpaid"
- A table could be available but have an orphaned unpaid order — it would **not** appear in "Unpaid"
- The filter was unreliable and misleading for staff trying to collect payments

### Fix Applied

1. **GraphQL**: Added `unpaidOrdersCount` to `GetTables` query (`graphql/files/table.graphql`)
2. **Store hydration**: Included `unpaidOrdersCount` when mapping API response to `TableInStore` in `zone_restaurant.tsx`
3. **Filter logic**: Changed UNPAID filter to `(t.unpaidOrdersCount ?? 0) > 0`

**Correct logic:**
```javascript
overviewMode === "UNPAID"
  ? group.filter((t) => (t.unpaidOrdersCount ?? 0) > 0)  // Tables with unpaid orders only
  : group;
```

### Backend Definition (Reference)

The `unpaidOrdersCount` resolver in `graphql/schema/Table/queries.ts` correctly counts:
- Orders where `tableId = table.id`
- `paid = false`
- `status != CANCELLED`

---

## 3. Data Flow & Reliability

### 3.1 Store Merge Strategy

The `useRestaurantStore.setTables()` merge strategy correctly preserves:
- **Dirty tables**: Local position/areaId when layout is unsaved
- **Server fields**: `reserved`, `specialRequests`, `diners`, and now `unpaidOrdersCount` on refetch

This prevents ToggleReservation or other mutations from overwriting unsaved layout edits.

### 3.2 Stale Data Risk

- **Tables** are refetched after `updateManyTables` and `toggleTableReservation`
- **unpaidOrdersCount** is computed server-side per table; it updates on each `getTables` refetch
- **Recommendation**: Consider polling or subscriptions for real-time unpaid order updates during busy hours (future enhancement)

---

## 4. MiniMap Component — Not Rendered

The `MiniMap.tsx` component exists and supports:
- Color-coded dots: 🟢 available, 🔴 reserved, 🟡 unpaid, ⚪ locked
- Viewport rectangle for navigation
- Tap/drag to navigate

**Current state:** MiniMap is **not imported or rendered** anywhere in the app. The AGENTS_Restaurant_interface.md documents it as part of the component tree, but it is unused.

**Recommendation:** Integrate MiniMap into `TablesSection` or `zone_restaurant` for large floor plans to improve navigation. Ensure tables passed to MiniMap include `unpaid: (t.unpaidOrdersCount ?? 0) > 0`.

---

## 5. Action Plan Recommendations

### 5.1 Immediate (Done)

- [x] Fix UNPAID filter to use `unpaidOrdersCount`
- [x] Add `unpaidOrdersCount` to GetTables query and store hydration
- [x] Regenerate GraphQL types (or update manually if codegen requires server)

### 5.2 Short-Term

1. **Integrate MiniMap** — Add MiniMap to the floor plan view for zones with many tables
2. **Edit Zone button** — The "Edit Zone" button (HiViewBoards icon) in the toolbar has no `onClick` handler; wire it to open `EditZoneModal`
3. **Real-time refresh** — Add a manual "Refresh" button or short-interval polling when in UNPAID/AVAILABLE overview modes
4. **Empty state for UNPAID** — When UNPAID filter returns no tables, show a clear message: "No tables with unpaid orders"

### 5.3 Medium-Term

1. **Keyboard shortcuts** — E.g., `E` for edit mode, `S` for save, `Esc` to close modals
2. **Table search** — Search/filter tables by number within the current view
3. **Bulk actions** — Select multiple tables for bulk reserve/release or area move
4. **Audit log** — Log table status changes (reserve/release, layout edits) for accountability

### 5.4 Long-Term

1. **WebSocket / subscriptions** — Real-time table and order updates without polling
2. **Role-based permissions** — Different capabilities for WAITER vs MANAGER (e.g., layout edit only for MANAGER)
3. **Analytics** — Table turnover, average time per table, peak occupancy by zone
4. **Print/export** — Export floor plan or table list for printing

---

## 6. Interface Improvements for Professional Use

### 6.1 UX Enhancements

| Area | Current | Recommendation |
|------|---------|----------------|
| **Table status clarity** | Green/red dots, Hebrew labels | Add tooltip on hover with "Available" / "Reserved" / "X unpaid orders" |
| **Overview mode feedback** | Filter buttons | Show count badge on Unpaid/Available buttons (e.g., "Unpaid (3)") |
| **Mobile** | Table cards in overview | Consider swipe actions (reserve, start order) on cards |
| **Loading states** | Generic pulse | Skeleton loaders for table cards and floor plan |
| **Error recovery** | Toast on error | Retry button in error banner |

### 6.2 Accessibility

- Ensure all icon-only buttons have `aria-label`
- Support keyboard navigation in AreaSelector and table grid
- Ensure sufficient color contrast for status indicators (WCAG AA)

### 6.3 Performance

- **Virtualization** — If a zone has 100+ tables, consider virtualizing the table list in overview mode
- **Image optimization** — Floor plan images: use Next.js `Image` or ensure proper sizing to avoid large payloads
- **Debounce** — Area search input should debounce to avoid excessive re-renders

---

## 7. Additional Features for Maximum Efficiency

1. **Quick payment link** — From table modal, one-click "Request payment" that deep-links to PayPlus or shows QR for customer
2. **Table merge** — Combine two tables (e.g., for large groups) with a single action
3. **Waitlist integration** — From waitlist, assign party to table with one click; auto-reserve and update waitlist status
4. **Order summary in modal** — Show itemized order (from `getTableOrder`) directly in TableModal for quick reference
5. **Time-based alerts** — Highlight tables that have been occupied for >2 hours or have unpaid orders >1 hour
6. **Multi-restaurant** — If the platform supports multiple restaurants, zone/table scoping per restaurant

---

## 8. Testing Checklist

After applying fixes, verify:

- [ ] Switch role to MANAGER → sign out → sign in → ZoneRestaurant renders
- [ ] Click "Unpaid" filter → only tables with `unpaidOrdersCount > 0` appear
- [ ] Click "Available" filter → only tables with `reserved === false` appear
- [ ] Click "All Tables" → all tables appear
- [ ] TableCard shows unpaid badge when `unpaidOrdersCount > 0`
- [ ] Create an order for a table (without paying) → refetch tables → table appears in Unpaid filter
- [ ] Pay for order → refetch → table no longer in Unpaid filter (after backend marks `paid: true`)

---

## 9. Files Modified

| File | Change |
|------|--------|
| `graphql/files/table.graphql` | Added `unpaidOrdersCount` to GetTables query (removed erroneous `+` prefix) |
| `graphql/generated.ts` | Added `unpaidOrdersCount` to GetTablesDocument and GetTablesQuery type |
| `app/components/Restaurant_interface/zone_restaurant.tsx` | Fixed UNPAID filter logic; added `unpaidOrdersCount` to store hydration |

---

*Report generated from codebase analysis and AGENTS.md / AGENTS_Restaurant_interface.md context.*
