"use client";

import React, { useState, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useQuery, useMutation } from "@urql/next";

import { useRestaurantStore, TableInStore } from "@/lib/AreaStore";
import TablesSection from "./TablesSection";
import TableCard from "./TableCard";

import {
  GetTablesDocument,
  GetTablesQuery,
  GetTablesQueryVariables,
  BasicArea,
  Area,
  UpdateManyTablesDocument,
} from "@/graphql/generated";
import { Table } from "@prisma/client";

import AddZoneForm from "./CRUD_Zone-CRUD_Table/AddZoneForm";
import DeleteZoneModal from "./CRUD_Zone-CRUD_Table/DeleteZoneModal";
import EditZoneModal from "./CRUD_Zone-CRUD_Table/EditZoneModal";
import toast from "react-hot-toast";
import AddTableModal from "./CRUD_Zone-CRUD_Table/AddTableModal";

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
  const [{}, reexecuteTablesQuery] = useQuery({
    query: GetTablesDocument,
    pause: true,
  });

  // GraphQL mutation to update table position in DB
  const [updateManyResult, updateManyTables] = useMutation(
    UpdateManyTablesDocument
  );

  // 2) Zustand store references
  const {
    tables,
    setTables,
    selectedArea,
    clearSelectedArea,
    areas,
    scale,
    moveTable,
    adjustScale,
  } = useRestaurantStore();

  // 3) Local UI state: showAllTables toggles the "all areas" view
  const [showAllTables, setShowAllTables] = useState(false);
  const [showAllTablesable, setshowAllTablesable] = useState(false);

  // Mobile-only: collapse/expand controls to avoid overflow
  const [isMobileControlsOpen, setIsMobileControlsOpen] = useState(false);

  // When an area is selected in the store, we hide the "show all" view
  useEffect(() => {
    if (selectedArea) {
      setShowAllTables(false);
      setshowAllTablesable(false);
      setIsMobileControlsOpen(false);
    }
  }, [selectedArea]);

  // On first load or any refetch, populate local store
  useEffect(() => {
    if (data?.getTables?.length) {
      const tablesFromServer: Table[] = data.getTables;

      setTables(
        tablesFromServer.map((t) => ({
          id: t.id,
          tableNumber: t.tableNumber,
          areaId: t.areaId,
          position: t.position as { x: number; y: number },
          dirty: false,
          diners: t.diners,
          reserved: t.reserved,
          specialRequests: t.specialRequests,
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        }))
      );
    }
  }, [data, setTables]);

  // The locally updated tables
  const localTables = tables;
  // If an area is selected, filter local tables
  const localFiltered = selectedArea
    ? localTables.filter((t) => t.areaId === selectedArea.id)
    : localTables;

  // Handlers
  const handleShowAllTables = () => {
    // Clear any selected area and show "all areas" mode
    clearSelectedArea();
    setShowAllTables(true);
    setshowAllTablesable(false);
    setIsMobileControlsOpen(false);
  };

  const handleShowAllTablesable = () => {
    clearSelectedArea();
    setShowAllTables(false);
    setshowAllTablesable(true);
    setIsMobileControlsOpen(false);
  };

  const handleClearScreen = () => {
    // Reset the area selection and hide the "all" view
    clearSelectedArea();
    setshowAllTablesable(false);
    setShowAllTables(false);
    setIsMobileControlsOpen(false);
  };

  const handleSaveChanges = async () => {
    // Get all local tables from Zustand
    const allTables = useRestaurantStore.getState().tables;
    // Filter only those with dirty === true
    const changedTables = allTables.filter((t) => t.dirty);

    if (changedTables.length === 0) {
      console.log("No changed tables to save.");
      return;
    }

    try {
      // Prepare the array for GraphQL
      // Each object must match UpdateManyTablesInput: { id, position?, areaId?, etc. }
      const updates = changedTables.map((t) => ({
        id: t.id,
        position: t.position,
        areaId: t.areaId,
        // If you need to update reserved/diners as well, include them
        reserved: t.reserved,
      }));

      // Send the mutation request
      const result = await updateManyTables({ updates });
      if (result.error) {
        console.error("Failed to update tables:", result.error);
        return;
      }

      // 1) Clear dirty flags locally
      useRestaurantStore.setState((state) => ({
        tables: state.tables.map((tbl) => ({ ...tbl, dirty: false })),
      }));

      // 2) Re-fetch from server if you want the updated data
      reexecuteTablesQuery({ requestPolicy: "network-only" });
      // Or do a direct cache update if you prefer.
      toast.success("Tables updated successfully!", { duration: 800 });
    } catch (err) {
      console.error("Error saving changes:", err);
    }
  };

  // 4) Rendering
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-gray-50 min-h-screen px-3 sm:px-6 pb-6 overflow-x-hidden">
        {/* Header Section */}
        <div className="pt-3 sm:pt-0">
          <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 mb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                  Restaurant Zones
                </h2>
                {error && (
                  <p className="mt-1 text-sm text-red-600 break-words">
                    Something went wrong: {error.message}
                  </p>
                )}
              </div>

              {/* Mobile-only controls toggle */}
              <button
                type="button"
                onClick={() => setIsMobileControlsOpen((s) => !s)}
                className="sm:hidden inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-200 transition"
                aria-expanded={isMobileControlsOpen}
                aria-controls="zone-controls"
              >
                {isMobileControlsOpen ? "Hide Controls" : "Controls"}
              </button>
            </div>

            <div
              id="zone-controls"
              className={`mt-3 ${
                isMobileControlsOpen ? "grid" : "hidden"
              } grid-cols-1 gap-2 sm:mt-0 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-2`}
            >
              <button
                type="button"
                onClick={handleClearScreen}
                className="w-full sm:w-auto min-h-[44px] text-sm bg-red-600 text-white px-4 py-2 rounded-lg shadow hover:bg-red-700 transition"
                aria-label="Clear Screen"
              >
                Clear Screen
              </button>

              <button
                type="button"
                onClick={handleShowAllTables}
                className="w-full sm:w-auto min-h-[44px] text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
                aria-label="Show All Tables"
              >
                Show All Tables
              </button>

              <button
                type="button"
                onClick={handleShowAllTablesable}
                className="w-full sm:w-auto min-h-[44px] text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
                aria-label="Show All Tables available"
              >
                Show All Tables available
              </button>

              <button
                type="button"
                onClick={handleShowAllTablesable}
                className="w-full sm:w-auto min-h-[44px] text-sm bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
                aria-label="Show All Tables not pay"
              >
                Show All Tables not pay
              </button>

              {/* Zone CRUD */}
              <AddZoneForm />
              <DeleteZoneModal
                areas={areas as BasicArea[]}
                areaSelectToDelete={selectedArea as BasicArea}
              />
              <EditZoneModal
                areas={areas as Area[]}
                areaSelectToEdit={selectedArea as Area}
              />

              {/* Zoom */}
              <button
                type="button"
                onClick={() => adjustScale(0.1)}
                className="w-full sm:w-auto min-h-[44px] text-sm bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                aria-label="Zoom In"
              >
                Zoom In
              </button>
              <button
                type="button"
                onClick={() => adjustScale(-0.1)}
                className="w-full sm:w-auto min-h-[44px] text-sm bg-blue-600 text-white px-3 py-2 rounded-lg shadow hover:bg-blue-700 transition"
                aria-label="Zoom Out"
              >
                Zoom Out
              </button>

              <button
                type="button"
                onClick={handleSaveChanges}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
              >
                Save Table Positions
              </button>

              {/* Table CRUD */}
              <AddTableModal
                allAreas={areas} // array of BasicArea
                areaSelectID={selectedArea} // optional pre-selected area
              />
            </div>
          </div>
        </div>

        {/* Optional loading state */}
        {fetching && (
          <div className="mb-3 rounded-lg bg-white p-3 text-sm text-gray-600 shadow-sm">
            Loading tables...
          </div>
        )}

        {/* Content Section */}
        <div>
          {/* 4A) If "Show All" is on, we group tables by zone */}
          {showAllTables ? (
            <div className="grid gap-4 sm:gap-6">
              {areas.map((zone) => {
                // Filter tables by matching areaId
                const zoneTables = localFiltered.filter(
                  (tbl) => tbl.areaId === zone.id
                );
                // Render each zone with its tables
                return (
                  <div
                    key={zone.id}
                    className="border rounded-lg p-3 sm:p-4 bg-white"
                  >
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
                      {zone.name}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {zoneTables.map((table) => (
                        <TableCard key={table.id} table={table as TableInStore} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : showAllTablesable ? (
            // Render each zone with its tables available
            <div className="grid gap-4 sm:gap-6">
              {areas.map((zone) => {
                // Filter tables by matching areaId
                const zoneTables = localFiltered.filter(
                  (tbl) => tbl.areaId === zone.id && !tbl.reserved
                );
                return (
                  <div
                    key={zone.id}
                    className="border rounded-lg p-3 sm:p-4 bg-white"
                  >
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-3 sm:mb-4">
                      {zone.name}
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {zoneTables.map((table) => (
                        <TableCard key={table.id} table={table as TableInStore} />
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
                areaSelect={selectedArea}
                scale={scale}
                moveTable={(tableId, areaId, newPos) =>
                  moveTable(tableId, areaId, newPos)
                }
                filteredTables={localFiltered}
              />
            </div>
          ) : (
            // 4C) Default message
            <div className="text-center text-gray-500 mt-10 sm:mt-12 px-2">
              <p className="text-base sm:text-lg font-medium">
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
