"use client";

import { useMemo, useState } from "react";
import { HiOutlineEye } from "react-icons/hi2";
import Image from "next/image";
import Modal from "@/app/components/Common/Modal";
import type { Order } from "@prisma/client";

const NF_ILS = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" });
function money(n: number) {
  return NF_ILS.format(Number.isFinite(n) ? n : 0);
}

type Props = { order: Order };

function safeCart(order: Order): any[] {
  const raw: any = (order as any).cart;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function AdminOrderModal({ order }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const title = useMemo(() => `Order: ${order.orderNumber}`, [order.orderNumber]);
  const cartItems = useMemo(() => safeCart(order), [order]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
        aria-label={`View order ${order.orderNumber}`}
        title="View order"
      >
        <HiOutlineEye className="h-6 w-6 text-slate-700" />
      </button>

      <Modal isOpen={isOpen} title={title} closeModal={() => setIsOpen(false)}>
        {/* Mobile-safe: internal scroll region + safe bottom padding */}
        <div className="flex max-h-[90vh] flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <div className="mt-3 bg-slate-50 p-3 rounded-md space-y-1 text-sm">
            <p className="font-medium text-slate-800 break-words">{order.userName}</p>
            <p className="text-slate-600 break-words">{order.userEmail}</p>
            <p className="text-slate-600 break-words">{order.userPhone}</p>
            <p className="text-slate-600 break-words">{order.deliveryAddress}</p>
          </div>

          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {cartItems.map((cart: any, idx: number) => {
                const price = Number(cart?.price ?? cart?.sellingPrice ?? 0);
                const qty = Number(cart?.quantity ?? 1);
                const total = price * qty;

                return (
                  <div
                    key={cart?.id ?? `${idx}`}
                    className="flex items-start gap-3 bg-white border border-slate-100 rounded-lg p-3"
                  >
                    <div className="w-14 h-14 overflow-hidden rounded-full border border-slate-100 shrink-0">
                      <Image
                        src={cart?.image ?? "/img/food/placeholder.png"}
                        alt={cart?.title ?? "item"}
                        width={70}
                        height={70}
                        className="object-cover w-full h-full"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 break-words">
                        {cart?.title ?? "-"}
                      </div>

                      <p className="text-xs text-slate-500 mt-1 break-words">
                        Preparation:{" "}
                        <span className="italic">{cart?.prepare ?? cart?.prepType ?? "-"}</span>
                      </p>

                      <p className="text-xs text-slate-500 break-words">
                        Note: <span className="italic">{cart?.instructions ?? "-"}</span>
                      </p>

                      <div className="mt-2 text-xs text-slate-600 flex flex-wrap items-center gap-2">
                        <span>Price:</span>
                        <span className="font-semibold text-green-700">{money(price)}</span>
                        <span>×</span>
                        <span className="font-semibold">{qty}</span>
                        <span className="ml-auto font-semibold text-slate-800">{money(total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 border-t pt-3 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between gap-3">
              <span>Discount</span>
              <span className="shrink-0">-{money(Number(order.discount ?? 0))}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Service Fee</span>
              <span className="shrink-0">{money(Number(order.serviceFee ?? 0))}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span>Delivery Fee</span>
              <span className="shrink-0">{money(Number(order.deliveryFee ?? 0))}</span>
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-2 text-slate-900">
              <span className="text-base font-semibold">Total</span>
              <span className="text-base font-semibold shrink-0">
                {money(Number(order.total ?? 0))}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
