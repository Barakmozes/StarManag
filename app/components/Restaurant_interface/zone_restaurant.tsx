"use client";

import React, { useState,useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useRestaurantStore } from "@/lib/restaurantStore";
import TableCard from "./TableCard";
import TablesSection from "./TablesSection";

const ZoneRestaurant = () => {
  const {
    selectedZone,
    setSelectedZone,
    clearSelectedZone,
    tableData,
    zones,
  } = useRestaurantStore();

  // State to toggle display of all tables
  const [showAllTables, setShowAllTables] = useState(false);

 // Reset showAllTables when a zone is selected
  useEffect(() => {
    if (selectedZone) {
      setShowAllTables(false);
    }
  }, [selectedZone]);


  // Handlers
  const handleShowAllTables = () => {
    clearSelectedZone(); // Resets the selected zone
    setShowAllTables(true); // Displays all tables
  };

  const handleClearScreen = () => {
    clearSelectedZone(); // Resets the selected zone
    setShowAllTables(false); // Clears the "Show All Tables" view
  };

  const handleZoneView = (zoneName: string) => {
    setSelectedZone(zoneName); // Selects the specific zone
    setShowAllTables(false); // Ensures the all-tables view is not displayed
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="px-6 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="flex items-center justify-around bg-white px-2 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            Restaurant Zones
          </h2>
          <div className="flex gap-4">
            <button
              onClick={handleShowAllTables}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
              aria-label="Show All Tables"
            >
              Show All Tables
            </button>
            <button
              onClick={handleClearScreen}
              className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
              aria-label="Clear Screen"
            >
              Clear Screen
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div>
         {showAllTables ? (
            // Display all tables grouped by zone
            <div className="grid gap-6">
              {zones.map((zone) => (
                <div
                  key={zone.name}
                  className="border rounded-lg p-4 bg-white"
                >
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    {zone.name}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {tableData
                      .filter((table) => table.area === zone.name)
                      .map((table) => (
                        <TableCard key={table.tableNumber} table={table} />
                      ))}
                  </div>
                </div>
              ))}
            </div>
          ) : selectedZone ? (
            // Display tables for a specific selected zone
            <div>
              <TablesSection zoneName={selectedZone} />
            </div>
          ) : (
            // Default message when no zone is selected
            <div className="text-center text-gray-500 mt-12">
              <p className="text-lg font-medium">
                Select a zone to display tables or use Show All Tables for an overview.
              </p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default ZoneRestaurant;
