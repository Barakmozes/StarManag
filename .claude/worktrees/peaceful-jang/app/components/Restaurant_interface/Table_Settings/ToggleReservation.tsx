"use client";

import React, { useCallback } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@urql/next";
import { Table } from "@prisma/client";

import {
  ToggleTableReservationDocument,
  ToggleTableReservationMutation,
  ToggleTableReservationMutationVariables,
} from "@/graphql/generated";
import { useRestaurantStore } from "@/lib/AreaStore";

type Props = {
  table: Table;
};

/**
 * ToggleReservation
 * ----------------
 * FIXES:
 * 1) Sends the NEW value to the mutation (previously it sent the old value).
 * 2) Updates Zustand store so UI updates immediately.
 * 3) Optimistic UI + revert on error.
 */
const ToggleReservation: React.FC<Props> = ({ table }) => {
  const setTableReserved = useRestaurantStore((s) => s.setTableReserved);

  const [{ fetching }, toggleReservation] = useMutation<
    ToggleTableReservationMutation,
    ToggleTableReservationMutationVariables
  >(ToggleTableReservationDocument);

  const handleToggle = useCallback(async () => {
    if (fetching) return;

    const prev = !!table.reserved;
    const next = !prev;

    // Optimistic UI: update store immediately
    setTableReserved(table.id, next);

    const result = await toggleReservation({
      toggleTableReservationId: table.id,
      reserved: next,
    });

    if (result.error || !result.data?.toggleTableReservation) {
      // Revert on failure
      setTableReserved(table.id, prev);
      console.error(result.error);
      toast.error("Reservation update failed", { duration: 1600 });
      return;
    }

    const serverReserved = result.data.toggleTableReservation.reserved;
    setTableReserved(table.id, serverReserved);

    toast.success(
      serverReserved
        ? `Table #${table.tableNumber} marked as reserved`
        : `Table #${table.tableNumber} released`,
      { duration: 900 }
    );
  }, [fetching, setTableReserved, table.id, table.reserved, table.tableNumber, toggleReservation]);

  const isReserved = !!table.reserved;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={fetching}
      className={
        "w-full min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold shadow-sm transition " +
        (fetching
          ? "bg-gray-200 text-gray-600 cursor-wait"
          : isReserved
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-green-600 text-white hover:bg-green-700")
      }
      aria-pressed={isReserved}
      aria-label={isReserved ? "Release reservation" : "Reserve table"}
    >
      {fetching ? "Updating..." : isReserved ? "Release" : "Reserve"}
    </button>
  );
};

export default React.memo(ToggleReservation);
