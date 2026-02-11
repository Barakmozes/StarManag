"use client";

import React, { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import Modal from "../../Common/Modal";
import { useMutation, useQuery } from "@urql/next";

import {
  BasicArea,
  DeleteAreaDocument,
  DeleteAreaMutation,
  DeleteAreaMutationVariables,
  GetAreasNameDescriptionDocument,
} from "@/graphql/generated";
import toast from "react-hot-toast";

type Props = {
  areas: BasicArea[];
  areaSelectToDelete: BasicArea;
};

/**
 * DeleteZoneModal
 * - Displays a dropdown of all areas.
 * - Sends a GraphQL mutation to remove the selected area.
 * - Re-fetches the areas so the UI updates immediately.
 */
const DeleteZoneModal = ({ areas, areaSelectToDelete }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");

  // GraphQL: re-fetch areas so updated info appears immediately
  const [{}, reexecuteQuery] = useQuery({
    query: GetAreasNameDescriptionDocument,
    pause: true,
    variables: {
      orderBy: { createdAt: "asc" },
    },
  });

  // GraphQL: Mutation to delete an area
  const [{ fetching: deleting }, deleteArea] = useMutation<
    DeleteAreaMutation,
    DeleteAreaMutationVariables
  >(DeleteAreaDocument);

  const openModal = () => {
    setSelectedAreaId(areaSelectToDelete?.id || "");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSelectedAreaId("");
  };

  // Handle the actual deletion
  const handleDelete = async () => {
    if (!selectedAreaId) return;
    try {
      const result = await deleteArea({ deleteAreaId: selectedAreaId });
      if (result.data?.deleteArea?.id) {
        toast.success("area  successfully Delete and updated!", { duration: 800 });
        reexecuteQuery({ requestPolicy: "network-only" });
      }
    } catch (error) {
      console.error("Error deleting area:", error);
      console.log(error);
    } finally {
      closeModal();
    }
  };

  return (
    <>
      {/* Trigger button (mobile friendly) */}
      <button
        type="button"
        onClick={openModal}
        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-700 transition"
        aria-label="Delete zone"
      >
        <HiOutlineTrash className="h-5 w-5" aria-hidden="true" />
        <span>Delete Zone</span>
      </button>

      {/* The Delete Confirmation Modal */}
      <Modal isOpen={isOpen} closeModal={closeModal}>
        <div className="relative w-[min(100vw-2rem,28rem)] max-w-md mx-auto bg-white rounded-lg shadow max-h-[90vh] overflow-y-auto overscroll-contain">
          {/* Close */}
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>

          <div className="p-4 sm:p-5 text-center">
            <HiOutlineTrash
              className="text-gray-400 w-11 h-11 mb-3.5 mx-auto"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Delete a Zone
            </h2>

            {/* Dropdown to select which area to delete */}
            <div className="mb-4 text-left">
              <label
                htmlFor="areaSelect"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Select Zone to Delete
              </label>
              <select
                id="areaSelect"
                value={selectedAreaId}
                onChange={(e) => setSelectedAreaId(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-red-200"
              >
                <option value="">-- Choose an area --</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="mb-4 text-sm text-gray-500">
              Are you sure you want to permanently delete this zone?
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-center items-stretch sm:items-center gap-2">
              <button
                onClick={closeModal}
                type="button"
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 focus:outline-none hover:text-gray-900 transition"
              >
                No, cancel
              </button>
              <button
                onClick={handleDelete}
                type="button"
                disabled={!selectedAreaId || deleting}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default DeleteZoneModal;
