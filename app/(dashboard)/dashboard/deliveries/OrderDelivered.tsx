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
        className="px-3 py-1 rounded-full text-sm bg-green-600 text-white"
        onClick={() => setIsOpen(true)}
      >
        View Delivery
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal} title="Order Delivered">
        <div className="my-4">
          <h3 className="p-3">Delivery Details</h3>

          <ol className="relative border-l border-slate-200">
            <li className="mb-10 ml-6">
              <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3">
                <HiLocationMarker />
              </div>

              <h5 className="">Order</h5>
              <p className="mb-1 text-sm font-normal leading-none">
                #{order.orderNumber} • {order.deliveryTime ? formatDateTime(order.deliveryTime) : ""}
              </p>
            </li>

            <li className="mb-10 ml-6">
              <div className="absolute flex items-center justify-center w-6 h-6 bg-red-100 rounded-full -left-3">
                <span className="w-4 h-4 bg-red-300 rounded-full"></span>
              </div>

              <h5 className="">Driver</h5>
              {order.delivery ? (
                <div className="flex items-center justify-between bg-blue-100 p-2 rounded-md">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{order.delivery.driverName}</span>
                    <span className="text-xs">{order.delivery.driverEmail}</span>
                    <a href={`tel:${order.delivery.driverPhone}`} className="text-xs underline">
                      {order.delivery.driverPhone}
                    </a>
                  </div>

                  <a
                    href={`tel:${order.delivery.driverPhone}`}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-white cursor-pointer"
                  >
                    <HiPhone size={22} />
                  </a>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No delivery record</p>
              )}
            </li>

            <li className="mb-10 ml-6">
              <div className="absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3">
                <HiCheck />
              </div>

              <h5 className="">Delivered To</h5>
              <div className="flex items-center justify-between bg-green-100 text-green-900 p-2 rounded-md">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{order.userName}</span>
                  <a href={`tel:${order.userPhone}`} className="text-xs underline">
                    {order.userPhone}
                  </a>
                  <p className="text-xs">{order.deliveryAddress}</p>
                </div>

                <a
                  href={`tel:${order.userPhone}`}
                  className="flex items-center justify-center w-8 h-8 rounded-md bg-white cursor-pointer"
                >
                  <HiPhone size={22} />
                </a>
              </div>
            </li>
          </ol>
        </div>
      </Modal>
    </>
  );
}
