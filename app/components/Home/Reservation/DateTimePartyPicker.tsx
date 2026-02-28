"use client";

import React, { useMemo } from "react";
import { useQuery } from "@urql/next";
import { BsCalendarDate, BsClock, BsPeople, BsDash, BsPlus } from "react-icons/bs";
import { GetRestaurantsDocument } from "@/graphql/generated";
import { getIsraelDateString } from "@/lib/localeUtils";

type OpenDay = { day: string; open: string; close: string; closed: boolean };

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

const MIN_ADVANCE_HOURS =
  parseInt(process.env.NEXT_PUBLIC_MIN_RESERVATION_ADVANCE_HOURS || "") || 2;

type Props = {
  date: string;
  time: string;
  partySize: number;
  onDateChange: (d: string) => void;
  onTimeChange: (t: string) => void;
  onPartySizeChange: (n: number) => void;
  onNext: () => void;
};

function generateTimeSlots(open: string, close: string): string[] {
  const slots: string[] = [];
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  let cur = oh * 60 + om;
  const end = ch * 60 + cm;
  while (cur < end) {
    const h = String(Math.floor(cur / 60)).padStart(2, "0");
    const m = String(cur % 60).padStart(2, "0");
    slots.push(`${h}:${m}`);
    cur += 30;
  }
  return slots;
}

export default function DateTimePartyPicker({
  date, time, partySize,
  onDateChange, onTimeChange, onPartySizeChange, onNext,
}: Props) {
  const [{ data }] = useQuery({ query: GetRestaurantsDocument });
  const restaurant = data?.getRestaurants?.[0];

  const openTimes: OpenDay[] = useMemo(() => {
    if (!restaurant?.openTimes || !Array.isArray(restaurant.openTimes)) return [];
    return restaurant.openTimes as OpenDay[];
  }, [restaurant]);

  const todayStr = useMemo(() => getIsraelDateString(), []);

  const selectedDayEntry = useMemo(() => {
    if (!date) return null;
    const d = new Date(date + "T12:00:00");
    const dayName = DAY_NAMES[d.getDay()];
    return openTimes.find((e) => e.day === dayName) ?? null;
  }, [date, openTimes]);

  const isClosed = selectedDayEntry?.closed ?? false;

  const timeSlots = useMemo(() => {
    if (!selectedDayEntry || isClosed) return [];
    return generateTimeSlots(selectedDayEntry.open, selectedDayEntry.close);
  }, [selectedDayEntry, isClosed]);

  const now = useMemo(() => new Date(), []);

  const isSlotDisabled = (slot: string): boolean => {
    if (!date) return true;
    const slotDate = new Date(`${date}T${slot}:00`);
    const minTime = new Date(now.getTime() + MIN_ADVANCE_HOURS * 60 * 60 * 1000);
    return slotDate < minTime;
  };

  const canProceed = date && time && partySize >= 1 && !isClosed;

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
          <BsCalendarDate className="text-green-600" />
          Select Date
        </label>
        <input
          type="date"
          min={todayStr}
          value={date}
          onChange={(e) => {
            onDateChange(e.target.value);
            onTimeChange("");
          }}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-200"
        />
        {date && isClosed && (
          <p className="mt-2 text-sm font-bold text-red-500">
            The restaurant is closed on this day
          </p>
        )}
      </div>

      {date && !isClosed && (
        <div>
          <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
            <BsClock className="text-green-600" />
            Select Time
          </label>
          {timeSlots.length === 0 ? (
            <p className="text-sm text-gray-400">No available time slots</p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {timeSlots.map((slot) => {
                const disabled = isSlotDisabled(slot);
                const selected = slot === time;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={disabled}
                    onClick={() => onTimeChange(slot)}
                    className={`rounded-lg border px-3 py-2 text-sm font-bold transition-all ${
                      selected
                        ? "border-green-500 bg-green-600 text-white shadow-md"
                        : disabled
                          ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                          : "border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50"
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div>
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-gray-700">
          <BsPeople className="text-green-600" />
          Party Size
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={partySize <= 1}
            onClick={() => onPartySizeChange(partySize - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-30"
          >
            <BsDash size={20} />
          </button>
          <span className="min-w-[3rem] text-center text-2xl font-black text-gray-800">
            {partySize}
          </span>
          <button
            type="button"
            disabled={partySize >= 20}
            onClick={() => onPartySizeChange(partySize + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition-all hover:bg-gray-100 disabled:opacity-30"
          >
            <BsPlus size={20} />
          </button>
        </div>
      </div>

      <button
        type="button"
        disabled={!canProceed}
        onClick={onNext}
        className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-green-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Next &mdash; Choose Area
      </button>
    </div>
  );
}
