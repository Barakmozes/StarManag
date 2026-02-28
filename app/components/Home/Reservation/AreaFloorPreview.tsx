"use client";

import React, { useMemo, useRef, useEffect, useState } from "react";
import { safeParsePosition, TABLE_SIZE } from "@/app/components/Restaurant_interface/floorUtils";

type AvailableTable = {
  id: string;
  tableNumber: number;
  diners: number;
  areaId: string;
  position: unknown;
};

type Props = {
  tables: AvailableTable[];
  availableIds: Set<string>;
  selectedTableId: string | null;
  floorPlanImage: string | null;
  onSelect: (tableId: string, tableNumber: number) => void;
};

export default function AreaFloorPreview({
  tables, availableIds, selectedTableId, floorPlanImage, onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      setContainerSize({
        w: entry.contentRect.width,
        h: entry.contentRect.height,
      });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const { scale, offsetX, offsetY } = useMemo(() => {
    if (tables.length === 0 || containerSize.w === 0)
      return { scale: 1, offsetX: 0, offsetY: 0 };

    let maxX = 0;
    let maxY = 0;
    for (const t of tables) {
      const pos = safeParsePosition(t.position);
      maxX = Math.max(maxX, pos.x + TABLE_SIZE.w);
      maxY = Math.max(maxY, pos.y + TABLE_SIZE.h);
    }
    if (maxX === 0 || maxY === 0) return { scale: 1, offsetX: 0, offsetY: 0 };

    const padding = 40;
    const scaleX = (containerSize.w - padding) / maxX;
    const scaleY = (containerSize.h - padding) / maxY;
    const s = Math.min(scaleX, scaleY, 1.5);

    return {
      scale: Math.max(s, 0.15),
      offsetX: (containerSize.w - maxX * s) / 2,
      offsetY: (containerSize.h - maxY * s) / 2,
    };
  }, [tables, containerSize]);

  const showFloor = !isMobile && !!floorPlanImage;

  if (showFloor) {
    return (
      <div
        ref={containerRef}
        className="relative h-[320px] overflow-hidden rounded-xl border border-gray-200 bg-gray-50"
        style={{
          backgroundImage: `url(${floorPlanImage})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
        }}
      >
        {tables.map((t) => {
          const pos = safeParsePosition(t.position);
          const isAvailable = availableIds.has(t.id);
          const isSelected = t.id === selectedTableId;

          return (
            <button
              key={t.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelect(t.id, t.tableNumber)}
              className={`absolute flex flex-col items-center justify-center rounded-lg border-2 text-[10px] font-bold leading-tight transition-all ${
                isSelected
                  ? "border-green-500 bg-green-600 text-white shadow-lg z-10"
                  : isAvailable
                    ? "border-green-400 bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer"
                    : "border-gray-300 bg-gray-200 text-gray-400 cursor-not-allowed opacity-60"
              }`}
              style={{
                left: offsetX + pos.x * scale,
                top: offsetY + pos.y * scale,
                width: TABLE_SIZE.w * scale,
                height: TABLE_SIZE.h * scale,
              }}
            >
              <span>T{t.tableNumber}</span>
              <span className="text-[8px] opacity-80">{t.diners} seats</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Mobile / no image fallback: card grid
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {tables.map((t) => {
        const isAvailable = availableIds.has(t.id);
        const isSelected = t.id === selectedTableId;

        return (
          <button
            key={t.id}
            type="button"
            disabled={!isAvailable}
            onClick={() => onSelect(t.id, t.tableNumber)}
            className={`flex flex-col items-center rounded-xl border-2 px-3 py-3 transition-all ${
              isSelected
                ? "border-green-500 bg-green-600 text-white shadow-lg"
                : isAvailable
                  ? "border-green-200 bg-green-50 text-green-800 hover:border-green-400"
                  : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
            }`}
          >
            <span className="text-lg font-black">T{t.tableNumber}</span>
            <span className="mt-0.5 text-xs font-bold opacity-80">
              {t.diners} seats
            </span>
            <span className={`mt-1 text-[10px] font-bold ${
              isAvailable ? (isSelected ? "text-green-200" : "text-green-600") : "text-gray-400"
            }`}>
              {isAvailable ? "Available" : "Taken"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
