"use client";

import React from "react";
import { TableData } from "@/types";

type TableCardProps = {
  table: TableData;
};

const TableCard: React.FC<TableCardProps> = ({ table }) => {
  const { tableNumber, diners, reserved } = table;

  return (
    <div
      className={`p-4 rounded-lg shadow-md flex flex-col items-center justify-center ${
        reserved ? "bg-red-100 border-red-500" : "bg-green-100 border-green-500"
      } border-2`}
      aria-label={`Table ${tableNumber}`}
    >
      <h3 className="text-lg font-semibold text-gray-700">
        Table #{tableNumber}
      </h3>
      <p className="text-sm text-gray-600">
        Diners: <strong>{diners}</strong>
      </p>
      <p
        className={`text-sm font-medium ${
          reserved ? "text-red-600" : "text-green-600"
        }`}
      >
        {reserved ? "Reserved" : "Available"}
      </p>
    </div>
  );
};

export default React.memo(TableCard);
