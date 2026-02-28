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
        className="inline-flex items-center justify-center h-10 w-10 sm:h-9 sm:w-9 rounded-md hover:bg-slate-100 transition-colors"
        aria-label={`Preview ${menu.title}`}
      >
        <HiOutlineEye className="h-5 w-5 sm:h-6 sm:w-6 text-slate-600 hover:text-slate-900 transition-colors" />
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal} title="Menu Preview">
        {/* Inner container with clean scrolling, avoids double scrollbars */}
        <div className="w-full max-w-2xl  sm:rounded-b-xl custom-scrollbar flex flex-col bg-white">
          
          {/* Image Header Block */}
          <div className="relative w-full h-52 sm:h-72 bg-gray-100 shrink-0 border-b border-gray-100">
            <Image
              src={menu.image}
              alt={menu.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 42rem"
              priority
            />
            {menu.onPromo && (
              <div className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                Promo Active
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-7 space-y-6">
            
            {/* Top Info: Category, Title & Price */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div className="flex-1">
                <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-md mb-2 uppercase tracking-wide">
                  {menu.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
                  {menu.title}
                </h3>
              </div>
              
              <div className="text-left sm:text-right shrink-0">
                {menu.sellingPrice ? (
                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 sm:gap-0.5">
                    <span className="text-2xl sm:text-3xl font-bold text-green-600">
                      ${menu.sellingPrice.toFixed(2)}
                    </span>
                    <span className="text-sm text-gray-400 line-through font-medium">
                      ${menu.price.toFixed(2)}
                    </span>
                  </div>
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    ${menu.price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Descriptions Section */}
            <div className="space-y-5">
              {menu.shortDescr && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Short Description
                  </h4>
                  <p className="text-gray-800 font-medium leading-relaxed text-base sm:text-lg">
                    {menu.shortDescr}
                  </p>
                </div>
              )}
              
              {menu.longDescr && (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                    Detailed Description
                  </h4>
                  <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                    {menu.longDescr}
                  </p>
                </div>
              )}
            </div>

            {/* Preparation Types */}
            {menu.prepType && menu.prepType.length > 0 && (
              <>
                <hr className="border-gray-100" />
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Available Preparations
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {menu.prepType.map((p) => (
                      <span
                        key={p}
                        className="bg-green-50 text-green-700 border border-green-200 text-sm font-medium px-3.5 py-1.5 rounded-full"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminPreviewMenu;