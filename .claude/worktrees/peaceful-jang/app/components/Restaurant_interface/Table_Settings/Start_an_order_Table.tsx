"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store";

type MinimalTable = {
  id: string;
  tableNumber: number;
};

interface StartAnOrderProps {
  table: MinimalTable;
}

const StartAnOrder = ({ table }: StartAnOrderProps) => {
  const router = useRouter();
  const startOrderForTable = useCartStore((s) => s.startOrderForTable);

  const handleStartOrder = () => {
    startOrderForTable(table.id, table.tableNumber);
    router.replace("/#menuSection");
  };

  return (
    <button
      onClick={handleStartOrder}
      type="button"
      className="w-full relative z-[100] min-h-[44px] rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-600 transition"
    >
      Start order
    </button>
  );
};

export default StartAnOrder;
