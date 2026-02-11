"use client";

import React, { useEffect, useState } from "react";
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

/**
 * Props:
 * - allAreas: an array of all available BasicArea objects
 *             so the user can choose from them.
 * - areaSelectID (optional): if there's already a connected area,
 *             we want to display it first as the default selection
 */
export interface AddTableModalProps {
  allAreas: BasicArea[];
  areaSelectID?: BasicArea | null;
}

const AddTableModal: React.FC<AddTableModalProps> = ({
  allAreas,
  areaSelectID,
}) => {
  // 1) Modal open/close
  const [isOpen, setIsOpen] = useState(false);

  // 2) Form fields
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [diners, setDiners] = useState<number>(2);
  const [posX, setPosX] = useState<number>(0);
  const [posY, setPosY] = useState<number>(0);

  // 3) If `areaSelectID` changes, update our local `selectedAreaId`
  //    so that area is pre-selected when the modal opens.
  useEffect(() => {
    if (areaSelectID?.id) {
      setSelectedAreaId(areaSelectID.id);
    }
  }, [areaSelectID]);

  // 4) GraphQL: addTable mutation
  const [{ fetching, error }, addTable] = useMutation<
    AddTableMutation,
    AddTableMutationVariables
  >(AddTableDocument);

  // 5) Re-fetch tables after adding a new table
  const [{}, reexecuteTablesQuery] = useQuery<GetTablesQuery>({
    query: GetTablesDocument,
    pause: true,
  });

  // Modal controls
  const openModal = () => {
    // Optionally pre-fill the first area if none is selected
    if (!selectedAreaId && allAreas.length > 0) {
      setSelectedAreaId(allAreas[0].id);
    }
    setIsOpen(true);
  };
  const closeModal = () => setIsOpen(false);

  // 6) Submit the form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAreaId) {
      toast.error("Please select an area before adding a table");
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

        // Reset fields
        setSelectedAreaId(areaSelectID?.id ?? "");
        setTableNumber(1);
        setDiners(2);
        setPosX(0);
        setPosY(0);

        closeModal();
        // Re-fetch to see newly created table
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
      {/* The button that triggers the modal */}
      <button
        type="button"
        onClick={openModal}
        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 text-sm px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition"
      >
        Add Table
      </button>

      {/* Modal content */}
      <Modal isOpen={isOpen} closeModal={closeModal}>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 w-[min(100vw-2rem,28rem)] max-w-md mx-auto p-4 sm:p-5 bg-white rounded-lg shadow-md max-h-[90vh] overflow-y-auto overscroll-contain"
        >
          {/* Mobile-friendly close button */}
          <button
            type="button"
            onClick={closeModal}
            className="ml-auto -mt-1 -mr-1 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>

          <h2 className="text-lg sm:text-xl font-bold text-gray-800 -mt-2">
            Add a New Table
          </h2>

          {/*
            7) A dropdown with all area names.
            Preselect the areaSelectID's id if present
          */}
          <div>
            <label
              htmlFor="areaDropdown"
              className="block text-sm font-medium mb-1"
            >
              Select an Area <span className="text-red-500">*</span>
            </label>
            <select
              id="areaDropdown"
              value={selectedAreaId}
              onChange={(e) => setSelectedAreaId(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
              required
            >
              <option value="">-- Choose an area --</option>
              {allAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          {/* Table Number */}
          <div>
            <label
              htmlFor="tableNumber"
              className="block text-sm font-medium mb-1"
            >
              Table Number <span className="text-red-500">*</span>
            </label>
            <input
              id="tableNumber"
              type="number"
              min={1}
              value={tableNumber}
              onChange={(e) => setTableNumber(Number(e.target.value))}
              placeholder="e.g. 1"
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
              required
            />
          </div>

          {/* Diners */}
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
              placeholder="e.g. 4"
              className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
              required
            />
          </div>

          {/* Position (X, Y) optional */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Position (optional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Error Display */}
          {error && (
            <p className="text-red-600 text-sm break-words">
              Something went wrong: {error.message}
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={closeModal}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={fetching}
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
