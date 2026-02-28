import Image from "next/image";
import { useState } from "react";
import { FaChevronRight } from "react-icons/fa";
import { BsFillBoxFill } from "react-icons/bs";
import Modal from "@/app/components/Common/Modal";
import { Order } from "@prisma/client";

type Props = {
  order: Order;
};

const UserDeliveredModal = ({ order }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        className="w-full min-h-[44px] flex items-center justify-between gap-3 rounded-lg bg-green-50 px-3 py-2 text-green-700 hover:bg-green-100 transition"
        onClick={openModal}
        aria-label={`View delivered order ${order.orderNumber}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <BsFillBoxFill size={20} className="shrink-0" />
          <span className="text-sm sm:text-base font-medium truncate">
            Order Delivered
          </span>
        </span>

        <FaChevronRight className="shrink-0" aria-hidden="true" />
      </button>

      <Modal
        isOpen={isOpen}
        title={"Order: " + order.orderNumber}
        closeModal={closeModal}
      >
        <div className="w-[min(100vw-2rem,42rem)] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto overscroll-contain pb-6">
          {/* Items */}
          <div className="mt-4 space-y-3">
            {order?.cart.map((cart: any) => (
              <div
                key={cart.id}
                className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="shrink-0 w-14 h-14 sm:w-16 sm:h-16 overflow-hidden rounded-full bg-gray-100">
                  <Image
                    src={cart.image}
                    alt={cart.title ?? "menu item"}
                    width={70}
                    height={70}
                    className="object-cover w-full h-full"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-sm sm:text-base text-gray-800 break-words">
                      {cart.title}
                    </span>
                    {cart.price != null && (
                      <span className="shrink-0 font-semibold text-green-600 whitespace-nowrap">
                        ${cart.price}
                      </span>
                    )}
                  </div>

                  {cart.prepare ? (
                    <p className="mt-1 text-sm text-gray-600 break-words">
                      Preparation:{" "}
                      <span className="italic text-gray-500">
                        {cart.prepare}
                      </span>
                    </p>
                  ) : null}

                  {cart.instructions ? (
                    <p className="mt-1 text-sm text-gray-600 break-words">
                      Note:{" "}
                      <span className="italic text-gray-500">
                        {cart.instructions}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-4 rounded-lg border border-gray-200 bg-white">
            <div className="flex items-center justify-between p-3 text-sm text-gray-600 border-b">
              <span>Discount</span>
              <span className="whitespace-nowrap">$- {order.discount}</span>
            </div>
            <div className="flex items-center justify-between p-3 text-sm text-gray-600 border-b">
              <span>Service Fees</span>
              <span className="whitespace-nowrap">${order.serviceFee}</span>
            </div>
            <div className="flex items-center justify-between p-3 text-sm text-gray-600 border-b">
              <span>Delivery Fee</span>
              <span className="whitespace-nowrap">${order.deliveryFee}</span>
            </div>
            <div className="flex items-center justify-between p-3 text-gray-700">
              <span className="text-base font-medium">Total</span>
              <span className="text-base font-medium whitespace-nowrap">
                ${order.total}
              </span>
            </div>
          </div>

          {/* Note / Address */}
          <div className="mt-4 p-3 bg-slate-50 rounded-md space-y-2">
            <p className="text-sm text-slate-700">
              Delivery Note:
              <span className="text-sm ml-2 text-gray-500 break-words">
                {order.note}
              </span>
            </p>
            <p className="text-sm text-slate-700">
              Delivery Address:
              <span className="text-sm ml-2 text-gray-500 break-words">
                {order.deliveryAddress}
              </span>
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UserDeliveredModal;
