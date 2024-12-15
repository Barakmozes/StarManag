"use client";

import React, { useEffect } from "react";
import { useZoneStore } from "@/lib/store"; // Import Zustand store
import { tableData } from "@/data/Table";
import TableModal from "./TableModal";
import TablesSection from "./TablesSection";

type Zone = {
  name: string;
  tables: number[];
};

// Dynamically generate zones based on tableData
export const zones: Zone[] = Array.from(
  new Set(tableData.map((table) => table.area)) // Extract unique areas
).map((area) => ({
  name: area,
  tables: tableData
    .filter((table) => table.area === area)
    .map((table) => table.tableNumber),
}));

const ZoneRestaurant = () => {
  const { selectedZone, setSelectedZone, clearSelectedZone } = useZoneStore();
  const [showTables, setShowTables] = React.useState(false);

  // Update Zustand store when the component mounts
  useEffect(() => {}, [selectedZone, setSelectedZone]);

  const handleZoneClick = (zoneName: string) => {
    setSelectedZone(zoneName); // Update the global selected zone
  };

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-around bg-gray-50 p-2 rounded-lg shadow-md mb-6">
        {/* Left Section: Title */}
        <div className="flex items-center">
          <h2 className="text-xl font-bold text-gray-800 mr-4">
            Restaurant Zones
          </h2>
          <button
            onClick={() => setShowTables(!showTables)}
            className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            {showTables ? "Hide All Tables" : "View All Tables"}
          </button>
        </div>

        {/* Right Section: Selected Zone and Close Button */}
        {selectedZone && (
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-600 mr-4">
              {selectedZone}
            </h2>
            <button
              onClick={clearSelectedZone}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Display All Tables Section */}
      {showTables && (
        <div className="my-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {tableData.map((table) => (
            <TableModal key={table.tableNumber} table={table} />
          ))}
        </div>
      )}

      {/* Tables Section */}
      <TablesSection
        selectedZone={selectedZone}
        zones={zones}
        clearSelectedZone={clearSelectedZone}
      />
    </div>
  );
};

export default ZoneRestaurant;
