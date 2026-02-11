"use client";

import React, { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import Modal from "../../Common/Modal";
import { useMutation, useQuery } from "@urql/next";
import { Table } from "@prisma/client";
import {
  DeleteTableDocument,
  DeleteTableMutation,
  DeleteTableMutationVariables,
  GetTablesDocument,
} from "@/graphql/generated";
import toast from "react-hot-toast";

interface DeleteTableModalProps {
  /** The table object to be deleted */
  table: Table;
}

const DeleteTableModal: React.FC<DeleteTableModalProps> = ({ table }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Prepare re-fetch of all tables (so we see immediate update after deletion)
  const [{}, reexecuteTables] = useQuery({
    query: GetTablesDocument,
    pause: true,
  });

  // Mutation to delete a table
  const [{ fetching: deleting }, deleteTable] = useMutation<
    DeleteTableMutation,
    DeleteTableMutationVariables
  >(DeleteTableDocument);

  // Open/close the modal
  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  // Handle the actual deletion
  const handleDelete = async () => {
    try {
      const result = await deleteTable({ deleteTableId: table.id });

      if (result.data?.deleteTable?.tableNumber !== undefined) {
        // Show success toast
        toast.success(
          `Table #${result.data.deleteTable.tableNumber} deleted successfully!`,
          { duration: 1200 }
        );
        // Re-fetch all tables
        reexecuteTables({ requestPolicy: "network-only" });
      }
    } catch (error) {
      console.error("Error deleting table:", error);
      toast.error("Failed to delete table.");
    } finally {
      closeModal();
    }
  };

  return (
    <>
      {/* Trigger (touch-friendly icon button) */}
      <button
        type="button"
        onClick={openModal}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
        aria-label={`Delete table #${table.tableNumber}`}
        title={`Delete table #${table.tableNumber}`}
      >
        <HiOutlineTrash className="h-5 w-5" aria-hidden="true" />
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
              className="text-gray-400 w-12 h-12 mb-3.5 mx-auto"
              aria-hidden="true"
            />
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Delete Table #{table.tableNumber}
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Are you sure you want to permanently delete this table?
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row justify-center items-stretch sm:items-center gap-2">
              <button
                onClick={closeModal}
                type="button"
                className="w-full sm:w-auto min-h-[44px] py-2 px-4 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:outline-none transition"
              >
                No, cancel
              </button>
              <button
                onClick={handleDelete}
                type="button"
                disabled={deleting}
                className="w-full sm:w-auto min-h-[44px] py-2 px-4 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
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

export default DeleteTableModal;
