import React from "react";

type TableProps = {
  table: {
    tableNumber: number;
    diners: number;
    area: string;
    reserved?: boolean;
    specialRequests?: string[];
  };
};

const TableModal = ({ table }: TableProps) => {
  const seatCount = table.diners;
  const isRoundTable = seatCount <= 4; // Round table for small groups
  const radius = isRoundTable ? 80 : 100; // Adjust radius for different table shapes

  return (
    <div className="relative max-w-sm mx-auto p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
      {/* Table Details */}
      <div className="mb-10">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Table Details</h2>
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">
            <strong>Table Number:</strong> #{table.tableNumber}
          </p>
          <p
            className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
              table.reserved ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            {table.reserved ? "Reserved" : "Available"}
          </p>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          <strong>Area:</strong> {table.area}
        </p>
        <p className="mt-2  text-sm text-gray-600">
          <strong>Diners:</strong> {seatCount} seat(s)
        </p>
      </div>

      {/* Table Visualization */}
      <div className="relative mx-auto mb-8">
        <div
          className={`relative ${
            isRoundTable ? "w-40 h-40 rounded-full" : "w-48 h-32 rounded-lg"
          } mx-auto bg-gradient-to-t from-gray-300 via-gray-200 to-gray-100 shadow-inner flex items-center justify-center`}
        >
          {/* Table Number on Visualization */}
          <h3 className="absolute text-sm font-bold text-gray-600">
            Table #{table.tableNumber}
          </h3>

          {/* Seats */}
          {Array.from({ length: seatCount }).map((_, index) => {
            const angle = (index / seatCount) * 360;
            const x = radius * Math.cos((angle * Math.PI) / 180);
            const y = radius * Math.sin((angle * Math.PI) / 180);
            return (
              <div
                key={index}
                className="absolute w-8 h-8 bg-blue-500 text-white rounded-full shadow-md flex items-center justify-center text-sm font-bold"
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                }}
              >
                {index + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Special Requests */}
      {table.specialRequests && table.specialRequests.length > 0 && (
        <div >
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Special Requests
          </h3>
          <ul className="space-y-2">
            {table.specialRequests.map((request, index) => (
              <li
                key={index}
                className="flex items-center bg-gray-100 p-3 rounded-lg shadow-sm text-sm text-gray-700"
              >
                <span className="mr-2">🍴</span> {request}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TableModal;
