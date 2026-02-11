"use client";

import React from "react";
import { useDrag } from "react-dnd";

import EditTableModal from "./CRUD_Zone-CRUD_Table/EditTableModal";
import DeleteTableModal from "./CRUD_Zone-CRUD_Table/DeleteTableModal";
import { TableInStore } from "@/lib/AreaStore";
import ToggleReservation from "./Table_Settings/ToggleReservation";
import SpecialRequests from "./Table_Settings/specialRequests";
import TableReservations from "./Table_Settings/TableReservations";
import Start_an_order from "./Table_Settings/Start_an_order_Table";
import { Table as PrismaTable } from "@prisma/client";

export interface TableModalProps {
  table: TableInStore;
  scale: number;
}

const TableModal: React.FC<TableModalProps> = ({ table, scale }) => {
  const isDirty = table?.dirty;

  const { tableNumber, diners, position, reserved } = table;
  const x = (position as any)?.x ?? 0;
  const y = (position as any)?.y ?? 0;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TABLE",
    item: { tableId: table.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // TableInStore is structurally compatible with Prisma's Table scalar fields,
  // but we cast to keep props strongly typed for the child components.
  const prismaTable = table as unknown as PrismaTable;

  return (
    <div
      ref={drag}
      className={`relative select-none rounded-lg bg-white shadow-md border border-gray-200 transition-transform p-3 sm:p-3 ${
        isDragging ? "opacity-75 border-blue-500" : ""
      }`}
      style={{
        position: "absolute",
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: "top left",
        width: "clamp(170px, 26vw, 220px)",
        cursor: "move",
      }}
      aria-label={`Table ${tableNumber}, ${
        reserved ? "Reserved" : "Available"
      }, for ${diners} diners`}
    >
      {/* Header: table info + quick actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-gray-700">
            Table #{tableNumber}
            {isDirty && <span className="text-red-500">*</span>}
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            <strong>Diners:</strong> {diners}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <DeleteTableModal table={prismaTable} />
          <EditTableModal table={prismaTable} />
        </div>
      </div>

      {/* Controls row */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <ToggleReservation table={prismaTable} />
        <TableReservations table={prismaTable} />
      </div>

      {/* Special Requests */}
      <SpecialRequests table={prismaTable} />

      {/* Start Order */}
      <Start_an_order table={prismaTable} />

      {/* Table Visualization */}
      <div className="relative mt-4 mx-auto">
        <div
          className={`relative ${
            diners <= 4
              ? "w-20 h-20 sm:w-24 sm:h-24 rounded-full"
              : "w-32 h-20 sm:w-36 sm:h-24 rounded-lg"
          } bg-gray-200 shadow-inner flex items-center justify-center`}
        >
          <h3 className="absolute text-xs sm:text-sm font-bold text-gray-600">
            #{tableNumber}
          </h3>
          {Array.from({ length: diners }).map((_, index) => {
            const angle = (index / diners) * 360;
            const radius = diners <= 4 ? 35 : 45;
            const seatX = radius * Math.cos((angle * Math.PI) / 180);
            const seatY = radius * Math.sin((angle * Math.PI) / 180);
            return (
              <div
                key={index}
                className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[8px] sm:text-[10px] font-bold"
                style={{
                  transform: `translate(${seatX}px, ${seatY}px)`,
                }}
                aria-label={`Seat ${index + 1}`}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TableModal);
