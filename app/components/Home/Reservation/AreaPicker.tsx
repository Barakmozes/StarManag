"use client";

import React from "react";
import { useQuery } from "@urql/next";
import Image from "next/image";
import { BsGeoAlt, BsArrowRepeat } from "react-icons/bs";
import {
  GetAreasWithAvailabilityDocument,
  GetAreasWithAvailabilityQuery,
  GetAreasWithAvailabilityQueryVariables,
} from "@/graphql/generated";

type Props = {
  date: string;
  time: string;
  numOfDiners: number;
  onSelectArea: (areaId: string, areaName: string) => void;
  onBack: () => void;
};

export default function AreaPicker({ date, time, numOfDiners, onSelectArea, onBack }: Props) {
  const [{ data, fetching, error }, reexecute] = useQuery<
    GetAreasWithAvailabilityQuery,
    GetAreasWithAvailabilityQueryVariables
  >({
    query: GetAreasWithAvailabilityDocument,
    variables: { date, time, numOfDiners },
  });

  const areas = data?.getAreasWithAvailability ?? [];

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500">
          Available areas for {numOfDiners} guests on {date} at {time}
        </h3>
        {fetching && <BsArrowRepeat className="animate-spin text-gray-400" />}
      </div>

      {fetching && !data ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border bg-white p-4">
              <div className="mb-3 h-24 rounded-xl bg-gray-200" />
              <div className="h-5 w-32 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-20 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : areas.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
          <BsGeoAlt size={36} className="mx-auto mb-2 text-gray-300" />
          <p className="font-bold text-gray-400">No areas available for this time</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {areas.map((area) => {
            const hasAvailability = area.availableTables > 0;
            return (
              <button
                key={area.id}
                type="button"
                disabled={!hasAvailability}
                onClick={() => onSelectArea(area.id, area.name)}
                className={`group rounded-2xl border p-4 text-left transition-all ${
                  hasAvailability
                    ? "border-gray-200 bg-white hover:border-green-300 hover:shadow-md"
                    : "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                }`}
              >
                {area.floorPlanImage && (
                  <div className="relative mb-3 h-24 overflow-hidden rounded-xl bg-gray-100">
                    <Image
                      src={area.floorPlanImage}
                      alt={area.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 50vw"
                    />
                  </div>
                )}
                <h4 className="text-base font-bold text-gray-800">{area.name}</h4>
                {area.description && (
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{area.description}</p>
                )}
                <p className={`mt-2 text-xs font-bold ${hasAvailability ? "text-green-600" : "text-red-400"}`}>
                  {hasAvailability
                    ? `${area.availableTables} of ${area.totalTables} tables available`
                    : "Fully booked"}
                </p>
              </button>
            );
          })}
        </div>
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
