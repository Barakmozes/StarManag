"use client";

import React from "react";
import {
  HiOutlineArrowUturnLeft,
  HiOutlineCheck,
  HiOutlineCloudArrowUp,
  HiOutlineMagnifyingGlassMinus,
  HiOutlineMagnifyingGlassPlus,
  HiOutlinePencilSquare,
  HiOutlineSquares2X2,
} from "react-icons/hi2";

type Props = {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;

  showGrid: boolean;
  onToggleGrid: () => void;
  gridSize: number;

  isEditMode: boolean;
  canEditLayout: boolean;
  onToggleEditMode: () => void;

  dirtyCount: number;
  onSaveLayout: () => void;
  saving?: boolean;

  canUndo: boolean;
  onUndo: () => void;
};

export default function FloorToolbar({
  scale,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  showGrid,
  onToggleGrid,
  gridSize,
  isEditMode,
  canEditLayout,
  onToggleEditMode,
  dirtyCount,
  onSaveLayout,
  saving,
  canUndo,
  onUndo,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
      {/* Left */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onZoomOut}
          className="min-h-[40px] inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          aria-label="Zoom out"
        >
          <HiOutlineMagnifyingGlassMinus className="h-5 w-5" />
          <span className="hidden sm:inline">Zoom out</span>
        </button>

        <button
          type="button"
          onClick={onZoomIn}
          className="min-h-[40px] inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          aria-label="Zoom in"
        >
          <HiOutlineMagnifyingGlassPlus className="h-5 w-5" />
          <span className="hidden sm:inline">Zoom in</span>
        </button>

        <button
          type="button"
          onClick={onResetZoom}
          className="min-h-[40px] inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          aria-label="Reset zoom"
        >
          <HiOutlineCheck className="h-5 w-5" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">
          <span>Zoom</span>
          <span className="font-semibold text-gray-900">{Math.round(scale * 100)}%</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onToggleGrid}
          className={[
            "min-h-[40px] inline-flex items-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
            showGrid
              ? "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100"
              : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
          ].join(" ")}
          aria-pressed={showGrid}
          aria-label="Toggle grid"
        >
          <HiOutlineSquares2X2 className="h-5 w-5" />
          <span className="hidden sm:inline">Grid</span>
          <span className="hidden sm:inline text-xs text-gray-600">({gridSize}px)</span>
        </button>

        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className={[
            "min-h-[40px] inline-flex items-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
            canUndo
              ? "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              : "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed",
          ].join(" ")}
          aria-label="Undo last move"
        >
          <HiOutlineArrowUturnLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Undo</span>
        </button>

        <button
          type="button"
          onClick={onToggleEditMode}
          disabled={!canEditLayout}
          className={[
            "min-h-[40px] inline-flex items-center gap-2 rounded-lg border px-3 text-sm font-medium transition",
            !canEditLayout
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              : isEditMode
                ? "border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100"
                : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
          ].join(" ")}
          aria-label="Toggle edit mode"
        >
          <HiOutlinePencilSquare className="h-5 w-5" />
          <span className="hidden sm:inline">{isEditMode ? "Edit layout" : "View mode"}</span>
          <span className="sm:hidden">{isEditMode ? "Edit" : "View"}</span>
        </button>

        <button
          type="button"
          onClick={onSaveLayout}
          disabled={!canEditLayout || !isEditMode || dirtyCount === 0 || !!saving}
          className={[
            "min-h-[40px] inline-flex items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white transition",
            !canEditLayout || !isEditMode || dirtyCount === 0 || !!saving
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700",
          ].join(" ")}
          aria-label="Save layout"
        >
          <HiOutlineCloudArrowUp className="h-5 w-5" />
          <span className="hidden sm:inline">{saving ? "Saving…" : "Save layout"}</span>
          <span className="sm:hidden">{saving ? "Saving…" : "Save"}</span>
          {dirtyCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {dirtyCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
