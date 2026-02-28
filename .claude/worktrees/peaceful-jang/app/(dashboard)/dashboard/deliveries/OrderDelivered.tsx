// app/(dashboard)/dashboard/deliveries/OrderDelivered.tsx
"use client";

import React, { useState } from "react";
import { HiCheck, HiLocationMarker, HiPhone } from "react-icons/hi";
import Modal from "@/app/components/Common/Modal";
import { formatDateTime } from "./utils";

type DeliveryInfo = {
  driverName: string;
  driverEmail: string;
  driverPhone: string;
};

type OrderRow = {
  orderNumber: string;
  deliveryAddress: string;
  userName: string;
  userPhone: string;
  deliveryTime?: any | null;
  delivery?: DeliveryInfo | null;
};

export default function OrderDelivered({ order }: { order: OrderRow }) {
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-full text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition"
        onClick={() => setIsOpen(true)}
      >
        View Delivery
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal} title="Order Delivered">
        {/* Mobile-safe modal body wrapper */}
        <div className="w-[min(100vw-2rem,42rem)] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-semibold text-slate-800">
              Delivery Details
            </h3>

            <ol className="relative mt-3 border-l border-slate-200">
              <li className="mb-8 ml-6">
                <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3">
                  <HiLocationMarker aria-hidden="true" />
                </div>

                <h5 className="text-sm font-semibold text-slate-800">Order</h5>
                <p className="mt-1 text-sm font-normal leading-none text-slate-600 break-words">
                  #{order.orderNumber}{" "}
                  {order.deliveryTime ? `• ${formatDateTime(order.deliveryTime)}` : ""}
                </p>
              </li>

              <li className="mb-8 ml-6">
                <div className="absolute flex items-center justify-center w-6 h-6 bg-red-100 rounded-full -left-3">
                  <span className="w-4 h-4 bg-red-300 rounded-full"></span>
                </div>

                <h5 className="text-sm font-semibold text-slate-800">Driver</h5>
                {order.delivery ? (
                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-100 p-3 rounded-md">
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-slate-800 break-words">
                        {order.delivery.driverName}
                      </span>
                      <div className="text-xs text-slate-700 break-all">
                        {order.delivery.driverEmail}
                      </div>
                      <a
                        href={`tel:${order.delivery.driverPhone}`}
                        className="text-xs underline break-all"
                      >
                        {order.delivery.driverPhone}
                      </a>
                    </div>

                    <a
                      href={`tel:${order.delivery.driverPhone}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white cursor-pointer shadow-sm hover:bg-slate-50 transition self-start sm:self-auto"
                      aria-label="Call driver"
                    >
                      <HiPhone size={22} aria-hidden="true" />
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-slate-600">No delivery record</p>
                )}
              </li>

              <li className="mb-2 ml-6">
                <div className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3">
                  <HiCheck aria-hidden="true" />
                </div>

                <h5 className="text-sm font-semibold text-green-950">Delivered To</h5>
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-green-100 text-green-900 p-3 rounded-md">
                  <div className="min-w-0 flex flex-col gap-1">
                    <span className="text-sm font-medium break-words">
                      {order.userName}
                    </span>
                    <a
                      href={`tel:${order.userPhone}`}
                      className="text-xs underline break-all"
                    >
                      {order.userPhone}
                    </a>
                    <p className="text-xs break-words">{order.deliveryAddress}</p>
                  </div>

                  <a
                    href={`tel:${order.userPhone}`}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white cursor-pointer shadow-sm hover:bg-slate-50 transition self-start sm:self-auto"
                    aria-label="Call customer"
                  >
                    <HiPhone size={22} aria-hidden="true" />
                  </a>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </Modal>
    </>
  );
}
