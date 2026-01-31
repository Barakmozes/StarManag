"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@urql/next";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  EditRestaurantDocument,
  type EditRestaurantMutation,
  type EditRestaurantMutationVariables,
} from "@/graphql/generated";
import PanelWrapper from "../Components/PanelWrapper";


type OpenDay = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

const DEFAULT_OPEN_TIMES: OpenDay[] = [
  { day: "Sunday", open: "08:00", close: "22:00", closed: false },
  { day: "Monday", open: "08:00", close: "22:00", closed: false },
  { day: "Tuesday", open: "08:00", close: "22:00", closed: false },
  { day: "Wednesday", open: "08:00", close: "22:00", closed: false },
  { day: "Thursday", open: "08:00", close: "22:00", closed: false },
  { day: "Friday", open: "08:00", close: "23:00", closed: false },
  { day: "Saturday", open: "08:00", close: "23:00", closed: false },
];

const normalizeOpenTimes = (raw: unknown): OpenDay[] => {
  if (!raw) return DEFAULT_OPEN_TIMES;

  let parsed: unknown = raw;

  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (Array.isArray(parsed)) {
    const ok = parsed.every(
      (x: any) =>
        x &&
        typeof x.day === "string" &&
        typeof x.open === "string" &&
        typeof x.close === "string" &&
        typeof x.closed === "boolean"
    );
    if (ok) return parsed as OpenDay[];
  }

  return DEFAULT_OPEN_TIMES;
};

type Props = {
  restaurantId: string;
  openTimes: any;
};

const OpeningHours = ({ restaurantId, openTimes }: Props) => {
  const router = useRouter();

  const normalized = useMemo(() => normalizeOpenTimes(openTimes), [openTimes]);
  const [days, setDays] = useState<OpenDay[]>(normalized);

  // ✅ no warning (deps complete)
  useEffect(() => {
    setDays(normalized);
  }, [normalized]);

  const [, editRestaurant] = useMutation<EditRestaurantMutation, EditRestaurantMutationVariables>(
    EditRestaurantDocument
  );

  const updateDay = (index: number, patch: Partial<OpenDay>) => {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  };

  const handleSave = async () => {
    if (!restaurantId) return;

    const toastId = toast.loading("Saving...");
    try {
      const res = await editRestaurant({
        editRestaurantId: restaurantId,
        openTimes: days,
      });

      if (res.data?.editRestaurant) {
        toast.success("Opening hours saved", { id: toastId, duration: 1200 });
        router.refresh();
      } else {
        toast.error("An error occurred", { id: toastId, duration: 2000 });
      }
    } catch (err) {
      console.error("Error saving opening hours:", err);
      toast.error("An error occurred", { id: toastId, duration: 2000 });
    }
  };

  return (
    <PanelWrapper title="Opening Hours">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-slate-500">
          <thead className="text-xs whitespace-nowrap text-slate-700 uppercase bg-slate-100">
            <tr>
              <th className="px-6 py-3">Day</th>
              <th className="px-6 py-3">Open</th>
              <th className="px-6 py-3">Close</th>
              <th className="px-6 py-3">Closed</th>
            </tr>
          </thead>

          <tbody>
            {days.map((d, idx) => (
              <tr className="bg-white" key={d.day}>
                <td className="px-6 py-2 whitespace-nowrap">{d.day}</td>

                <td className="px-6 py-2">
                  <input
                    type="time"
                    className="form-input"
                    value={d.open}
                    disabled={d.closed}
                    onChange={(e) => updateDay(idx, { open: e.target.value })}
                  />
                </td>

                <td className="px-6 py-2">
                  <input
                    type="time"
                    className="form-input"
                    value={d.close}
                    disabled={d.closed}
                    onChange={(e) => updateDay(idx, { close: e.target.value })}
                  />
                </td>

                <td className="px-6 py-2">
                  <input
                    type="checkbox"
                    className="w-6 h-6 accent-green-600 rounded focus:ring-green-500"
                    checked={d.closed}
                    onChange={(e) => updateDay(idx, { closed: e.target.checked })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={handleSave}
            className="text-white inline-flex items-center bg-green-600
              hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300
              font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            Save Opening Hours
          </button>

          <button
            type="button"
            onClick={() => setDays(DEFAULT_OPEN_TIMES)}
            className="text-gray-700 inline-flex items-center bg-gray-100
              hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-200
              font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            Reset Default
          </button>
        </div>
      </div>
    </PanelWrapper>
  );
};

export default OpeningHours;
