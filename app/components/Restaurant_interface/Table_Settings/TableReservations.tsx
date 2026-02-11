"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useQuery } from "@urql/next";
import { Table } from "@prisma/client";
import toast from "react-hot-toast";
import { FaCalendarCheck } from "react-icons/fa";
import Modal from "../../Common/Modal";

import {
  GetTableReservationsDocument,
  GetTableReservationsQuery,
  GetTableReservationsQueryVariables,
} from "@/graphql/generated";

/**
 * Props:
 *  - table: The table object, including table.id and table.tableNumber
 */
interface TableReservationsProps {
  table: Table;
}

/**
 * TableReservations
 *
 * Shows a button to open a modal. When opened *the first time*,
 * it fetches reservations for "today" (by default) and displays them
 * if found. The user can also pick another date to fetch more data.
 */
const TableReservations: React.FC<TableReservationsProps> = ({ table }) => {
  // -- Local states --
  const todayString = new Date().toISOString().split("T")[0]; // e.g. "2025-01-10"
  const [selectedDate, setSelectedDate] = useState<string>(todayString);
  const [isOpen, setIsOpen] = useState(false);

  /**
   * We only want to fetch automatically on the *first open* of the modal.
   * Use a flag to ensure we don't re-run this logic on subsequent opens.
   */
  const [didFirstOpen, setDidFirstOpen] = useState(false);

  // GraphQL: We start paused = true (so it won't fetch on mount).
  const [resResult, reexecuteQuery] = useQuery<
    GetTableReservationsQuery,
    GetTableReservationsQueryVariables
  >({
    query: GetTableReservationsDocument,
    variables: { date: selectedDate, tableId: table.id },
    pause: true,
  });

  const { data, fetching, error } = resResult;

  /**
   * On first open, run the query once.
   * If user re-opens the modal after closing, no auto-fetch.
   */
  const openModal = useCallback(() => {
    setIsOpen(true);
    if (!didFirstOpen) {
      // On first open, load the reservations for today's date
      reexecuteQuery({ requestPolicy: "network-only" });
      setDidFirstOpen(true);
    }
  }, [didFirstOpen, reexecuteQuery]);

  const closeModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * If user changes date inside the modal, they can re-fetch manually if desired.
   */
  const handleFetchReservations = useCallback(() => {
    reexecuteQuery({ requestPolicy: "network-only" });
  }, [reexecuteQuery]);

  // Show error if any
  useEffect(() => {
    if (error) {
      toast.error("Failed to load reservations: " + error.message);
    }
  }, [error]);

  /**
   * Format date/time in a user-friendly manner
   */
  const formatDateTime = (isoString: string) => {
    try {
      const dateObj = new Date(isoString);
      return dateObj.toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch {
      return isoString;
    }
  };

  /**
   * Renders the reservations in a mobile card list or a desktop table
   */
  const renderReservations = () => {
    if (fetching) {
      return (
        <p className="text-sm text-blue-500 mt-2">Loading reservations...</p>
      );
    }

    if (!data?.getTableReservations || data.getTableReservations.length === 0) {
      return (
        <p className="text-sm text-gray-500 mt-3">
          No reservations found for {selectedDate}.
        </p>
      );
    }

    return (
      <div className="mt-3">
        {/* Mobile: stacked cards */}
        <div className="space-y-3 sm:hidden">
          {data.getTableReservations.map((res) => {
            const dateDisplay = formatDateTime(res.reservationTime);
            return (
              <div
                key={res.id}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 break-words">
                      {dateDisplay}
                    </p>
                    <p className="text-xs text-gray-500">
                      Diners:{" "}
                      <span className="text-gray-700">{res.numOfDiners}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    {res.status}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500">Created By</dt>
                    <dd className="text-gray-800 break-words text-right">
                      {res.createdBy}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500">User Email</dt>
                    <dd className="text-gray-800 break-words text-right">
                      {res.userEmail}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500">Name</dt>
                    <dd className="text-gray-800 break-words text-right">
                      {res.user?.profile?.name ?? "-"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-gray-500">Phone</dt>
                    <dd className="text-gray-800 break-words text-right">
                      {res.user?.profile?.phone ?? "-"}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 text-xs text-gray-500 break-all">
                  Reservation ID: {res.id}
                </p>
              </div>
            );
          })}
        </div>

        {/* Desktop: table with horizontal scroll */}
        <div className="hidden sm:block overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border-b border-gray-200 text-left">
                  Reservation Time
                </th>
                <th className="p-2 border-b border-gray-200 text-left">
                  Diners
                </th>
                <th className="p-2 border-b border-gray-200 text-left">
                  Status
                </th>
                <th className="p-2 border-b border-gray-200 text-left">
                  Created By
                </th>
                <th className="p-2 border-b border-gray-200 text-left">
                  User Email
                </th>
                <th className="p-2 border-b border-gray-200 text-left">Name</th>
                <th className="p-2 border-b border-gray-200 text-left">
                  Phone
                </th>
                <th className="p-2 border-b border-gray-200 text-left">
                  Reservation ID
                </th>
              </tr>
            </thead>
            <tbody>
              {data.getTableReservations.map((res) => {
                const dateDisplay = formatDateTime(res.reservationTime);
                return (
                  <tr key={res.id} className="hover:bg-gray-50">
                    <td className="p-2 border-b border-gray-100 whitespace-nowrap">
                      {dateDisplay}
                    </td>
                    <td className="p-2 border-b border-gray-100">
                      {res.numOfDiners}
                    </td>
                    <td className="p-2 border-b border-gray-100">
                      {res.status}
                    </td>
                    <td className="p-2 border-b border-gray-100">
                      {res.createdBy}
                    </td>
                    <td className="p-2 border-b border-gray-100">
                      {res.userEmail}
                    </td>
                    <td className="p-2 border-b border-gray-100">
                      {res.user?.profile?.name ?? "-"}
                    </td>
                    <td className="p-2 border-b border-gray-100">
                      {res.user?.profile?.phone ?? "-"}
                    </td>
                    <td className="p-2 border-b border-gray-100">{res.id}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* The trigger button */}
      <button
        type="button"
        onClick={openModal}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-50 px-2 py-1 text-xs sm:text-sm font-medium text-blue-700 hover:bg-blue-100 transition"
        aria-label="View Reservations"
      >
        <FaCalendarCheck className="h-4 w-4" aria-hidden="true" />
        <span className="whitespace-nowrap">Reservations</span>
      </button>

      {/* The modal */}
      <Modal isOpen={isOpen} closeModal={closeModal}>
        <div className="relative w-[min(100vw-2rem,64rem)] max-w-5xl mx-auto bg-white rounded-lg shadow max-h-[90vh] overflow-y-auto overscroll-contain">
          {/* Close */}
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>

          <div className="p-4 sm:p-6">
            {/* Title */}
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 pr-10">
              Table #{table.tableNumber} Reservations
            </h2>

            {/* Date + Search row */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-end gap-2">
              <div className="w-full sm:w-auto">
                <label
                  className="block text-sm font-medium text-gray-700 mb-1"
                  htmlFor={`reservationDate-${table.id}`}
                >
                  Date
                </label>
                <input
                  id={`reservationDate-${table.id}`}
                  type="date"
                  className="w-full sm:w-auto min-h-[44px] px-3 py-2 border rounded text-sm"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  aria-label="Select date"
                />
              </div>
              <button
                type="button"
                onClick={handleFetchReservations}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition"
              >
                Search
              </button>
            </div>

            {/* Table or empty/loading state */}
            {renderReservations()}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TableReservations;
