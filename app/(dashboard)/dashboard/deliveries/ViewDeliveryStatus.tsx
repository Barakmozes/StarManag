// app/(dashboard)/dashboard/deliveries/ViewDeliveryStatus.tsx
"use client";

import React, { useMemo, useState } from "react";
import { HiLocationMarker, HiPhone } from "react-icons/hi";
import { HiBuildingLibrary } from "react-icons/hi2";
import Modal from "@/app/components/Common/Modal";
import AppMap from "@/app/components/Common/AppMap";
import { useMutation } from "@urql/next";
import { MARK_DELIVERY_DELIVERED, REMOVE_DRIVER_FROM_ORDER } from "./deliveries.gql";
import { useDeliveriesToast } from "./DeliveriesToast";
import { formatDateTime, getGqlErrorMessage } from "./utils";
import { OrderStatus } from "@/graphql/generated";

type DeliveryInfo = {
  id: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  orderNum: string;
};

type OrderRow = {
  orderNumber: string;
  status: OrderStatus;
  deliveryAddress: string;
  userName: string;
  userPhone: string;
  orderDate: any;
  delivery?: DeliveryInfo | null;
};

export default function ViewDeliveryStatus({
  order,
  onDone,
}: {
  order: OrderRow;
  onDone: () => void;
}) {
  const toast = useDeliveriesToast();

  const [isOpen, setIsOpen] = useState(false);
  const closeModal = () => setIsOpen(false);

  const [{ fetching: delivering }, markDelivered] = useMutation(MARK_DELIVERY_DELIVERED);
  const [{ fetching: unassigning }, unassign] = useMutation(REMOVE_DRIVER_FROM_ORDER);

  const driver = order.delivery;

  const canMarkDelivered = useMemo(() => order.status === OrderStatus.Collected, [order.status]);

  async function onMarkDelivered() {
    const res = await markDelivered({ orderNumber: order.orderNumber });
    if (res.error) {
      toast.error(getGqlErrorMessage(res.error));
      return;
    }
    toast.success("Order marked as DELIVERED");
    closeModal();
    onDone();
  }

  async function onUnassign() {
    const res = await unassign({ orderNumber: order.orderNumber });
    if (res.error) {
      toast.error(getGqlErrorMessage(res.error));
      return;
    }
    toast.info("Driver unassigned");
    closeModal();
    onDone();
  }

  return (
    <>
      <button
        className="px-3 py-1 rounded-full text-sm bg-red-600 text-white"
        onClick={() => setIsOpen(true)}
      >
        View
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal} title="Delivery Status">
        <AppMap width={400} height={200} />

        <div className="my-4">
          <h3 className="p-3">Delivery Details</h3>

          <ol className="relative border-l border-slate-200">
            <li className="mb-8 ml-6">
              <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3">
                <HiLocationMarker />
              </div>

              <h5 className="">Order</h5>
              <p className="mb-1 text-sm font-normal leading-none">
                #{order.orderNumber} • {formatDateTime(order.orderDate)}
              </p>
            </li>

            <li className="mb-8 ml-6">
              <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3">
                <span className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></span>
              </div>

              <h5 className="">Driver</h5>

              {driver ? (
                <div className="flex items-center justify-between bg-blue-100 p-2 rounded-md">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{driver.driverName}</span>
                    <span className="text-xs text-slate-700">{driver.driverEmail}</span>
                    <a href={`tel:${driver.driverPhone}`} className="text-xs underline">
                      {driver.driverPhone}
                    </a>
                  </div>

                  <a
                    href={`tel:${driver.driverPhone}`}
                    className="flex items-center justify-center w-8 h-8 rounded-md bg-white cursor-pointer"
                  >
                    <HiPhone size={22} />
                  </a>
                </div>
              ) : (
                <p className="text-sm text-slate-600">No driver assigned (data mismatch).</p>
              )}
            </li>

            <li className="mb-8 ml-6">
              <div className="absolute flex items-center justify-center w-6 h-6 bg-red-100 text-red-900 rounded-full -left-3">
                <HiBuildingLibrary />
              </div>

              <h5 className="">Delivering To</h5>
              <div className="flex items-center justify-between bg-red-100 text-red-950 p-2 rounded-md">
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

          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              className="px-3 py-2 rounded-md bg-slate-200 text-slate-800"
              onClick={closeModal}
              disabled={delivering || unassigning}
            >
              Close
            </button>

            <button
              className="px-3 py-2 rounded-md bg-slate-900 text-white"
              onClick={onUnassign}
              disabled={delivering || unassigning}
              title="Remove assigned driver and return to UNASSIGNED"
            >
              {unassigning ? "Unassigning..." : "Unassign"}
            </button>

            <button
              className={`px-3 py-2 rounded-md text-white ${
                canMarkDelivered ? "bg-green-600 hover:bg-green-700" : "bg-green-200 cursor-not-allowed"
              }`}
              onClick={onMarkDelivered}
              disabled={!canMarkDelivered || delivering || unassigning}
            >
              {delivering ? "Saving..." : "Mark Delivered"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
