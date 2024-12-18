import { Menu } from "@prisma/client";

// Promo and Category Types
export type PromoTypes = {
  title: string;
  img: string;
  salesQ: number;
  likesN: number;
  PercentOff: number;
  price: number;
};

export type CustomCategory = {
  desc: string;
  id: string;
  category: string;
  imageSrc: string;
};

// Modal and Sidebar State Types
export type LoginModalStore = {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
};

export type SideBarDrawerStore = {
  isSideBarOpen: boolean;
  onSideBarOpen: () => void;
  onSideBarClose: () => void;
};

// Cart Types
type CartOptions = {
  quantity: number;
  instructions: string;
  prepare: string;
};
export type CartItemType = Menu & CartOptions;

export type CartType = {
  menus: CartItemType[];
};

export type CartActionTypes = {
  addToCart: (item: CartItemType) => void;
  deleteFromcart: (id: string) => void;
  increaseCartItem: (data: CartItemType[], id: string) => void;
  decreaseCartItem: (data: CartItemType[], id: string) => void;
  resetCart: () => void;
};

// Position and Table Types
export type Position = { 
  x: number; 
  y: number; 
};

export type TableData = {
  tableNumber: number; // Unique identifier for the table
  diners: number; // Number of diners the table can accommodate
  area: string; // Zone/Area where the table is located
  reserved?: boolean; // Reservation status
  specialRequests?: string[]; // Special requests for the table
  position: Position; // Position of the table in the UI
};

// Zone Types
export type Zone = {
  name: string; // Name of the zone
  tables: TableData[]; // Direct relationship to tables in the zone
  floorPlanImage?: string; // Optional image for the zone's floor plan
};

// Unified Restaurant State Type
export type RestaurantState = {
  selectedZone: string | null; // Tracks the currently selected zone
  scale: number; // Zoom level for the UI
  scaleLimits: { min: number; max: number }; // Dynamic scale boundaries
  tableData: TableData[]; // List of all tables in the restaurant
  zones: Zone[]; // List of zones and their details

  // Actions
  setSelectedZone: (zone: string | null) => void; // Select a zone
  clearSelectedZone: () => void; // Clear the currently selected zone
  adjustScale: (delta: number) => void; // Adjust the zoom level
  moveTable: (tableNumber: number, newArea: string, newPosition: Position) => void; // Move a table to a new position
  deleteTable: (tableNumber: number) => void; // Delete a table
  getFilteredTables: (zoneName: string) => TableData[]; // Fetch tables filtered by zone
  addZone: (zoneName: string, floorPlanImage?: string) => void; // Dynamically add a new zone
  addTable: (newTable: TableData) => void; // Dynamically add a new table
  persistState: () => void; // Save the current state persistently
};

