"use client";

import React, { useState } from "react";
import { useDrag } from "react-dnd";
import { Table } from "@prisma/client";

export interface TableModalProps {
  table: Table;
  scale: number;
}

const TableModal: React.FC<TableModalProps> = ({ table, scale }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [reserved, setReserved] = useState(table.reserved || false);
  const [specialRequests, setSpecialRequests] = useState<string[]>(
    table.specialRequests || []
  );

  const { tableNumber, diners, position } = table;
  const x = (position as any)?.x ?? 0;
  const y = (position as any)?.y ?? 0;

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TABLE",
    item: { tableNumber },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleToggleReservation = () => setReserved((prev) => !prev);

  const handleAddRequest = (request: string) => {
    if (request.trim()) {
      setSpecialRequests((prev) => [...prev, request]);
    }
  };

  const handleRemoveRequest = (index: number) => {
    setSpecialRequests((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div
      ref={drag}
      className={`relative p-2 sm:p-3 bg-white rounded-lg shadow-md border border-gray-200 transition-transform ${
        isDragging ? "opacity-75 border-blue-500" : ""
      }`}
      style={{
        position: "absolute",
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        transformOrigin: "top left",
        width: "clamp(120px, 20vw, 160px)", // Responsive width
        cursor: "move",
      }}
      aria-label={`Table ${tableNumber}, ${
        reserved ? "Reserved" : "Available"
      }, for ${diners} diners`}
    >
      {/* Table Info */}
      <div className="mb-2 text-start">
        <h2 className="text-sm sm:text-base font-bold text-gray-700">
          Table #{tableNumber}
        </h2>
        <p className="text-xs sm:text-sm text-gray-500">
          <strong>Diners:</strong> {diners}
        </p>
        <p className="text-xs sm:text-sm font-semibold">
          <span className={reserved ? "text-red-600" : "text-green-600"}>
            {reserved ? "Reserved" : "Available"}
          </span>
        </p>
      </div>

      {/* Reservation Toggle */}
      <button
        onClick={handleToggleReservation}
        className={`w-full py-1 sm:py-2 text-xs sm:text-sm rounded ${
          reserved ? "bg-red-500 text-white" : "bg-green-500 text-white"
        }`}
        aria-label={`Mark table ${tableNumber} as ${
          reserved ? "available" : "reserved"
        }`}
      >
        {reserved ? "Release" : "Reserve"}
      </button>

      {/* Special Requests */}
      <div className="mt-2">
        <button
          onClick={() => setIsEditing((prev) => !prev)}
          className="w-full py-1 sm:py-2 text-xs sm:text-sm bg-blue-500 text-white rounded"
        >
          {isEditing ? "Done" : "Edit Requests"}
        </button>
        {isEditing && (
          <div className="mt-1">
            <input
              type="text"
              className="w-full px-1 py-1 sm:py-2 text-xs sm:text-sm rounded border"
              placeholder="Add request"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddRequest(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              aria-label="Add new request"
            />
          </div>
        )}
        <ul className="mt-1 space-y-1 text-xs sm:text-sm">
          {specialRequests.map((request, index) => (
            <li key={index} className="flex justify-between">
              <span>{request}</span>
              <button
                onClick={() => handleRemoveRequest(index)}
                className="text-red-500 hover:underline"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </div>

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
            const radius = diners <= 4 ? 35 : 45; // Adjust radius for smaller screens
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
