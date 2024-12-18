"use client";

import React, { useState } from "react";
import { useDrag } from "react-dnd";
import { TableData, Position } from "@/types";

type TableModalProps = {
  table: TableData; // The table data
  moveTable: (tableNumber: number, newArea: string, newPosition: Position) => void; // Function to move table
  scale: number; // Current scale for scaling adjustments
};

const TableModal: React.FC<TableModalProps> = ({ table, moveTable, scale }) => {
  const [isEditing, setIsEditing] = useState(false); // Toggle special request editing
  const [reserved, setReserved] = useState(table.reserved || false); // Reservation state
  const [specialRequests, setSpecialRequests] = useState<string[]>(
    table.specialRequests || []
  ); // List of special requests

  const { tableNumber, diners, position } = table;

  // Drag-and-Drop Logic
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "TABLE",
    item: { tableNumber },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  // Handle reservation toggle
  const handleToggleReservation = () => {
    setReserved(!reserved);
  };

  // Handle adding a special request
  const handleAddRequest = (request: string) => {
    if (request.trim()) {
      setSpecialRequests([...specialRequests, request]);
    }
  };

  // Handle removing a special request
  const handleRemoveRequest = (index: number) => {
    setSpecialRequests((prevRequests) =>
      prevRequests.filter((_, i) => i !== index)
    );
  };

  return (
    <div
      ref={drag}
      className={`relative max-w-sm mx-auto p-3 bg-white rounded-lg shadow-md border border-gray-200 transition-transform ${
        isDragging ? "opacity-75 border-blue-500 border-2" : ""
      }`}
      style={{
        position: "absolute",
        left: position?.x || 0,
        top: position?.y || 0,
        transform: `scale(${scale})`,
        cursor: "move",
      }}
      aria-label={`Table ${tableNumber}, ${
        reserved ? "Reserved" : "Available"
      }, for ${diners} diners`}
    >
      {/* Table Header */}
      <div className="mb-3">
        <h2 className="text-lg font-bold text-gray-700">
          Table #{tableNumber}
        </h2>
        <p className="text-sm text-gray-500">
          <strong>Diners:</strong> {diners}
        </p>
        <p className="text-sm text-gray-500">
          <strong>Status:</strong>{" "}
          <span
            className={`font-semibold ${
              reserved ? "text-red-600" : "text-green-600"
            }`}
          >
            {reserved ? "Reserved" : "Available"}
          </span>
        </p>
      </div>

      {/* Reservation Toggle */}
      <button
        onClick={handleToggleReservation}
        className={`w-full px-4 py-2 rounded-lg text-sm font-medium shadow ${
          reserved
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-green-500 text-white hover:bg-green-600"
        }`}
        aria-label={`Mark table ${tableNumber} as ${
          reserved ? "available" : "reserved"
        }`}
      >
        {reserved ? "Release Table" : "Reserve Table"}
      </button>

      {/* Special Requests */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-gray-700">
          Special Requests
        </h3>
        <ul className="mt-2 space-y-1">
          {specialRequests.map((request, index) => (
            <li
              key={index}
              className="flex items-center bg-gray-100 p-2 rounded-lg shadow-inner text-sm text-gray-700"
            >
              <span>{request}</span>
              <button
                onClick={() => handleRemoveRequest(index)}
                className="ml-auto text-red-500 hover:text-red-700 text-sm"
                aria-label={`Remove request: ${request}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        {isEditing && (
          <div className="mt-2">
            <input
              type="text"
              className="w-full px-3 py-1 rounded-lg border border-gray-300 focus:ring focus:ring-blue-200"
              placeholder="Add a new request"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddRequest(e.currentTarget.value);
                  e.currentTarget.value = "";
                }
              }}
              aria-label="Add a new special request"
            />
          </div>
        )}
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="mt-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm shadow hover:bg-blue-600"
        >
          {isEditing ? "Done Editing" : "Edit Requests"}
        </button>
      </div>

      {/* Table Visualization */}
      <div className="relative mx-auto mt-6">
        <div
          className={`relative ${
            diners <= 4 ? "w-40 h-40 rounded-full" : "w-48 h-32 rounded-lg"
          } mx-auto bg-gradient-to-t from-gray-300 via-gray-200 to-gray-100 shadow-inner flex items-center justify-center`}
        >
          <h3 className="absolute text-sm font-bold text-gray-600">
            Table #{tableNumber}
          </h3>
          {Array.from({ length: diners }).map((_, index) => {
            const angle = (index / diners) * 360;
            const radius = diners <= 4 ? 50 : 60;
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
      </div>
    </div>
  );
};

export default React.memo(TableModal);
