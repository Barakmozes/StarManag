"use client";

import React, { useState, useEffect } from "react";
import { tableData } from "@/data/Table";
import TableModal from "./TableModal";
import TablesSection from "./TablesSection";

type Zone = {
  name: string;
  tables: number[];
};

export const zones: Zone[] = [
  { name: "Patio", tables: [1, 6] },
  { name: "Main Hall", tables: [2, 7] },
  { name: "Private Room", tables: [3] },
  { name: "Balcony", tables: [4] },
  { name: "Banquet Hall", tables: [5] },
];

const ZoneRestaurant = () => {
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showTables, setShowTables] = useState(false);
  const [localStorageTrigger, setLocalStorageTrigger] = useState(false);

  // Load the selected zone when the component mounts
  useEffect(() => {
    const savedZoneName = localStorage.getItem("selectedZone");
    if (savedZoneName) {
      const matchedZone = zones.find((zone) => zone.name === savedZoneName);
      setSelectedZone(matchedZone || null); // Safeguard against unmatched zones
    } else {
      setSelectedZone(null); // No saved zone
    }
  }, [localStorageTrigger]); // Depend on localStorageTrigger to re-run

  const updateSelectedZone = (zone: Zone | null) => {
    if (zone) {
      localStorage.setItem("selectedZone", zone.name);
    } else {
      localStorage.removeItem("selectedZone");
    }
    setLocalStorageTrigger((prev) => !prev); // Trigger useEffect
  };

  const closeZone = () => {
    setSelectedZone(null);
    updateSelectedZone(null);
  };

  return (
    <div className="p-6 bg-gray-50">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Restaurant Zones</h1>
        <button
          onClick={() => setShowTables(!showTables)}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
        >
          {showTables ? "Hide All Tables" : "View All Tables"}
        </button>
      </div>

      {/* Display All Tables Section */}
      {showTables && (
        <div className="mt-6">
          <TablesSection />
        </div>
      )}

      {/* Zone Tables Modal */}
      {selectedZone && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={closeZone}
        >
          <div
            className="bg-white p-6 rounded-lg shadow-lg w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-700">
                {selectedZone.name} Tables
              </h2>
              <button
                onClick={closeZone}
                className="text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tableData
                .filter((table) =>
                  selectedZone.tables.includes(table.tableNumber)
                )
                .map((table) => (
                  <TableModal key={table.tableNumber} table={table} />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ZoneRestaurant;
