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

type TableSheetProps = {
  open: boolean;
  table: TableInStore | null;
  areaName?: string;
  onClose: () => void;
};

/**
 * Mobile-first “Inspector” bottom sheet:
 * - Tap a table to open
 * - All actions are here (reserve, order, requests, reservations, edit/delete)
 * This keeps table cards clean and usable on phones.
 */
const TableSheet: React.FC<TableSheetProps> = ({
  open,
  table,
  areaName,
  onClose,
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

  const reserved = table.reserved;
  const specialCount = table.specialRequests?.length ?? 0;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close table panel"
      />

      <div className="absolute inset-x-0 bottom-0 max-h-[86dvh] overflow-auto rounded-t-2xl bg-white shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-gray-100">
          <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={
                    "inline-flex h-2.5 w-2.5 rounded-full " +
                    (reserved ? "bg-red-500" : "bg-green-500")
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
                {specialCount > 0 && (
                  <>
                    <span className="text-gray-400"> · </span>
                    <span className="text-amber-700 font-medium">
                      {specialCount} request{specialCount === 1 ? "" : "s"}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* <EditTableModal table={prismaTable} />
              <DeleteTableModal table={prismaTable} /> */}
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
                Use <span className="font-medium">Layout: Edit</span> mode to move tables.
              </li>
              <li>
                After moving tables, press <span className="font-medium">Save</span>.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TableSheet);
