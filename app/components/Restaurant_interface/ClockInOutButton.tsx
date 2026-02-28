"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery } from "@urql/next";
import toast from "react-hot-toast";
import { HiOutlineClock } from "react-icons/hi2";
import {
  GetActiveClockInDocument,
  GetActiveClockInQuery,
  GetActiveClockInQueryVariables,
  ClockInDocument,
  ClockInMutation,
  ClockInMutationVariables,
  ClockOutDocument,
  ClockOutMutation,
  ClockOutMutationVariables,
} from "@/graphql/generated";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function ClockInOutButton() {
  const [elapsed, setElapsed] = useState<string>("00:00:00");

  // Server-authoritative clock-in state
  const [{ data, fetching: queryFetching }, reexecuteQuery] = useQuery<
    GetActiveClockInQuery,
    GetActiveClockInQueryVariables
  >({
    query: GetActiveClockInDocument,
    requestPolicy: "network-only",
  });

  const [{ fetching: clockingIn }, clockIn] = useMutation<
    ClockInMutation,
    ClockInMutationVariables
  >(ClockInDocument);

  const [{ fetching: clockingOut }, clockOut] = useMutation<
    ClockOutMutation,
    ClockOutMutationVariables
  >(ClockOutDocument);

  const activeEntry = data?.getActiveClockIn ?? null;
  const isClockedIn = !!activeEntry;
  const isBusy = clockingIn || clockingOut;

  // Elapsed timer — display only, calculated from server clockIn time
  useEffect(() => {
    if (!activeEntry?.clockIn) {
      setElapsed("00:00:00");
      return;
    }

    const clockInTime = new Date(activeEntry.clockIn).getTime();

    const update = () => {
      setElapsed(formatElapsed(Date.now() - clockInTime));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeEntry?.clockIn]);

  // Poll for multi-tab sync every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      reexecuteQuery({ requestPolicy: "network-only" });
    }, 60_000);
    return () => clearInterval(interval);
  }, [reexecuteQuery]);

  const handleClockIn = useCallback(async () => {
    const result = await clockIn({});
    if (result.error) {
      toast.error(result.error.message.replace("[GraphQL] ", ""));
    } else {
      toast.success("Clocked in successfully!");
      reexecuteQuery({ requestPolicy: "network-only" });
    }
  }, [clockIn, reexecuteQuery]);

  const handleClockOut = useCallback(async () => {
    const result = await clockOut({});
    if (result.error) {
      toast.error(result.error.message.replace("[GraphQL] ", ""));
    } else {
      const hours = result.data?.clockOut?.hoursWorked;
      toast.success(
        `Clocked out! ${hours ? `Total: ${hours.toFixed(1)}h` : ""}`
      );
      reexecuteQuery({ requestPolicy: "network-only" });
    }
  }, [clockOut, reexecuteQuery]);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Elapsed timer badge */}
      {isClockedIn && (
        <div className="rounded-full bg-gray-900 px-3 py-1 text-xs font-mono text-white shadow-lg">
          {elapsed}
        </div>
      )}

      {/* Clock In/Out button */}
      <button
        onClick={isClockedIn ? handleClockOut : handleClockIn}
        disabled={isBusy || queryFetching}
        className={`
          flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white shadow-xl
          transition-all duration-200 hover:scale-105 active:scale-95
          disabled:opacity-60 disabled:cursor-not-allowed
          ${
            isClockedIn
              ? "bg-red-600 hover:bg-red-700"
              : "bg-emerald-600 hover:bg-emerald-700"
          }
        `}
      >
        <HiOutlineClock className="h-5 w-5" />
        {isBusy
          ? "Processing..."
          : isClockedIn
            ? "Clock Out"
            : "Clock In"}
      </button>
    </div>
  );
}
