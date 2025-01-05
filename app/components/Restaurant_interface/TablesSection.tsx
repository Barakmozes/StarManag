"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { useDrop } from "react-dnd";
import throttle from "lodash/throttle";
import { useMutation } from "@urql/next";

import TableModal from "./TableModal";
import { Table } from "@prisma/client";
import { BasicArea } from "@/graphql/generated";

import {
  MovePositionTableDocument,
  MovePositionTableMutation,
  MovePositionTableMutationVariables,
} from "@/graphql/generated";

export interface TablesSectionProps {
  areaSelect: BasicArea;
  filteredTables: Table[];
  scale: number;
  moveTable: (
    tableNum: number,
    newArea: string,
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

  const [_, movePositionTable] = useMutation<
    MovePositionTableMutation,
    MovePositionTableMutationVariables
  >(MovePositionTableDocument);

  const throttledMoveTable = useCallback(
    throttle(
      async (
        tableNumber: number,
        newArea: string,
        newPosition: { x: number; y: number }
      ) => {
        moveTable(tableNumber, newArea, newPosition);
        try {
          await movePositionTable({
            tableNumber: tableNumber,
            position: newPosition,
          });
        } catch (err) {
          console.error("Failed to update position in DB:", err);
        }
      },
      100,
      { leading: true, trailing: true }
    ),
    [moveTable, movePositionTable]
  );

  const snapToGrid = (x: number, y: number, gridSize: number) => ({
    x: Math.round(x / gridSize) * gridSize,
    y: Math.round(y / gridSize) * gridSize,
  });

  const [, drop] = useDrop({
    accept: "TABLE",
    drop: (item: { tableNumber: number }, monitor) => {
      if (!containerRef.current || !areaSelect?.name) return;

      const offset = monitor.getClientOffset();
      const containerRect = containerRef.current.getBoundingClientRect();

      if (offset) {
        let x = (offset.x - containerRect.left) / scale;
        let y = (offset.y - containerRect.top) / scale;

        x = Math.max(0, Math.min(x, containerRect.width / scale));
        y = Math.max(0, Math.min(y, containerRect.height / scale));

        const newPosition = snapToGrid(x, y, 5);
        throttledMoveTable(item.tableNumber, areaSelect.name, newPosition);
      }
    },
  });

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
      className="relative flex flex-col items-center justify-center px-4 mb-2"
      aria-label={areaSelect.name ? `Tables in ${areaSelect.name}` : "All tables"}
    >
      {areaSelect.name && (
        <div className="flex items-center max-w-2xl mx-auto mb-1 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
            {areaSelect.name}
          </h2>
        </div>
      )}

      {areaSelect.floorPlanImage ? (
        <div
          className="relative w-full h-[100vh] rounded-lg shadow-md break-all mb-6"
          style={{
            backgroundImage: `url(${areaSelect.floorPlanImage})`,
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
      ) : (
        <div className="grid gap-4 w-full sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredTables.map((table) => (
            <TableModal key={table.id} table={table} scale={scale} />
          ))}
        </div>
      )}
    </section>
  );
};

export default React.memo(TablesSection);
