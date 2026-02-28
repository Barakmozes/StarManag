import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { BasicArea } from "@/graphql/generated";

export type Position = { x: number; y: number };

export interface TableInStore {
  id: string;
  tableNumber: number;
  areaId: string;
  diners: number;
  reserved: boolean;
  specialRequests: string[];
  position: Position;
  createdAt: any;
  updatedAt: any;
  dirty?: boolean;

  // Future-ready (optional enhancements)
  unpaidOrdersCount?: number;
  hasReservationToday?: boolean;
}

type AreaStore = {
  // Areas
  selectedArea: BasicArea | null;
  areas: BasicArea[];
  setAreas: (fetchedAreas: BasicArea[]) => void;
  setSelectedArea: (areaIdOrName: string) => void;
  clearSelectedArea: () => void;

  // Zoom / scale
  scale: number;
  scaleLimits: { min: number; max: number };
  setScale: (newScale: number) => void;
  adjustScale: (delta: number) => void;
  resetScale: () => void;

  // Tables (local)
  tables: TableInStore[];
  setTables: (fetchedTables: TableInStore[]) => void;

  moveTable: (tableId: string, newAreaId: string, newPosition: Position) => void;

  // Used by ToggleReservation for instant UI
  setTableReserved: (tableId: string, reserved: boolean) => void;

  // After save layout
  markTablesClean: (tableIds?: string[]) => void;

  // Legacy/manual persistence (kept for compatibility)
  persistAreaState: () => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * IMPORTANT: setTables uses a merge strategy:
 * - If a table is "dirty" locally (layout changed but not saved),
 *   we keep its local position/areaId while still refreshing server fields like
 *   reserved/specialRequests/diners.
 * This prevents refetches (e.g. ToggleReservation) from wiping unsaved layout edits.
 */
export const useRestaurantStore = create<AreaStore>()(
  persist(
    devtools((set, get) => ({
      // --- init ---
      selectedArea: null,
      areas: [],
      scale: 1,
      scaleLimits: { min: 0.5, max: 2 },
      tables: [],

      // --- actions ---
      setAreas: (fetchedAreas) => set({ areas: fetchedAreas }),

      setSelectedArea: (areaIdOrName) => {
        const { areas } = get();
        const found = areas.find((a) => a.id === areaIdOrName || a.name === areaIdOrName);
        if (!found) {
          console.warn(`Area "${areaIdOrName}" not found in store.areas`);
          return;
        }
        set({
          selectedArea: {
            id: found.id,
            name: found.name,
            floorPlanImage: found.floorPlanImage ?? null,
            createdAt: found.createdAt,
          },
        });
      },

      clearSelectedArea: () => set({ selectedArea: null }),

      setScale: (newScale) => {
        const { scaleLimits } = get();
        set({ scale: clamp(newScale, scaleLimits.min, scaleLimits.max) });
      },

      adjustScale: (delta) => {
        const { scale, setScale } = get();
        setScale(scale + delta);
      },

      resetScale: () => set({ scale: 1 }),

      setTables: (fetchedTables) => {
        set((state) => {
          const localById = new Map(state.tables.map((t) => [t.id, t]));

          const merged = fetchedTables.map((serverT) => {
            const local = localById.get(serverT.id);

            // Keep local layout if dirty
            if (local?.dirty) {
              return {
                ...serverT,
                areaId: local.areaId,
                position: local.position,
                dirty: true,
              };
            }

            return {
              ...serverT,
              dirty: false,
            };
          });

          return { tables: merged };
        });
      },

      moveTable: (tableId, newAreaId, newPosition) => {
        set((state) => ({
          tables: state.tables.map((t) => {
            if (t.id !== tableId) return t;

            const positionChanged = t.position.x !== newPosition.x || t.position.y !== newPosition.y;
            const areaChanged = t.areaId !== newAreaId;

            if (!positionChanged && !areaChanged) return t;

            return {
              ...t,
              areaId: newAreaId,
              position: newPosition,
              dirty: true,
            };
          }),
        }));
      },

      setTableReserved: (tableId, reserved) => {
        set((state) => ({
          tables: state.tables.map((t) => (t.id === tableId ? { ...t, reserved } : t)),
        }));
      },

      markTablesClean: (tableIds) => {
        set((state) => ({
          tables: state.tables.map((t) => {
            if (!t.dirty) return t;
            if (!tableIds) return { ...t, dirty: false };
            return tableIds.includes(t.id) ? { ...t, dirty: false } : t;
          }),
        }));
      },

      persistAreaState: () => {
        try {
          const { areas, selectedArea, scale } = get();
          localStorage.setItem("restaurantAreaState", JSON.stringify({ areas, selectedArea, scale }));
        } catch (error) {
          console.error("Failed to persist area state:", error);
        }
      },
    })),
    {
      name: "restaurant-areas",
      skipHydration: true,
    }
  )
);
