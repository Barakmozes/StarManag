"use client";

import React, { useMemo, useRef } from "react";
import { BasicArea } from "@/graphql/generated";
import { HiOutlineMagnifyingGlass } from "react-icons/hi2";

type Props = {
  areas: BasicArea[];
  selectedAreaId: string | null;
  onSelect: (areaId: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  countsByAreaId?: Record<string, number>;
};

export default function AreaSelector({
  areas,
  selectedAreaId,
  onSelect,
  search,
  onSearchChange,
  countsByAreaId = {},
}: Props) {
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return areas;
    return areas.filter((a) => a.name.toLowerCase().includes(q));
  }, [areas, search]);

  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  return (
    <div className="w-full">
      <label className="sr-only" htmlFor="areaSearch">
        Search zones
      </label>
      <div className="relative">
        <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          id="areaSearch"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search zones…"
          className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      <div
        role="tablist"
        aria-label="Zones"
        className="mt-3 flex w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {filtered.length === 0 ? (
          <div className="text-sm text-gray-500 py-2">No zones found.</div>
        ) : (
          filtered.map((area, idx) => {
            const selected = area.id === selectedAreaId;
            const count = countsByAreaId[area.id] ?? 0;

            return (
              <button
                key={area.id}
                ref={(el) => {
                  btnRefs.current[idx] = el;
                }}
                role="tab"
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onSelect(area.id)}
                onKeyDown={(e) => {
                  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
                  e.preventDefault();
                  const dir = e.key === "ArrowRight" ? 1 : -1;
                  const next = (idx + dir + filtered.length) % filtered.length;
                  btnRefs.current[next]?.focus();
                }}
                className={[
                  "shrink-0 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition",
                  selected
                    ? "border-blue-200 bg-blue-50 text-blue-800"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                ].join(" ")}
              >
                <span className="max-w-[12rem] truncate">{area.name}</span>
                <span
                  className={[
                    "inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs",
                    selected ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700",
                  ].join(" ")}
                >
                  {count}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
