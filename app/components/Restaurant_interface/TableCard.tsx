"use client";

import React, { useState } from "react";
import { TableInStore } from "@/lib/AreaStore";
import Start_an_order from "./Table_Settings/Start_an_order_Table";
type TableCardProps = {
  table: TableInStore;
};

const TableCard: React.FC<TableCardProps> = ({ table }) => {
  const { tableNumber, diners } = table;
  const [reserved, setReserved] = useState(table.reserved || false);

  // Handle reservation toggle
  const handleToggleReservation = () => {
    setReserved(!reserved);
  };

  return (
    <div
      className={`relative ${
        diners <= 4
          ? "w-20 h-36 sm:w-40 sm:h-40 rounded-full"
          : "w-20 h-36 sm:w-48 sm:h-32 rounded-lg"
      } mx-auto bg-gradient-to-t from-gray-300 via-gray-200 to-gray-100 shadow-inner flex items-center justify-center`}
    >
      <div className="flex flex-col items-center justify-center text-center gap-2 px-2">
        <h3 className="text-sm font-bold text-gray-600">Table #{tableNumber}</h3>

        {/* Reservation Toggle */}
        <button
          type="button"
          onClick={handleToggleReservation}
          className={`min-h-[22px] px-1 py-1 rounded-lg text-xs sm:text-sm font-medium shadow transition w-full max-w-[5rem] ${
            reserved
              ? "bg-red-500 text-white hover:bg-red-600"
              : "bg-green-500 text-white hover:bg-green-600"
          }`}
          aria-label={`Mark table ${tableNumber} as ${
            reserved ? "available" : "reserved"
          }`}
        >
          {reserved ? "Release" : "Reserve"}
        </button>
         {/* Start Order */}
      <Start_an_order table={table} />
      </div>

      {Array.from({ length: diners }).map((_, index) => {
        const angle = (index / diners) * 360;
        const radius = diners <= 4 ? 50 : 80;
        const x = radius * Math.cos((angle * Math.PI) / 180);
        const y = radius * Math.sin((angle * Math.PI) / 180);

        return (
          <div
            key={index}
            className="absolute w-6 h-6 bg-blue-500 text-white rounded-full shadow-md flex items-center justify-center text-xs font-bold"
            style={{
              transform: `translate(${x}px, ${y}px)`,
            }}
            aria-label={`Seat ${index + 1}`}
          >
            {index + 1}
          </div>
        );
      })}
    </div>
  );
};

export default React.memo(TableCard);
