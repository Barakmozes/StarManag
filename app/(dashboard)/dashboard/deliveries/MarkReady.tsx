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
        className="px-3 py-1 rounded-full text-sm bg-blue-600 text-white"
        onClick={() => setIsOpen(true)}
      >
        Ready
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal} title="Mark order as ready?">
        <div className="p-2 space-y-4">
          <p className="text-sm text-slate-600">
            This will move the order from <b>PREPARING</b> to <b>UNASSIGNED</b>.
          </p>

          <div className="flex items-center justify-end gap-2">
            <button
              className="px-3 py-2 rounded-md bg-slate-200 text-slate-800"
              onClick={closeModal}
              disabled={fetching}
            >
              Cancel
            </button>

            <button
              className="px-3 py-2 rounded-md bg-blue-600 text-white"
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
