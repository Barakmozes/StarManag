"use client";

import React, { useEffect, useMemo } from "react";
import { Table as PrismaTable } from "@prisma/client";
import { TableInStore } from "@/lib/AreaStore";

import ToggleReservation from "./Table_Settings/ToggleReservation";
import TableReservations from "./Table_Settings/TableReservations";
import SpecialRequests from "./Table_Settings/specialRequests";
import Start_an_order from "./Table_Settings/Start_an_order_Table";

import EditTableModal from "./CRUD_Zone-CRUD_Table/EditTableModal";
import DeleteTableModal from "./CRUD_Zone-CRUD_Table/DeleteTableModal";

type TableInspectorProps = {
  open: boolean;
  table: TableInStore | null;
  areaName?: string;
  isEditMode: boolean;
  isLocked: boolean;
  isSelected: boolean;
  selectedCount: number;
  onClose: () => void;
  onToggleLock: () => void;
  onToggleSelect: () => void;
  onClearSelection: () => void;
};

/**
 * TableInspector
 * - Mobile: Bottom sheet
 * - Desktop: Right drawer
 */
const TableInspector: React.FC<TableInspectorProps> = ({
  open,
  table,
  areaName,
  isEditMode,
  isLocked,
  isSelected,
  selectedCount,
  onClose,
  onToggleLock,
  onToggleSelect,
  onClearSelection,
}) => {
  const prismaTable = useMemo(
    () => (table ? (table as unknown as PrismaTable) : null),
    [table]
  );

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !table || !prismaTable) return null;

  const unpaidCount = table.unpaidOrdersCount ?? 0;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close table inspector"
      />

      <div
        className={
          "absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-auto rounded-t-2xl bg-white shadow-2xl pb-[env(safe-area-inset-bottom)] " +
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:max-h-none sm:w-[420px] sm:rounded-none sm:rounded-l-2xl"
        }
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={
                    "inline-flex h-2.5 w-2.5 rounded-full " +
                    (table.reserved ? "bg-red-500" : "bg-green-500")
                  }
                  aria-hidden="true"
                />
                <h3 className="text-base font-bold text-gray-900 truncate">
                  Table #{table.tableNumber}
                </h3>
                {table.dirty && (
                  <span className="text-xs font-semibold text-red-500">*</span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-600">
                <span className="font-medium text-gray-700">
                  {areaName || "Zone"}
                </span>
                <span className="text-gray-400"> · </span>
                <span>{table.diners} diners</span>

                {unpaidCount > 0 && (
                  <>
                    <span className="text-gray-400"> · </span>
                    <span className="text-amber-800 font-semibold">
                      {unpaidCount} unpaid
                    </span>
                  </>
                )}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                {isEditMode && (
                  <button
                    type="button"
                    onClick={onToggleSelect}
                    className={
                      "min-h-[36px] rounded-lg px-3 text-xs font-semibold border transition " +
                      (isSelected
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50")
                    }
                  >
                    {isSelected ? "Selected" : "Select"}
                  </button>
                )}

                {isEditMode && (
                  <button
                    type="button"
                    onClick={onToggleLock}
                    className={
                      "min-h-[36px] rounded-lg px-3 text-xs font-semibold border transition " +
                      (isLocked
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-800 border-gray-200 hover:bg-gray-50")
                    }
                  >
                    {isLocked ? "Locked" : "Lock layout"}
                  </button>
                )}

                {selectedCount > 1 && (
                  <button
                    type="button"
                    onClick={onClearSelection}
                    className="min-h-[36px] rounded-lg px-3 text-xs font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200"
                  >
                    Clear selection ({selectedCount})
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
            

              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] rounded-lg bg-gray-100 px-3 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            <ToggleReservation table={prismaTable} />
            <Start_an_order table={prismaTable} />
            <TableReservations table={prismaTable} />
            <SpecialRequests table={prismaTable} />
          </div>

          <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
            <p className="font-medium text-gray-800">Tips</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Pinch to zoom, drag the background to pan.</li>
              <li>
                Use <span className="font-medium">Layout: Edit</span> to move tables.
              </li>
              <li>
                Long-press a table to add it to multi‑select.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TableInspector);
