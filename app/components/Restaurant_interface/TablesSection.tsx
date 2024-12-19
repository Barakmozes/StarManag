"use client";

import React, { useMemo, useRef, useCallback, useEffect } from "react";
import { useDrop } from "react-dnd";
import { useRestaurantStore } from "@/lib/restaurantStore";
import { TableManager } from "./TableManager";
import TableModal from "./TableModal";
import throttle from "lodash/throttle";

type TablesSectionProps = {
  zoneName?: string; // Optional zoneName to filter tables
};

const TablesSection: React.FC<TablesSectionProps> = ({ zoneName }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    tableData,
    moveTable,
    scale,
    zones,
  } = useRestaurantStore((state) => ({
    tableData: state.tableData,
    moveTable: state.moveTable,
    scale: state.scale,
    zones: state.zones,
  }));

  // Get filtered tables for the current zone
  const filteredTables = useMemo(() => {
    if (!zoneName) return tableData; // If no zone is selected, show all tables
    return tableData.filter((table) => table.area === zoneName);
  }, [zoneName, tableData]);

  // Get the current zone's floor plan image
  const currentZone = useMemo(
    () => zones.find((zone) => zone.name === zoneName),
    [zones, zoneName]
  );

  // Throttled function to update table positions
  const throttledMoveTable = useCallback(
    throttle(
      (tableNumber: number, newArea: string, newPosition: { x: number; y: number }) => {
        TableManager.moveTable(tableNumber, newArea, newPosition);
      },
      100,
      { leading: true, trailing: true }
    ),
    []
  );

  // Snap positions to a grid for better alignment
  const snapToGrid = (x: number, y: number, gridSize: number) => ({
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  });

  // Handle the drop functionality
  const [, drop] = useDrop({
    accept: "TABLE",
    drop: (item: { tableNumber: number }, monitor) => {
      if (containerRef.current && currentZone) {
        const offset = monitor.getClientOffset();
        const containerRect = containerRef.current.getBoundingClientRect();

        if (offset) {
          // Adjust for scaling
          let x = (offset.x - containerRect.left) / scale;
          let y = (offset.y - containerRect.top) / scale;

          // Constrain positions to container boundaries
          x = Math.max(0, Math.min(x, containerRect.width / scale));
          y = Math.max(0, Math.min(y, containerRect.height / scale));

          // Snap to a grid
          const newPosition = snapToGrid(x, y, 20);
          throttledMoveTable(item.tableNumber, currentZone.name, newPosition);
        }
      }
    },
  });

  // Cleanup throttled function on unmount
  useEffect(() => {
    return () => {
      throttledMoveTable.cancel();
    };
  }, [throttledMoveTable]);

  return (
    <section
      ref={(el) => {
        drop(el as HTMLDivElement);
        containerRef.current = el as HTMLDivElement;
      }}
      className="relative mb-24 flex flex-col items-center md:justify-center"
      aria-label={zoneName ? `Tables in ${zoneName}` : "All tables"}
    >
      {/* Zone Title */}
      {zoneName && (
        <div className="max-w-2xl mx-auto mb-2 mt-0 text-center">
          <h2 className="text-2xl font-bold text-gray-800">{zoneName}</h2>
        </div>
      )}

      {/* Floor Plan and Tables */}
      {currentZone?.floorPlanImage ? (
        <div
          className="relative w-full h-[900px] rounded-lg shadow-md overflow-hidden mb-6"
          style={{
            backgroundImage: `url(${currentZone.floorPlanImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            {filteredTables.map((table) => (
              <TableModal
                key={table.tableNumber}
                table={table}
                moveTable={moveTable}
                scale={scale}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTables.map((table) => (
            <TableModal
              key={table.tableNumber}
              table={table}
              moveTable={moveTable}
              scale={scale}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default React.memo(TablesSection);
