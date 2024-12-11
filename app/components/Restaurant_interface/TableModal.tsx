import React from "react";

type Props = {
  table: {
    tableNumber: number;
    diners: number;
    area: string;
    reserved?: boolean;
    specialRequests?: string[];
  };
};

const TableModal = ({ table }: Props) => {
  return (
    <div
      className="relative mx-auto max-w-lg p-6 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-lg shadow-xl transform transition-transform hover:scale-105"
      style={{ perspective: "1000px" }}
    >
      {/* Outer Glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 blur-lg opacity-30"></div>
      
      {/* 3D Card Effect */}
      <div className="relative bg-white text-center rounded-lg shadow-md p-5 transform transition-transform hover:rotate-y-3 hover:rotate-x-3">
        <h3 className="text-3xl font-bold text-purple-800 drop-shadow-md mb-3">
          Table #{table.tableNumber}
        </h3>
        <p className="text-lg font-semibold text-gray-700 mb-2">
          Area: <span className="text-yellow-500">{table.area}</span>
        </p>
        <p className="text-md text-gray-600 mb-3">
          Capacity: <span className="font-bold text-green-600">{table.diners}</span>{" "}
          diners
        </p>
        <p
          className={`py-2 px-4 rounded-full text-sm font-medium inline-block ${
            table.reserved
              ? "bg-red-600 text-white animate-pulse"
              : "bg-green-600 text-white animate-bounce"
          }`}
        >
          {table.reserved ? "Reserved" : "Available"}
        </p>

        {/* Special Requests */}
        {table.specialRequests && table.specialRequests.length > 0 && (
          <div className="mt-5">
            <h4 className="text-lg text-gray-800 font-semibold underline">
              Special Requests:
            </h4>
            <ul className="text-sm text-gray-600 mt-3 space-y-1">
              {table.specialRequests.map((request, index) => (
                <li
                  key={index}
                  className="bg-gray-200 py-2 px-4 rounded-lg shadow-inner"
                >
                  {request}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default TableModal;
