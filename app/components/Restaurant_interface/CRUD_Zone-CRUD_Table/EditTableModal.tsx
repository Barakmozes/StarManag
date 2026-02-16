"use client";

import React, { useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import Modal from "../../Common/Modal";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@urql/next";
import {
  EditTableDocument,
  EditTableMutation,
  EditTableMutationVariables,
  GetTablesDocument,
} from "@/graphql/generated";
import { Table } from "@prisma/client";
import { useRestaurantStore } from "@/lib/AreaStore";

interface EditTableModalProps {
  table: Table;
  open: boolean;
  onClose: () => void;
}

const EditTableModal: React.FC<EditTableModalProps> = ({ table, open, onClose }) => {
  
  const { areas, tables: storeTables } = useRestaurantStore();

  const existingNumbers = useMemo(() => {
    return new Set(storeTables.filter((t) => t.id !== table.id).map((t) => t.tableNumber));
  }, [storeTables, table.id]);

  const [areaId, setAreaId] = useState(table.areaId);
  const [tableNumber, setTableNumber] = useState<number>(table.tableNumber);
  const [diners, setDiners] = useState<number>(table.diners);
  const [reserved, setReserved] = useState<boolean>(table.reserved);
  const [position, setPosition] = useState<{ x: number; y: number }>(
    (table.position as any) || { x: 0, y: 0 }
  );

  const [{ fetching: updating }, editTable] = useMutation<EditTableMutation, EditTableMutationVariables>(
    EditTableDocument
  );

  const [, reexecuteTables] = useQuery({
    query: GetTablesDocument,
    pause: true,
  });

  const handleEditTable = async () => {
    if (existingNumbers.has(tableNumber)) {
      toast.error(`Table #${tableNumber} already exists. Choose another number.`);
      return;
    }

    try {
      const result = await editTable({
        editTableId: table.id,
        areaId,
        tableNumber,
        diners,
        reserved,
        position,
      });

      if (result.data?.editTable?.id) {
        toast.success("Table updated successfully!");
        reexecuteTables({ requestPolicy: "network-only" });
        onClose(); 
      } else if (result.error) {
        toast.error("Failed to update table: " + result.error.message);
      }
    } catch (error) {
      toast.error("Failed to update table.");
      console.error(error);
    }
  };

  return (
    <Modal isOpen={open} closeModal={onClose}>
      {/* שינוי 1: הרחבנו את המודל ל-max-w-4xl כדי שיהיה מקום לפרוס לרוחב 
         הוספנו w-full כדי שיתפוס מקום בטאבלטים
      */}
      <div className="relative w-full max-w-lg md:max-w-4xl mx-auto bg-white rounded-xl shadow overflow-hidden">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute z-50 right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
          aria-label="Close"
        >
          <span aria-hidden="true">×</span>
        </button>

        <div className="p-5 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
              <FaEdit className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Edit Table</h2>
              <p className="text-xs text-gray-500">Update table details and save.</p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditTable();
            }}
            /* שינוי 2: Grid Layout מתקדם
               במובייל: טור אחד (grid-cols-1)
               בטאבלט/מחשב: 12 עמודות (grid-cols-12) כדי לאפשר גמישות מקסימלית
            */
            className="grid grid-cols-1 md:grid-cols-12 gap-5"
          >
            
            {/* Area - תופס חצי רוחב (6 מתוך 12) במסכים גדולים */}
            <div className="md:col-span-6">
              <label htmlFor="areaDropdown" className="block text-sm font-medium text-gray-700 mb-1">
                Area
                <span className="text-gray-500 ml-1">*העבר שולחן לאזור אחר</span>
              </label>
              <select
                id="areaDropdown"
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
              >
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Reserved Checkbox - תופס חצי רוחב, מיושר לגובה השדה */}
            <div className="md:col-span-6 flex items-end">
               <div className="flex items-center gap-3 w-full min-h-[44px] px-3 border border-gray-200 rounded bg-gray-50/50">
                  <input
                    type="checkbox"
                    id="reserved"
                    checked={reserved}
                    onChange={(e) => setReserved(e.target.checked)}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-200"
                  />
                  <label htmlFor="reserved" className="text-sm font-medium text-gray-700 cursor-pointer flex-1 py-2">
                    Mark as Reserved
                  </label>
               </div>
            </div>

            {/* Table Number - שליש רוחב (4 מתוך 12) */}
            <div className="md:col-span-4">
              <label htmlFor="tableNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Table No.
              </label>
              <input
                id="tableNumber"
                type="number"
                min={1}
                value={tableNumber}
                onChange={(e) => setTableNumber(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
              />
              {existingNumbers.has(tableNumber) && (
                <p className="mt-1 text-xs text-red-600 absolute">Exists!</p>
              )}
            </div>

            {/* Diners - שליש רוחב */}
            <div className="md:col-span-4">
              <label htmlFor="diners" className="block text-sm font-medium text-gray-700 mb-1">
                Diners
              </label>
              <input
                id="diners"
                type="number"
                min={1}
                value={diners}
                onChange={(e) => setDiners(Number(e.target.value))}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
              />
            </div>

            {/* Position Group - תופס את השליש האחרון, מחולק פנימית ל-2 */}
            <div className="md:col-span-4">
               <label className="block text-sm font-medium text-gray-700 mb-1">
                Position (X / Y)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="X"
                  value={position.x}
                  onChange={(e) => setPosition({ ...position, x: Number(e.target.value) })}
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded text-center"
                />
                <input
                  type="number"
                  placeholder="Y"
                  value={position.y}
                  onChange={(e) => setPosition({ ...position, y: Number(e.target.value) })}
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded text-center"
                />
              </div>
            </div>

            {/* Footer Buttons - שורה שלמה למטה */}
            <div className="md:col-span-12 mt-4 pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto min-h-[44px] py-2 px-6 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating || existingNumbers.has(tableNumber)}
                className="w-full sm:w-auto min-h-[44px] py-2 px-6 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition disabled:bg-gray-400 shadow-sm"
              >
                {updating ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};

export default EditTableModal;