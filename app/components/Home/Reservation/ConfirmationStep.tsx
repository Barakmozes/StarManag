"use client";

import React from "react";
import {
  BsCalendarDate, BsClock, BsPeople, BsGeoAlt, BsCheckCircleFill,
} from "react-icons/bs";

type Props = {
  date: string;
  time: string;
  partySize: number;
  areaName: string;
  tableNumber: number;
  isSubmitting: boolean;
  onConfirm: () => void;
  onBack: () => void;
};

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default function ConfirmationStep({
  date, time, partySize, areaName, tableNumber,
  isSubmitting, onConfirm, onBack,
}: Props) {
  const dt = new Date(`${date}T${time}:00`);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-green-800">
          <BsCheckCircleFill />
          Reservation Summary
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm">
            <BsCalendarDate className="mt-0.5 text-green-600" size={18} />
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Date</p>
              <p className="text-sm font-bold text-gray-800">{dateFmt.format(dt)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm">
            <BsClock className="mt-0.5 text-green-600" size={18} />
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Time</p>
              <p className="text-sm font-bold text-gray-800">{time}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm">
            <BsPeople className="mt-0.5 text-green-600" size={18} />
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Party Size</p>
              <p className="text-sm font-bold text-gray-800">{partySize} guests</p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-white p-3 shadow-sm">
            <BsGeoAlt className="mt-0.5 text-green-600" size={18} />
            <div>
              <p className="text-[10px] font-bold uppercase text-gray-400">Location</p>
              <p className="text-sm font-bold text-gray-800">
                {areaName} &middot; Table {tableNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={onConfirm}
        className="w-full rounded-xl bg-green-600 py-4 text-base font-bold text-white shadow-lg transition-all hover:bg-green-700 active:scale-[0.98] disabled:opacity-60"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Reserving...
          </span>
        ) : (
          "Confirm Reservation"
        )}
      </button>

      <button
        type="button"
        onClick={onBack}
        disabled={isSubmitting}
        className="w-full rounded-xl border border-gray-200 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-50 disabled:opacity-40"
      >
        &larr; Back
      </button>
    </div>
  );
}
