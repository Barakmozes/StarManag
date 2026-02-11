"use client";

import { useState } from "react";
import Image from "next/image";
import { HiOutlineEye } from "react-icons/hi2";
import Modal from "@/app/components/Common/Modal";

type MenuLike = {
  title: string;
  image: string;
  price: number;
  sellingPrice?: number | null;
  onPromo?: boolean;
  longDescr?: string | null;
  shortDescr: string;
  category: string;
  prepType?: string[];
};

type Props = {
  menu: MenuLike;
};

const AdminPreviewMenu = ({ menu }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center h-11 w-11 md:h-9 md:w-9 rounded-md hover:bg-slate-100 transition"
        aria-label={`Preview ${menu.title}`}
      >
        <HiOutlineEye className="h-6 w-6 text-slate-700" />
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal} title={menu.title}>
        {/* Mobile-safe modal wrapper */}
        <div className="w-[min(100vw-2rem,40rem)] max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="relative">
            <Image
              src={menu.image}
              alt={menu.title}
              width={960}
              height={540}
              className="h-48 sm:h-56 w-full object-cover rounded-t-lg"
            />
          </div>

          <div className="p-3 sm:p-4">
            <div className="my-2">
              <h3 className="font-semibold text-gray-600">Price:</h3>
              {menu.sellingPrice ? (
                <div className="flex items-center gap-2">
                  <p className="text-slate-400 line-through">${menu.price}</p>
                  <p className="text-green-600 font-semibold">${menu.sellingPrice}</p>
                </div>
              ) : (
                <p className="text-green-600 font-semibold">${menu.price}</p>
              )}
            </div>

            <div className="my-2">
              <h3 className="font-semibold text-gray-600">Long Description:</h3>
              <p className="text-sm text-gray-400 break-words">
                {menu.longDescr || "-"}
              </p>
            </div>

            <div className="my-2">
              <h3 className="font-semibold text-gray-600">Short Description:</h3>
              <p className="text-sm text-gray-400 break-words">{menu.shortDescr}</p>
            </div>

            <div className="my-4">
              <h3 className="font-semibold text-gray-600">Category:</h3>
              <p className="text-gray-500 break-words">{menu.category}</p>
            </div>

            {menu.prepType?.length ? (
              <div className="my-4">
                <h3 className="font-semibold text-gray-600">Preparation Types:</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {menu.prepType.map((p) => (
                    <span
                      key={p}
                      className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminPreviewMenu;
