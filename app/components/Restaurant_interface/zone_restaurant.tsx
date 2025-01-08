"use client";

import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useQuery } from "@urql/next";

import { useRestaurantStore } from "@/lib/AreaStore";
import TablesSection from "./TablesSection";
import TableCard from "./TableCard";

import {
  GetTablesDocument,
  GetTablesQuery,
  GetTablesQueryVariables,
  BasicArea,
  Area
} from "@/graphql/generated";
import { Table } from "@prisma/client";
import AddZoneForm from "./CRUD_Zone-CRUD_Table/AddZoneForm";
import DeleteZoneModal from "./CRUD_Zone-CRUD_Table/DeleteZoneModal";
import EditZoneModal from "./CRUD_Zone-CRUD_Table/EditZoneModal";
/**
 * ZoneRestaurant
 * Renders:
 *  - "Show All Tables" grouped by area
 *  - or a single selectedArea's tables
 *  - or a default message if no selection
 */
const ZoneRestaurant = () => {
  // 1) GraphQL: Fetch the tables
  const [{ data, fetching, error }] = useQuery<
    GetTablesQuery,
    GetTablesQueryVariables
  >({
    query: GetTablesDocument,
    variables: {},
  });
  const tableData: Table[] = data?.getTables ?? [];

  // 2) Zustand store references
  const {
    selectedArea,
    setSelectedArea,
    clearSelectedArea,
    areas,
    scale,
    moveTable,
    adjustScale,
  } = useRestaurantStore();

  // 3) Local UI state: showAllTables toggles the "all areas" view
  const [showAllTables, setShowAllTables] = useState(false);
 const [showAllTablesable, setshowAllTablesable] = useState(false);
  // When an area is selected in the store, we hide the "show all" view
  useEffect(() => {
    if (selectedArea) {
      setShowAllTables(false);
      setshowAllTablesable(false);
    }
  }, [selectedArea]);

  // Handlers
  const handleShowAllTables = () => {
    // Clear any selected area and show "all areas" mode
    clearSelectedArea();
    setShowAllTables(true);
    setshowAllTablesable(false);
  };

  const handleShowAllTablesable = () => {
    clearSelectedArea();
    setShowAllTables(false);
    setshowAllTablesable(true);
  };

  const handleClearScreen = () => {
    // Reset the area selection and hide the "all" view
    clearSelectedArea();
    setshowAllTablesable(false);
    setShowAllTables(false);
  };

  // If you want to manually pick a zone by name
  const handleZoneView = (zoneName: string) => {
    setSelectedArea(zoneName);
    setShowAllTables(false);
  };



  // 4) Rendering
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="px-6 bg-gray-50 min-h-screen">
        {/* Header Section */}
        <div className="flex items-center justify-around bg-white px-2 rounded-lg shadow-md mb-2">
          <h2 className="text-xl font-bold text-gray-800">Restaurant Zones</h2>
          <div className="flex gap-4">
            <button
              onClick={handleShowAllTables}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
              aria-label="Show All Tables"
            >
              Show All Tables
            </button>
            <button
              onClick={handleShowAllTablesable}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
              aria-label="Show All Tables"
            >
              Show All Tables available
            </button>
            <button
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
              aria-label="Show All Tables"
            >
              <AddZoneForm />
            </button>
            <button
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
              aria-label="Show All Tables"
            >
          < DeleteZoneModal areas={areas as BasicArea[] }  areaSelectToDelete={selectedArea as BasicArea }/>
            </button>
            <button
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
              aria-label="Show All Tables"
            >
          < EditZoneModal areas={areas as Area[] }  areaSelectToEdit={selectedArea as Area }/>
            </button>
            <button
              onClick={handleClearScreen}
              className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
              aria-label="Clear Screen"
            >
              Clear Screen
            </button>
            <button
              onClick={() => adjustScale(0.1)}
              className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              aria-label="Zoom In"
            >
              Zoom In
            </button>
            <button
              onClick={() => adjustScale(-0.1)}
              className="text-sm bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition"
              aria-label="Zoom Out"
            >
              Zoom Out
            </button>
            
          </div>
        </div>

        {/* Content Section */}
        <div>
          {/* 4A) If "Show All" is on, we group tables by zone */}
          {showAllTables ? (
            <div className="grid gap-6">
              {areas.map((zone) => {
                // Filter tables by matching areaId
                const zoneTables = tableData.filter(
                  (tbl) => tbl.areaId === zone.id
                );
                // Render each zone with its tables available
                return (
                  <div key={zone.id} className="border rounded-lg p-4 bg-white">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                      {zone.name}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {zoneTables.map((table) => (
                        <TableCard key={table.id} table={table as Table} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ): showAllTablesable ? ( // Render each zone with its tables available
            <div className="grid gap-6">
            {areas.map((zone) => {
              // Filter tables by matching areaId
              const zoneTables = tableData.filter(
                (tbl) => tbl.areaId === zone.id && !tbl.reserved
              );
              return (
                <div key={zone.id} className="border rounded-lg p-4 bg-white">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    {zone.name}
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {zoneTables.map((table) => (
                      <TableCard key={table.id} table={table as Table} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          ) : selectedArea ? (
            // 4B) If an area is selected, pass the filtered tables to TablesSection
            <div>
              {/* Filter tables for the selectedArea.id */}
              <TablesSection
                areaSelect={selectedArea} // { id, name, floorPlanImage }
                scale={scale}
                moveTable={(tableNum, newArea, newPos) =>
                  moveTable(tableNum, newArea, newPos)
                }
                filteredTables={tableData.filter(
                  (tbl) => tbl.areaId === selectedArea.id
                )}
              />
            </div>
          ) : (
            // 4C) Default message
            <div className="text-center text-gray-500 mt-12">
              <p className="text-lg font-medium">
                Select a zone to display tables or use “Show All Tables” for an
                overview.
              </p>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default ZoneRestaurant;
