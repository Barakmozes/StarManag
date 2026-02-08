import { useEffect, useMemo, useState } from "react";
import MenuCard from "./MenuCard";
import Modal from "../Common/Modal";
import Image from "next/image";
import FavoritesBtn from "../Common/FavoritesBtn";
import { Disclosure } from "@headlessui/react";
import { HiChevronDown } from "react-icons/hi2";
import { Menu, User } from "@prisma/client";
import { useCartStore, useLoginModal } from "@/lib/store";
import toast from "react-hot-toast";

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
  return (
    typeof sellingPrice === "number" &&
    sellingPrice > 0 &&
    sellingPrice < price
  );
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
        <div className="relative">
          <Image
            src={menu.image}
            width={360}
            height={200}
            alt="menu-img"
            className="h-56 w-full object-cover rounded-t-lg"
          />
          <div className="absolute -top-[10px] -left-[15px] w-12 h-12 rounded-full bg-white">
            <FavoritesBtn menuId={menu.id} user={user} />
          </div>

          {/* ✅ subtle discount badge on image (optional but nice) */}
          {discount.has && (
            <div className="absolute top-3 right-3 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
              {discount.pct}% OFF
            </div>
          )}
        </div>

        <div className="mt-2">
          <p className="text-sm text-gray-500">{menu.longDescr}</p>
        </div>

        {menu.prepType && (
          <Disclosure as="div" className="mt-2">
            {({ open }) => (
              <>
                <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-100 px-4 py-2 text-left text-sm font-medium text-green-900  focus:outline-none ">
                  <span> Preparation</span>
                  <HiChevronDown
                    className={`${open ? "rotate-180 transform" : ""} h-5 w-5  text-green-500`}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="px-4 pt-4 pb-2 ">
                  {menu.prepType?.map((prep, index) => (
                    <div key={index} className="flex my-2">
                      <input
                        checked={prepare === prep}
                        onChange={() => setPrepare(prep)}
                        className="w-6 h-6 text-green-600 bg-gray-100 rounded border-green-500 focus:ring-green-500  focus:ring-2 "
                        type="checkbox"
                      />
                      <span className="ml-3">{prep}</span>
                    </div>
                  ))}
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        )}

        <div className="mt-4">
          <p className="text-center mb-3">Special Instructions</p>
          <input
            type="text"
            className="w-full h-16 rounded bg-green-50 border border-green-500 focus:outline-none focus-visible:ring-green-500"
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        {/* ✅ price display area (subtle) */}
        <div className="mt-4 flex items-center justify-center gap-2">
          {discount.has ? (
            <>
              <span className="font-semibold text-green-700">
                {money(discount.effective)}
              </span>
              <span className="text-sm text-gray-400 line-through">
                {money(discount.base)}
              </span>
              <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">
                Discount
              </span>
            </>
          ) : (
            <span className="font-semibold text-gray-700">{money(discount.base)}</span>
          )}
        </div>

        <div className="mt-4">
          <button className="form-button" onClick={PutItemsIntoCart}>
            <span className="inline-flex items-center justify-center gap-2">
              <span>Add to Cart :</span>
              {discount.has ? (
                <>
                  <span className="font-semibold">{money(discount.effective)}</span>
                  <span className="text-sm opacity-70 line-through">
                    {money(discount.base)}
                  </span>
                </>
              ) : (
                <span className="font-semibold">{money(discount.base)}</span>
              )}
            </span>
          </button>
        </div>
      </Modal>
    </>
  );
};

export default MenuModal;
