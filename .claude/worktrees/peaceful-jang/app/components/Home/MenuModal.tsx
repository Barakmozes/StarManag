"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Disclosure } from "@headlessui/react";
import { HiChevronDown } from "react-icons/hi2";
import type { Menu, User } from "@prisma/client";
import toast from "react-hot-toast";

import MenuCard from "./MenuCard";
import Modal from "../Common/Modal";
import FavoritesBtn from "../Common/FavoritesBtn";
import { useCartStore, useLoginModal } from "@/lib/store";

type Props = {
  menu: Menu;
  user: User;
};

function money(n: number) {
  // Keep your existing "$" style
  const fixed = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return `$ ${fixed}`;
}

function hasValidDiscount(price: number, sellingPrice?: number | null) {
  return typeof sellingPrice === "number" && sellingPrice > 0 && sellingPrice < price;
}

function percentOff(price: number, sellingPrice: number) {
  return Math.round(((price - sellingPrice) / price) * 100);
}

const MenuModal = ({ menu, user }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prepare, setPrepare] = useState("");
  const [instructions, setInstructions] = useState("");

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const { addToCart } = useCartStore();
  const { onOpen } = useLoginModal();

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  const discount = useMemo(() => {
    const basePrice = Number(menu.price ?? 0);
    const selling = menu.sellingPrice;

    const ok = hasValidDiscount(basePrice, selling);
    const effective = ok ? (selling as number) : basePrice;

    return {
      has: ok,
      base: basePrice,
      effective,
      pct: ok ? percentOff(basePrice, selling as number) : null,
    };
  }, [menu.price, menu.sellingPrice]);

  const MenuToAdd = { ...menu, quantity: 1, prepare, instructions };

  const PutItemsIntoCart = () => {
    if (!user) {
      toast.error("OOps, login first", { duration: 5000 });
      closeModal();
      onOpen();
    } else {
      addToCart(MenuToAdd);
      toast.success("Menu Added to Cart", { duration: 4000 });
      setTimeout(closeModal, 2000);
    }
  };

  return (
    <>
      <MenuCard menu={menu} openModal={openModal} />

      <Modal isOpen={isOpen} closeModal={closeModal}>
        {/* Mobile-safe modal layout: fixed max height + internal scrolling + sticky footer */}
        <div className="flex max-h-[90vh] flex-col overflow-hidden">
          {/* Header image */}
          <div className="relative">
            <Image
              src={menu.image}
              width={720}
              height={420}
              alt="menu-img"
              sizes="(max-width: 640px) 100vw, 640px"
              className="h-48 w-full object-cover rounded-t-lg sm:h-56"
            />

            {/* Favorites: avoid negative positioning that can cause overflow */}
            <div className="absolute top-3 left-3">
              <div className="h-11 w-11 rounded-full bg-white/90 shadow flex items-center justify-center">
                <FavoritesBtn menuId={menu.id} user={user} />
              </div>
            </div>

            {/* Discount badge */}
            {discount.has && (
              <div className="absolute top-3 right-3 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                {discount.pct}% OFF
              </div>
            )}
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {menu.longDescr ? (
              <p className="text-sm text-gray-500 break-words">{menu.longDescr}</p>
            ) : null}

            {menu.prepType && (
              <Disclosure as="div">
                {({ open }) => (
                  <>
                    <Disclosure.Button className="flex w-full min-h-11 items-center justify-between rounded-lg bg-gray-100 px-4 py-2 text-left text-sm font-medium text-green-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
                      <span>Preparation</span>
                      <HiChevronDown
                        className={`${open ? "rotate-180 transform" : ""} h-5 w-5 text-green-500`}
                      />
                    </Disclosure.Button>

                    <Disclosure.Panel className="px-4 pt-3 pb-2">
                      <div className="space-y-1">
                        {menu.prepType?.map((prep, index) => (
                          <label
                            key={index}
                            className="flex items-center gap-3 py-2 rounded-md hover:bg-slate-50"
                          >
                            <input
                              checked={prepare === prep}
                              onChange={() => setPrepare(prep)}
                              className="shrink-0 w-6 h-6 text-green-600 bg-gray-100 rounded border-green-500 focus:ring-green-500 focus:ring-2"
                              type="checkbox"
                            />
                            <span className="text-sm text-gray-700">{prep}</span>
                          </label>
                        ))}
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            )}

            <div>
              <p className="text-center mb-2 text-sm font-medium text-gray-700">
                Special Instructions
              </p>
              <textarea
                rows={3}
                className="w-full rounded bg-green-50 border border-green-500 px-3 py-2 text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                onChange={(e) => setInstructions(e.target.value)}
                value={instructions}
                placeholder="Any allergies, preferences, etc."
              />
            </div>
          </div>

          {/* Sticky footer: price + primary action always reachable */}
          <div className="border-t bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {discount.has ? (
                <>
                  <span className="font-semibold text-green-700">{money(discount.effective)}</span>
                  <span className="text-sm text-gray-400 line-through">{money(discount.base)}</span>
                  <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                    Discount
                  </span>
                </>
              ) : (
                <span className="font-semibold text-gray-700">{money(discount.base)}</span>
              )}
            </div>

            <button className="form-button mt-3 w-full min-h-11" onClick={PutItemsIntoCart}>
              <span className="inline-flex items-center justify-center gap-2">
                <span>Add to Cart :</span>
                {discount.has ? (
                  <>
                    <span className="font-semibold">{money(discount.effective)}</span>
                    <span className="text-sm opacity-70 line-through">{money(discount.base)}</span>
                  </>
                ) : (
                  <span className="font-semibold">{money(discount.base)}</span>
                )}
              </span>
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default MenuModal;
