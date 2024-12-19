import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { TableData, Zone, Position, RestaurantState } from "@/types";

// Service Functions for Reusability
const filterTablesByZone = (tableData: TableData[], zoneName: string) =>
  tableData.filter((table) => table.area === zoneName);

const updateTablePosition = (
  tableData: TableData[],
  tableNumber: number,
  newArea: string,
  newPosition: Position
) =>
  tableData.map((table) =>
    table.tableNumber === tableNumber
      ? { ...table, area: newArea, position: newPosition }
      : table
  );

// Initial State
const initialTableData: TableData[] = [
  {
    tableNumber: 1,
    diners: 4,
    area: "Patio",
    reserved: false,
    position: { x: 0, y: 0 },
    specialRequests: [],
  },
  {
    tableNumber: 2,
    diners: 6,
    area: "Main Hall",
    reserved: true,
    position: { x: 200, y: 100 },
    specialRequests: [],
  },
];

const initialZones: Zone[] = [
  { name: "Patio", tables: [], floorPlanImage: "/img/pexels-pixabay-235985.jpg" },
  { name: "Main Hall", tables: [], floorPlanImage: "/img/pexels-pixabay-235985.jpg" },
];

// Unified Zustand Store
export const useRestaurantStore = create<RestaurantState>()(
  persist(
    devtools((set, get) => ({
      selectedZone: null, // Zone selection
      scale: 1, // Zoom level
      scaleLimits: { min: 0.5, max: 2 }, // Dynamic scale boundaries
      tableData: initialTableData, // Table data
      zones: initialZones, // Zones information

      // Set the selected zone with validation
      setSelectedZone: (zone) =>
        set((state) => {
          const isValidZone = state.zones.some((z) => z.name === zone);
          return isValidZone ? { selectedZone: zone } : state;
        }),

      // Clear the selected zone
      clearSelectedZone: () => set({ selectedZone: null }),

      // Adjust the scale (zoom in/out) with dynamic boundaries
      adjustScale: (delta) =>
        set((state) => ({
          scale: Math.max(
            state.scaleLimits?.min,
            Math.min(state.scaleLimits?.max, state.scale + delta)
          ),
        })),

      // Move table to a new position and/or area
      moveTable: (tableNumber, newArea, newPosition) =>
        set((state) => ({
          tableData: updateTablePosition(
            state.tableData,
            tableNumber,
            newArea,
            newPosition
          ),
        })),

      // Get tables filtered by the selected zone
      getFilteredTables: (zoneName) => {
        const { tableData } = get();
        const isValidZone = get().zones.some((zone) => zone.name === zoneName);
        return isValidZone ? filterTablesByZone(tableData, zoneName) : [];
      },

      // Add a new zone dynamically
      addZone: (zoneName, floorPlanImage) =>
        set((state) => ({
          zones: [
            ...state.zones,
            { name: zoneName, tables: [], floorPlanImage },
          ],
        })),

      // Add a new table dynamically with validation
      addTable: (newTable) =>
        set((state) => {
          const isDuplicate = state.tableData.some(
            (table) => table.tableNumber === newTable.tableNumber
          );
          if (isDuplicate) {
            console.error("Table with the same number already exists.");
            return state;
          }
          return { tableData: [...state.tableData, newTable] };
        }),

      // Delete a table
      deleteTable: (tableNumber) =>
        set((state) => ({
          tableData: state.tableData.filter(
            (table) => table.tableNumber !== tableNumber
          ),
        })),

      // Persist zone and table arrangements
      persistState: () => {
        try {
          const { tableData, zones, selectedZone } = get();
          localStorage.setItem(
            "restaurantState",
            JSON.stringify({ tableData, zones, selectedZone })
          );
        } catch (error) {
          console.error("Failed to persist restaurant state:", error);
        }
      },
    })),
    {
      name: "restaurant-store", // Name for Zustand persist
      skipHydration: true,
    }
  )
);
