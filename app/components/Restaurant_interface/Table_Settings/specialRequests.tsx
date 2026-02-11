"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@urql/next";
import toast from "react-hot-toast";

import {
  EditTableDocument,
  EditTableMutation,
  EditTableMutationVariables,
  GetTablesDocument,
} from "@/graphql/generated";
import { Table } from "@prisma/client";

/**
 * SpecialRequestsProps:
 *  - table: The Table object that has:
 *      - .id (string)
 *      - .specialRequests (string[])
 */
interface SpecialRequestsProps {
  table: Table;
}

/**
 * SpecialRequests
 * - Manages ONLY the `specialRequests` field for a specific table.
 * - Provides UI to add/remove requests, then save them to the DB.
 */
const SpecialRequests: React.FC<SpecialRequestsProps> = ({ table }) => {
  // 1) Local array of requests, initially from table.specialRequests
  const [localRequests, setLocalRequests] = useState<string[]>(
    table.specialRequests || []
  );
  // 2) Local input state for the new request
  const [newRequest, setNewRequest] = useState("");

  // GraphQL partial update: reusing `editTable` for specialRequests
  const [{ fetching: isUpdating }, editTable] = useMutation<
    EditTableMutation,
    EditTableMutationVariables
  >(EditTableDocument);

  // Optionally re-fetch the main table list so everything is in sync
  const [{}, reexecuteTables] = useQuery({
    query: GetTablesDocument,
    pause: true,
  });

  /**
   * Handle adding a new request to the local list
   */
  const handleAddRequest = () => {
    const trimmed = newRequest.trim();
    if (!trimmed) return; // ignore empty
    setLocalRequests((prev) => [...prev, trimmed]);
    setNewRequest(""); // clear the input
  };

  /**
   * Remove a request by index
   */
  const handleRemoveRequest = (index: number) => {
    setLocalRequests((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Save the updated requests to DB (partial update of `editTable`)
   */
  const handleSaveRequests = async () => {
    try {
      const result = await editTable({
        editTableId: table.id, // table's ID is required
        specialRequests: localRequests,
      });

      if (result.data?.editTable) {
        toast.success("Special requests updated!", { duration: 1200 });
        reexecuteTables({ requestPolicy: "network-only" });
      } else if (result.error) {
        toast.error("Failed to update requests: " + result.error.message, {
          duration: 3000,
        });
      }
    } catch (err) {
      console.error("Error updating special requests:", err);
      toast.error("Unexpected error updating special requests.");
    }
  };

  return (
    <div className="mt-2 w-full">
      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-700 mb-1">
        Special Requests
      </h3>

      {/* Current requests list (scrollable if large) */}
      <ul className="mb-2 space-y-1 text-xs sm:text-sm max-h-32 sm:max-h-36 overflow-y-auto pr-1">
        {localRequests.map((req, index) => (
          <li
            key={index}
            className="flex items-start justify-between gap-2 bg-gray-100 px-2 py-2 rounded"
          >
            <span className="flex-1 break-words">{req}</span>
            <button
              type="button"
              onClick={() => handleRemoveRequest(index)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 transition"
              aria-label="Remove request"
            >
              <span aria-hidden="true">×</span>
            </button>
          </li>
        ))}
      </ul>

      {/* Input + "Add" button */}
      <div className="flex flex-col sm:flex-row items-stretch gap-2">
        <input
          type="text"
          value={newRequest}
          onChange={(e) => setNewRequest(e.target.value)}
          placeholder="Add a new request..."
          className="w-full min-h-[44px] px-3 py-2 text-sm rounded border border-gray-300 focus:ring focus:ring-blue-200"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddRequest();
            }
          }}
          aria-label="New special request"
        />
        <button
          type="button"
          onClick={handleAddRequest}
          className="w-full sm:w-auto min-h-[44px] text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          aria-label="Add request"
        >
          Add
        </button>
      </div>

      {/* Save Requests button */}
      <button
        type="button"
        onClick={handleSaveRequests}
        disabled={isUpdating}
        className={`mt-2 w-full min-h-[44px] px-4 py-2 text-sm font-medium rounded transition ${
          isUpdating
            ? "bg-gray-400 cursor-not-allowed text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
        aria-label="Save special requests"
      >
        {isUpdating ? "Updating..." : "Save Requests"}
      </button>
    </div>
  );
};

export default SpecialRequests;
