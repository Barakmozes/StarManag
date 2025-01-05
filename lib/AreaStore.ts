import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { BasicArea } from "@/graphql/generated";

/**
 * Extended shape of the store:
 * 1) The currently selected area (with 'id', 'name', 'floorPlanImage?'), or null
 * 2) The array of areas from the DB
 * 3) Scale logic for zooming
 * 4) moveTable or similar method for updating a table's position (can be local or call DB)
 * 5) setSelectedArea, clearSelectedArea, etc.
 */


type AreaStore = {
  // ---------- Areas and Selection ----------
  selectedArea: BasicArea | null;
  areas: BasicArea[];

  setAreas: (fetchedAreas: BasicArea[]) => void;
  setSelectedArea: (areaIdOrName: string) => void;
  clearSelectedArea: () => void;

  // ---------- Scale Logic ----------
  scale: number;
  scaleLimits: { min: number; max: number };
  setScale: (newScale: number) => void;
  adjustScale: (delta: number) => void;

  // ---------- Table Moving Logic ----------
  /**
   * A general moveTable function. You can adapt it
   * to do a local update or call a DB mutation. 
   * Right now it's just a placeholder signature.
   */
  moveTable: (
    tableNumber: number,
    newAreaIdOrName: string,
    newPosition: { x: number; y: number }
  ) => void;

  // ---------- Persistence ----------
  persistAreaState: () => void;
};

export const useRestaurantStore = create<AreaStore>()(
  persist(
    devtools((set, get) => ({
      // ---------- State Initialization ----------
      selectedArea: null,
      areas: [],

      // Scale logic
      scale: 1,
      scaleLimits: { min: 0.5, max: 2 },

      // ---------- Actions / Methods ----------

      // 1) Overwrite the store's areas with newly fetched data
      setAreas: (fetchedAreas) => {
        set({ areas: fetchedAreas });
      },

      /**
       * 2) setSelectedArea
       * Accepts an ID or name to find a matching area in 'areas'.
       * If found, store { id, name, floorPlanImage } in 'selectedArea'
       */

      setSelectedArea: (areaIdOrName) => {
        const { areas } = get();
        // find area by ID or name
        const found = areas.find(
          (a) => a.id === areaIdOrName || a.name === areaIdOrName
        );
        if (!found) {
          console.warn(`Area "${areaIdOrName}" not found in store.areas`);
          return;
        }
        set({
          selectedArea: {
            id: found.id,
            name: found.name,
            floorPlanImage: found.floorPlanImage ?? null,
          },
        });
      },


      // 3) Clear the currently selected area
      clearSelectedArea: () => set({ selectedArea: null }),

      // 4) Directly set the scale if you want
      setScale: (newScale) => {
        const { scaleLimits } = get();
        // clamp the new scale
        const clampedScale = Math.max(
          scaleLimits.min,
          Math.min(scaleLimits.max, newScale)
        );
        set({ scale: clampedScale });
      },

      // 5) Increase/decrease scale by delta
      adjustScale: (delta) => {
        const { scale, setScale } = get();
        setScale(scale + delta);
      },

      /**
       * 6) moveTable
       * Here you can do local or server updates. 
       * For now, we just log or do a placeholder. 
       */
      moveTable: (tableNumber, newAreaIdOrName, newPosition) => {
        console.log(
          "Store moveTable() called:",
          tableNumber,
          newAreaIdOrName,
          newPosition
        );
        // Potentially call a local update or a GraphQL mutation here.
        // e.g.:
        // await mutate({
        //   variables: { tableNumber, newAreaIdOrName, position: newPosition },
        // });
      },

      // 7) Persist area selection and scale in localStorage
      persistAreaState: () => {
        try {
          const { areas, selectedArea, scale } = get();
          localStorage.setItem(
            "restaurantAreaState",
            JSON.stringify({ areas, selectedArea, scale })
          );
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