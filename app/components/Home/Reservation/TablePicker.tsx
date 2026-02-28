"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useMutation } from "@urql/next";
import toast from "react-hot-toast";
import { BsArrowRepeat, BsInbox } from "react-icons/bs";
import {
  GetAvailableTablesForReservationDocument,
  GetAvailableTablesForReservationQuery,
  GetAvailableTablesForReservationQueryVariables,
  GetAreaDocument,
  GetAreaQuery,
  GetAreaQueryVariables,
  AddWaitlistEntryDocument,
} from "@/graphql/generated";
import AreaFloorPreview from "./AreaFloorPreview";

type Props = {
  date: string;
  time: string;
  numOfDiners: number;
  areaId: string;
  areaName: string;
  userEmail: string;
  selectedTableId: string | null;
  onSelectTable: (tableId: string, tableNumber: number) => void;
  onBack: () => void;
  onNext: () => void;
  onBackToAreaPicker: () => void;
};

export default function TablePicker({
  date, time, numOfDiners, areaId, areaName, userEmail,
  selectedTableId, onSelectTable, onBack, onNext, onBackToAreaPicker,
}: Props) {
  const [joinedWaitlist, setJoinedWaitlist] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const [{ data, fetching, error }, reexecute] = useQuery<
    GetAvailableTablesForReservationQuery,
    GetAvailableTablesForReservationQueryVariables
  >({
    query: GetAvailableTablesForReservationDocument,
    variables: { date, time, numOfDiners, areaId },
  });

  const [{ data: areaData }] = useQuery<GetAreaQuery, GetAreaQueryVariables>({
    query: GetAreaDocument,
    variables: { getAreaId: areaId },
  });

  const [, addWaitlistEntry] = useMutation(AddWaitlistEntryDocument);

  const availableTables = data?.getAvailableTablesForReservation ?? [];
  const allTablesInArea = areaData?.getArea?.tables ?? [];
  const floorPlanImage = areaData?.getArea?.floorPlanImage ?? null;

  const availableIds = useMemo(
    () => new Set(availableTables.map((t) => t.id)),
    [availableTables]
  );

  const handleJoinWaitlist = async () => {
    setIsJoining(true);
    const t = toast.loading("Joining waitlist...");
    const res = await addWaitlistEntry({ userEmail, areaId, numOfDiners });
    setIsJoining(false);
    if (res.error) {
      toast.error(res.error.message, { id: t });
    } else {
      toast.success("You've been added to the waitlist!", { id: t });
      setJoinedWaitlist(true);
    }
  };

  if (error) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-red-600">{error.message}</p>
        <button
          onClick={() => reexecute({ requestPolicy: "network-only" })}
          className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
        >
          Try Again
        </button>
        <button onClick={onBack} className="block mx-auto text-sm text-gray-500 underline">
          Go Back
        </button>
      </div>
    );
  }

  const noTables = !fetching && availableTables.length === 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500">
          Tables in {areaName}
        </h3>
        {fetching && <BsArrowRepeat className="animate-spin text-gray-400" />}
      </div>

      {fetching && !data ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      ) : noTables ? (
        <div className="space-y-4">
          <div className="rounded-2xl border-2 border-dashed border-gray-200 py-10 text-center">
            <BsInbox size={36} className="mx-auto mb-2 text-gray-300" />
            <p className="font-bold text-gray-500">
              No tables available for this time slot in {areaName}
            </p>
          </div>

          {!joinedWaitlist ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onBackToAreaPicker}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50"
              >
                Try another area
              </button>
              <button
                type="button"
                disabled={isJoining}
                onClick={handleJoinWaitlist}
                className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-white shadow-md hover:bg-amber-600 disabled:opacity-60"
              >
                {isJoining ? "Joining..." : "Join the waitlist"}
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
              <p className="text-sm font-bold text-green-700">
                You&apos;re on the waitlist for {areaName}!
              </p>
              <a
                href="/user/reservations"
                className="mt-2 inline-block text-xs font-bold text-green-600 underline"
              >
                View My Reservations
              </a>
            </div>
          )}
        </div>
      ) : (
        <>
          <AreaFloorPreview
            tables={allTablesInArea as any[]}
            availableIds={availableIds}
            selectedTableId={selectedTableId}
            floorPlanImage={floorPlanImage}
            onSelect={onSelectTable}
          />

          <button
            type="button"
            disabled={!selectedTableId}
            onClick={onNext}
            className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-green-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next &mdash; Confirm Reservation
          </button>
        </>
      )}

      <button
        type="button"
        onClick={onBack}
        className="w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50"
      >
        &larr; Back
      </button>
    </div>
  );
}
