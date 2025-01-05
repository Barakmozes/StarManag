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



