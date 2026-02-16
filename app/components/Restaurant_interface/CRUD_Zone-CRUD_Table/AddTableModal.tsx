"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@urql/next";
import toast from "react-hot-toast";

import Modal from "../../Common/Modal";
import {
  AddTableDocument,
  AddTableMutation,
  AddTableMutationVariables,
  GetTablesDocument,
  GetTablesQuery,
  BasicArea,
} from "@/graphql/generated";
import { useRestaurantStore } from "@/lib/AreaStore";

export interface AddTableModalProps {
  allAreas: BasicArea[];
  areaSelectID?: BasicArea | null;
}

const AddTableModal: React.FC<AddTableModalProps> = ({ allAreas, areaSelectID }) => {
  const [isOpen, setIsOpen] = useState(false);

  const storeTables = useRestaurantStore((s) => s.tables);

  const existingNumbers = useMemo(() => {
    return new Set(storeTables.map((t) => t.tableNumber));
  }, [storeTables]);

  const suggestedNextNumber = useMemo(() => {
    const nums = storeTables.map((t) => t.tableNumber);
    const max = nums.length ? Math.max(...nums) : 0;
    return max + 1;
  }, [storeTables]);

  // Form fields
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [diners, setDiners] = useState<number>(2);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);

  useEffect(() => {
    if (areaSelectID?.id) setSelectedAreaId(areaSelectID.id);
  }, [areaSelectID]);

  const [{ fetching, error }, addTable] = useMutation<AddTableMutation, AddTableMutationVariables>(
    AddTableDocument
  );

  const [, reexecuteTablesQuery] = useQuery<GetTablesQuery>({
    query: GetTablesDocument,
    pause: true,
  });

  const openModal = () => {
    const defaultArea = areaSelectID?.id || allAreas[0]?.id || "";
    setSelectedAreaId(defaultArea);
    setTableNumber(suggestedNextNumber || 1);
    setDiners(2);
    setPosX(0);
    setPosY(0);
    setIsOpen(true);
  };

  const closeModal = () => setIsOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAreaId) {
      toast.error("Please select a zone before adding a table");
      return;
    }

    if (existingNumbers.has(tableNumber)) {
      toast.error(`Table #${tableNumber} already exists. Choose another number.`);
      return;
    }

    try {
      const result = await addTable({
        areaId: selectedAreaId,
        diners,
        position: { x: posX, y: posY },
        tableNumber,
      });

      if (result.data?.addTable?.id) {
        toast.success(`Table #${result.data.addTable.tableNumber} created!`);
        closeModal();
        reexecuteTablesQuery({ requestPolicy: "network-only" });
      } else if (result.error) {
        toast.error("Failed to create table: " + result.error.message);
      }
    } catch (err) {
      console.error("Failed to create table:", err);
      toast.error("Failed to create table. See console for details.");
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 text-sm px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition"
      >
        Add Table
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal}>
        <form
          onSubmit={handleSubmit}
className="relative w-full max-w-lg md:max-w-4xl mx-auto bg-white rounded-xl shadow overflow-hidden"        >
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>

          <h2 className="text-lg sm:text-xl font-bold text-gray-800 pr-10">Add a New Table</h2>
          <p className="mt-1 text-sm text-gray-500">
            Tip: table numbers must be unique across the restaurant.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="areaDropdown" className="block text-sm font-medium mb-1">
                Select a Zone <span className="text-red-500">*</span>
              </label>
              <select
                id="areaDropdown"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                required
              >
                <option value="">-- Choose a zone --</option>
                {allAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="tableNumber" className="block text-sm font-medium mb-1">
                  Table Number <span className="text-red-500">*</span>
                </label>
                <input
                  id="tableNumber"
                  type="number"
                  min={1}
                  value={tableNumber}
                  onChange={(e) => setTableNumber(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                  required
                />
                {existingNumbers.has(tableNumber) && (
                  <p className="mt-1 text-xs text-red-600">This number already exists.</p>
                )}
              </div>

              <div>
                <label htmlFor="diners" className="block text-sm font-medium mb-1">
                  Diners <span className="text-red-500">*</span>
                </label>
                <input
                  id="diners"
                  type="number"
                  min={1}
                  value={diners}
                  onChange={(e) => setDiners(Number(e.target.value))}
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Initial Position (optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="posX" className="block text-xs font-medium mb-1">
                    X
                  </label>
                  <input
                    id="posX"
                    type="number"
                    value={posX}
                    onChange={(e) => setPosX(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                  />
                </div>
                <div>
                  <label htmlFor="posY" className="block text-xs font-medium mb-1">
                    Y
                  </label>
                  <input
                    id="posY"
                    type="number"
                    value={posY}
                    onChange={(e) => setPosY(Number(e.target.value))}
                    className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                  />
                </div>
              </div>
            </div>

            {error && <p className="text-red-600 text-sm break-words">Error: {error.message}</p>}
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={fetching || existingNumbers.has(tableNumber)}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {fetching ? "Adding..." : "Add Table"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AddTableModal;
