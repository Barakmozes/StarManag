"use client";

import React, { useRef, useEffect, useMemo } from "react";

import { useDrop } from "react-dnd";
import throttle from "lodash/throttle";
import TableModal from "./TableModal";
import { BasicArea } from "@/graphql/generated";
import { TableInStore } from "@/lib/AreaStore";

export interface TablesSectionProps {
  areaSelect: BasicArea;
  filteredTables: TableInStore[];
  scale: number;
  /**
   * Now expects (tableId: string, newAreaId: string, newPos: { x: number; y: number })
   * for local store updates or anything else.
   */
  moveTable: (
    tableId: string,
    newAreaId: string,
    newPos: { x: number; y: number }
  ) => void;
}

const TablesSection: React.FC<TablesSectionProps> = ({
  areaSelect,
  filteredTables,
  scale,
  moveTable,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Throttle "moveTable"
const throttledMoveTable = useMemo(() => {
  return throttle(
    (tableId: string, newAreaId: string, newPosition: { x: number; y: number }) => {
      moveTable(tableId, newAreaId, newPosition);
    },
    100
  );
}, [moveTable]);

  // Snap to 5px grid
  const snapToGrid = (x: number, y: number, gridSize: number) => ({
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  });

  // React DnD
  const [, drop] = useDrop({
    accept: "TABLE",
    drop: (item: { tableId: string }, monitor) => {
      if (!containerRef.current || !areaSelect?.id) return;

      const offset = monitor.getClientOffset();
      if (!offset) return;

      const containerEl = containerRef.current;
      const containerRect = containerEl.getBoundingClientRect();

      // Account for internal scroll when the canvas is pannable
      const scrollLeft = containerEl.scrollLeft;
      const scrollTop = containerEl.scrollTop;

      let x = (offset.x - containerRect.left + scrollLeft) / scale;
      let y = (offset.y - containerRect.top + scrollTop) / scale;

      // Clamp within the container's scrollable area
      const maxX = containerEl.scrollWidth / scale;
      const maxY = containerEl.scrollHeight / scale;

      x = Math.max(0, Math.min(x, maxX));
      y = Math.max(0, Math.min(y, maxY));

      const newPosition = snapToGrid(x, y, 5);

      throttledMoveTable(item.tableId, areaSelect.id, newPosition);
    },
  });

  // Cancel throttling on unmount
  useEffect(() => {
    return () => {
      throttledMoveTable.cancel();
    };
  }, [throttledMoveTable]);

  return (
    <section
      className="relative flex flex-col items-stretch px-3 sm:px-4 mb-2"
      aria-label={areaSelect.name ? `Tables in ${areaSelect.name}` : "All tables"}
    >
      {areaSelect.name && (
        <div className="max-w-2xl mx-auto mb-2 sm:mb-3 text-center px-2">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-800 break-words">
            {areaSelect.name}
          </h2>
        </div>
      )}

      {/*
        Floor plan canvas
        - Mobile-first height to avoid 100vh issues
        - Internal scroll/pan is deliberate and helps access content on small screens
      */}
      <div
        ref={(el) => {
          drop(el as HTMLDivElement);
          containerRef.current = el as HTMLDivElement;
        }}
        className="relative w-full h-[70vh] sm:h-[80vh] lg:h-[100vh] rounded-lg shadow-md mb-6 overflow-auto overscroll-contain touch-pan-x touch-pan-y"
        style={{
          backgroundImage: `url(${"/img/pexels-pixabay-235985.jpg"})`,
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
            <TableModal key={table.id} table={table} scale={scale} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default React.memo(TablesSection);
