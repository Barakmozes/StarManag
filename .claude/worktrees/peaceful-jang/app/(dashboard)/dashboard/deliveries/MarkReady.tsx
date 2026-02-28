// app/(dashboard)/dashboard/deliveries/MarkReady.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/app/components/Common/Modal";
import { useMutation } from "@urql/next";
import { MARK_DELIVERY_READY } from "./deliveries.gql";
import { useDeliveriesToast } from "./DeliveriesToast";
import { getGqlErrorMessage } from "./utils";

export default function MarkReady({
  orderNumber,
  onDone,
}: {
  orderNumber: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const toast = useDeliveriesToast();

  const [isOpen, setIsOpen] = useState(false);
  const [{ fetching }, markReady] = useMutation(MARK_DELIVERY_READY);

  const closeModal = () => setIsOpen(false);

  async function onConfirm() {
    const res = await markReady({ orderNumber });
    if (res.error) {
      toast.error(getGqlErrorMessage(res.error));
      return;
    }

    toast.success("Order moved to UNASSIGNED");
    closeModal();
    onDone();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-full text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition"
        onClick={() => setIsOpen(true)}
      >
        Ready
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal} title="Mark order as ready?">
        {/* Mobile-safe modal body wrapper */}
        <div className="w-[min(100vw-2rem,28rem)] max-w-full mx-auto max-h-[90vh] overflow-y-auto overscroll-contain p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] space-y-4">
          <p className="text-sm text-slate-600">
            This will move the order from <b>PREPARING</b> to <b>UNASSIGNED</b>.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
            <button
              type="button"
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition disabled:opacity-60"
              onClick={closeModal}
              disabled={fetching}
            >
              Cancel
            </button>

            <button
              type="button"
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-60"
              onClick={onConfirm}
              disabled={fetching}
            >
              {fetching ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
