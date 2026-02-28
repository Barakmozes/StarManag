"use client";

import React from "react";
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
  /** Controls if the modal is visible */
  open: boolean;
  /** Function to close the modal (called on cancel or success) */
  onClose: () => void;
}

const DeleteTableModal: React.FC<DeleteTableModalProps> = ({ table, open, onClose }) => {
  
  // Prepare re-fetch of all tables
  const [{}, reexecuteTables] = useQuery({
    query: GetTablesDocument,
    pause: true,
  });

  // Mutation to delete a table
  const [{ fetching: deleting }, deleteTable] = useMutation<
    DeleteTableMutation,
    DeleteTableMutationVariables
  >(DeleteTableDocument);

  // Handle the actual deletion
  const handleDelete = async () => {
    try {
      const result = await deleteTable({ deleteTableId: table.id });

      if (result.data?.deleteTable?.tableNumber !== undefined) {
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
      // Close the modal regardless of success/failure
      onClose();
    }
  };

  return (
    // Note: The trigger button was removed. The visibility is controlled solely by 'open'.
    <Modal isOpen={open} closeModal={onClose}>
      <div className="relative w-[min(100vw-2rem,28rem)] max-w-md mx-auto bg-white rounded-lg shadow max-h-[90vh] overflow-y-auto overscroll-contain">
        {/* Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
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
              onClick={onClose}
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
  );
};

export default DeleteTableModal;