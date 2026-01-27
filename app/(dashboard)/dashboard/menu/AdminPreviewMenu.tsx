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
      <HiOutlineEye onClick={openModal} className="cursor-pointer h-6 w-6 text-slate-700" />

      <Modal isOpen={isOpen} closeModal={closeModal} title={menu.title}>
        <div className="relative">
          <Image
            src={menu.image}
            alt={menu.title}
            width={360}
            height={200}
            className="h-56 w-full object-cover rounded-t-lg"
          />
        </div>

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
          <p className="text-sm text-gray-400">{menu.longDescr || "-"}</p>
        </div>

        <div className="my-2">
          <h3 className="font-semibold text-gray-600">Short Description:</h3>
          <p className="text-sm text-gray-400">{menu.shortDescr}</p>
        </div>

        <div className="my-4">
          <h3 className="font-semibold text-gray-600">Category:</h3>
          <p className="text-gray-500">{menu.category}</p>
        </div>

        {menu.prepType?.length ? (
          <div className="my-4">
            <h3 className="font-semibold text-gray-600">Preparation Types:</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {menu.prepType.map((p) => (
                <span
                  key={p}
                  className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
};

export default AdminPreviewMenu;
