"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import { TableInStore } from "@/lib/AreaStore";
import TableCard from "./TableCard";
import { BsArrowsMove } from "react-icons/bs";

type Props = {
  table: TableInStore;
  scale: number;
  stageSize: { width: number; height: number };
  gridSize: number;
  isEditMode: boolean;
  canEditLayout: boolean;
  containerRef: React.RefObject<HTMLDivElement>;
  selected: boolean;
  collision?: boolean;
  onMove: (tableId: string, areaId: string, pos: { x: number; y: number }) => void;
  onMoveCommit: (payload: {
    tableId: string;
    prevAreaId: string;
    prevPos: { x: number; y: number };
    nextAreaId: string;
    nextPos: { x: number; y: number };
  }) => void;
  onSelect: (tableId: string) => void;
};

export default function FloorTable({
  table,
  scale,
  stageSize,
  gridSize,
  isEditMode,
  canEditLayout,
  selected,
  collision,
  onMove,
  onMoveCommit,
  onSelect,
}: Props) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs לניהול המיקומים
  const startMousePosRef = useRef({ x: 0, y: 0 });
  const startTablePosRef = useRef({ x: 0, y: 0 });
  
  // --- התיקון הקריטי: מעקב אחרי תנועה ---
  const hasMovedRef = useRef(false);

  const TABLE_WIDTH = 160;
  const TABLE_HEIGHT = 180;

  const handleStart = useCallback((clientX: number, clientY: number) => {
    // איפוס הדגל בכל תחילת אינטראקציה
    hasMovedRef.current = false;
    
    startMousePosRef.current = { x: clientX, y: clientY };
    startTablePosRef.current = { ...table.position };

    // רק אם אנחנו במצב עריכה נפעיל את מצב הגרירה
    if (isEditMode && canEditLayout) {
      setIsDragging(true);
    }
  }, [isEditMode, canEditLayout, table.position]);

  useEffect(() => {
    // אם אנחנו לא בגרירה וגם לא במצב עריכה, המעבר על השולחן לא יעשה כלום עד ה-MouseUp
    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      // חישוב המרחק שהעכבר עבר
      const dist = Math.sqrt(
        Math.pow(clientX - startMousePosRef.current.x, 2) + 
        Math.pow(clientY - startMousePosRef.current.y, 2)
      );

      // אם הזזנו יותר מ-5 פיקסלים, זו גרירה, לא קליק
      if (dist > 5) {
        hasMovedRef.current = true;
      }

      if (!isDragging) return;

      // מניעת גלילה במובייל
      if (e.cancelable) e.preventDefault();

      const dx = (clientX - startMousePosRef.current.x) / scale;
      const dy = (clientY - startMousePosRef.current.y) / scale;

      let nextX = startTablePosRef.current.x + dx;
      let nextY = startTablePosRef.current.y + dy;

      if (gridSize > 1) {
        nextX = Math.round(nextX / gridSize) * gridSize;
        nextY = Math.round(nextY / gridSize) * gridSize;
      }

      nextX = Math.max(0, Math.min(nextX, stageSize.width - TABLE_WIDTH));
      nextY = Math.max(0, Math.min(nextY, stageSize.height - TABLE_HEIGHT));

      onMove(table.id, table.areaId, { x: nextX, y: nextY });
    };

    const handleEnd = () => {
      // --- התיקון: פתיחת המודל רק אם לא הייתה תנועה משמעותית ---
      if (!hasMovedRef.current) {
        onSelect(table.id);
      }

      if (isDragging) {
        setIsDragging(false);
        const hasActuallyMoved = 
          Math.abs(table.position.x - startTablePosRef.current.x) > 1 || 
          Math.abs(table.position.y - startTablePosRef.current.y) > 1;

        if (hasActuallyMoved) {
          onMoveCommit({
            tableId: table.id,
            prevAreaId: table.areaId,
            prevPos: startTablePosRef.current,
            nextAreaId: table.areaId,
            nextPos: table.position,
          });
        }
      }
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, scale, stageSize, gridSize, table.id, table.areaId, table.position, onMove, onMoveCommit, onSelect]);

  return (
    <div
      className={`absolute transition-shadow duration-200 ${
        isDragging ? "z-[100] cursor-grabbing" : "z-10 cursor-pointer"
      }`}
      style={{
        left: table.position.x,
        top: table.position.y,
        width: TABLE_WIDTH,
        userSelect: "none",
        touchAction: "none",
      }}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        handleStart(e.clientX, e.clientY);
      }}
      onTouchStart={(e) => {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }}
    >
      <div
        className={`
           w-full h-full rounded-[1.5rem] transition-all duration-300
          ${selected ? "ring-4 ring-blue-500 ring-offset-4 z-20 shadow-2xl scale-[1.02]" : ""}
          ${collision ? "ring-4 ring-rose-500 animate-pulse" : ""}
          ${isDragging ? "opacity-70 rotate-2 scale-110 shadow-2xl" : "opacity-100 shadow-sm"}
        `}
      >
        <TableCard table={table}  />
  
        {isEditMode && canEditLayout && (
          <div className="absolute -top-3 -right-3 bg-slate-900 text-white p-2 rounded-full shadow-lg border-2 border-white z-[110] animate-in fade-in zoom-in duration-300">
            <BsArrowsMove size={14} />
          </div>
        )}
      </div>
    </div>
  );
}