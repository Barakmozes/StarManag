import {
  CartActionTypes,
  CartType,
  LoginModalStore,
  SideBarDrawerStore,
} from "@/types";
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// Sidebar & Login Modal logic (unchanged)
export const useSideBarDrawer = create<SideBarDrawerStore>()((set) => ({
  isSideBarOpen: false,
  onSideBarOpen: () => set({ isSideBarOpen: true }),
  onSideBarClose: () => set({ isSideBarOpen: false }),
}));

export const useLoginModal = create<LoginModalStore>()((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
}));

/** -------------------- sellingPrice helpers -------------------- */

function normalizeCartItem(item: any) {
  const base =
    typeof item?.basePrice === "number" && Number.isFinite(item.basePrice)
      ? item.basePrice
      : typeof item?.price === "number" && Number.isFinite(item.price)
        ? item.price
        : 0;

  const selling =
    typeof item?.sellingPrice === "number" && Number.isFinite(item.sellingPrice)
      ? item.sellingPrice
      : null;

  const hasValidDiscount =
    selling !== null && selling > 0 && selling < base;

  const effectivePrice = hasValidDiscount ? (selling as number) : base;

  return {
    ...item,
    basePrice: base,
    sellingPrice: selling,
    // ✅ for all calculations in the app (subtotal/order/etc.)
    price: effectivePrice,
  };
}

// Extend INITIAL_STATE with 'tableId' and 'tableNumber'
const INITIAL_STATE = {
  menus: [],
  tableId: undefined as string | undefined,
  tableNumber: undefined as number | undefined,
};

export const useCartStore = create<CartType & CartActionTypes>()(
  devtools(
    persist(
      (set, get) => ({
        // ----- State -----
        menus: INITIAL_STATE.menus,
        tableId: INITIAL_STATE.tableId,
        tableNumber: INITIAL_STATE.tableNumber,

        // ----- Actions -----
        addToCart(item: any) {
          const { menus } = get();
          const normalized = normalizeCartItem(item);
          set({ menus: [...menus, normalized] });
        },

        deleteFromcart(itemId: string) {
          const { menus } = get();
          const updatedMenus = menus.filter((menu: any) => menu.id !== itemId);
          set({ menus: updatedMenus });
        },

        increaseCartItem(data: any[], id: string) {
          const newData = [...data];
          newData.forEach((item: any) => {
            if (item.id === id) item.quantity += 1;
          });
          set({ menus: newData });
        },

        decreaseCartItem(data: any[], id: string) {
          const newData = [...data];
          newData.forEach((item: any) => {
            if (item.id === id) item.quantity -= 1;
          });
          set({ menus: newData });
        },

        // ✅ keeps old persisted carts compatible (adds basePrice/uses sellingPrice)
        syncCartPrices() {
          const { menus } = get();
          set({ menus: (menus as any[]).map(normalizeCartItem) });
        },

        resetCart() {
          set(INITIAL_STATE);
        },

        setTableId(tableId: string) {
          set({ tableId });
        },

        setTableNumber(tableNumber: number) {
          set({ tableNumber });
        },

        clearTableId() {
          set({ tableId: undefined });
        },

        clearTableNumber() {
          set({ tableNumber: undefined });
        },

        startOrderForTable(tableId: string, tableNumber: number) {
          set({
            menus: [],
            tableId,
            tableNumber,
          });
        },
      }),
      {
        name: "You&i_cart",
        skipHydration: true,
        // ✅ after hydration, normalize any legacy items
        onRehydrateStorage: () => (state) => {
          state?.syncCartPrices?.();
        },
      }
    )
  )
);
