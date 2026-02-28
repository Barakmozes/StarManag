"use client";

import { useEffect, useState } from "react";
import { Disclosure } from "@headlessui/react";
import Image from "next/image";
import { HiChevronDown } from "react-icons/hi2";
import Modal from "@/app/components/Common/Modal";
import FavoritesBtn from "@/app/components/Common/FavoritesBtn";
import FavoriteCard from "./FavoriteCard";
import { Menu, User } from "@prisma/client";
import { useCartStore } from "@/lib/store";
import toast from "react-hot-toast";

type Props = {
  favorite: Menu;
  user: User;
};

const FavoriteModal = ({ favorite, user }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [prepare, setPrepare] = useState("");
  const [instructions, setInstructions] = useState("");

  const closeModal = () => setIsOpen(false);
  const OpenModal = () => setIsOpen(true);

  const { addToCart } = useCartStore();

  const MenuToAdd = { ...favorite, quantity: 1, prepare, instructions };

  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  const PutItemsInCart = () => {
    addToCart(MenuToAdd);
    toast.success("Menu Added to Cart", { duration: 4000 });
    setTimeout(closeModal, 2000);
  };

  return (
    <>
      <FavoriteCard favorite={favorite} OpenModal={OpenModal} />

      <Modal isOpen={isOpen} title={favorite.title} closeModal={closeModal}>
        {/* Mobile-safe modal body: constrained width + internal scrolling */}
        <div className="w-[min(100vw-2rem,28rem)] max-w-md mx-auto max-h-[90vh] overflow-y-auto overscroll-contain pb-6">
          <div className="relative">
            <Image
              src={favorite.image}
              alt={favorite.title}
              width={720}
              height={400}
              className="h-44 sm:h-56 w-full object-cover rounded-t-lg"
            />

            {/* Keep the favorites button fully inside the viewport on mobile */}
            <div className="absolute top-2 left-2 w-12 h-12 rounded-full bg-white shadow flex items-center justify-center">
              <FavoritesBtn menuId={favorite.id} user={user} />
            </div>
          </div>

          <div className="px-4 sm:px-5 pt-3">
            <p className="text-sm text-gray-500 break-words">
              {favorite.longDescr}
            </p>

            {favorite.prepType && (
              <Disclosure as="div" className="mt-4">
                {({ open }) => (
                  <>
                    <Disclosure.Button
                      className="flex w-full items-center justify-between rounded-lg bg-gray-100 px-4 py-3 min-h-[44px] text-left text-sm font-medium text-green-900 focus:outline-none"
                      aria-label="Toggle preparation options"
                    >
                      <span>Preparation</span>
                      <HiChevronDown
                        className={`${
                          open ? "rotate-180 transform" : ""
                        } h-5 w-5 text-green-500`}
                        aria-hidden="true"
                      />
                    </Disclosure.Button>

                    <Disclosure.Panel className="px-2 sm:px-4 pt-3 pb-2">
                      <div className="space-y-2">
                        {favorite.prepType?.map((prep, index) => (
                          <label
                            key={index}
                            className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              checked={prepare === prep}
                              onChange={() => setPrepare(prep)}
                              className="h-6 w-6 text-green-600 bg-gray-100 rounded border-green-500 focus:ring-green-500 focus:ring-2"
                              type="checkbox"
                            />
                            <span className="text-sm text-gray-700 break-words">
                              {prep}
                            </span>
                          </label>
                        ))}
                      </div>
                    </Disclosure.Panel>
                  </>
                )}
              </Disclosure>
            )}

            <div className="mt-4">
              <p className="text-center mb-2 text-sm font-medium text-gray-700">
                Special Instructions
              </p>

              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="w-full min-h-[96px] p-3 rounded bg-green-50 border border-green-500 focus:border-green-500 focus:outline-none focus-visible:ring-green-500 text-sm"
                placeholder="Add any notes for the kitchen..."
              />
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="form-button w-full min-h-[44px]"
                onClick={PutItemsInCart}
              >
                Add to Cart :${favorite.price}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FavoriteModal;
