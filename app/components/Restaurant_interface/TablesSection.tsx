"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { BasicArea } from "@/graphql/generated";
import { TableInStore } from "@/lib/AreaStore";
import FloorTable from "./FloorTable"; // מוודאים שזה מיובא

// Icons
import { 
  BsZoomIn, 
  BsZoomOut, 
  BsArrowsFullscreen, 
  BsGrid3X3, 
  BsPencilSquare,
  BsImage,
  BsMap, 
  BsArrowsMove
} from "react-icons/bs";
import TableCard from "./TableCard";

type Props = {
  areaSelect: BasicArea;
  tables: TableInStore[];
  scale: number;

  gridSize: number;
  showGrid: boolean;

  isEditMode: boolean;
  canEditLayout: boolean;

  onMoveTable: (tableId: string, areaId: string, pos: { x: number; y: number }) => void;
  onMoveCommit: (payload: {
    tableId: string;
    prevAreaId: string;
    prevPos: { x: number; y: number };
    nextAreaId: string;
    nextPos: { x: number; y: number };
  }) => void;

  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;

  onWheelZoom?: (delta: number) => void;
};

function rectsOverlap(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
  return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
}

export default function TablesSection({
  areaSelect,
  tables,
  scale,
  gridSize,
  showGrid,
  isEditMode,
  canEditLayout,
  onMoveTable,
  onMoveCommit,
  selectedTableId,
  onSelectTable,
  onWheelZoom,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [stageSize, setStageSize] = useState({ width: 2000, height: 1500 });

  // --- טעינת תמונת רקע וחישוב גודל ---
  useEffect(() => {
    const src = areaSelect?.floorPlanImage;
    if (!src) {
      setStageSize({ width: 2000, height: 1500 });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || 2000;
      const h = img.naturalHeight || 1500;
      setStageSize({ width: Math.max(1200, w), height: Math.max(800, h) });
    };
    img.onerror = () => {
      setStageSize({ width: 2000, height: 1500 });
    };
    img.src = src;
  }, [areaSelect?.floorPlanImage]);

  const scaledWidth = stageSize.width * scale;
  const scaledHeight = stageSize.height * scale;

  // --- חישוב התנגשויות ---
  const collisions = useMemo(() => {
    const w = 160;
    const h = 120; // גובה משוער להתנגשות
    const ids = new Set<string>();
    for (let i = 0; i < tables.length; i++) {
      const a = tables[i];
      const ra = { x: a.position.x, y: a.position.y, w, h };
      for (let j = i + 1; j < tables.length; j++) {
        const b = tables[j];
        const rb = { x: b.position.x, y: b.position.y, w, h };
        if (rectsOverlap(ra, rb)) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return ids;
  }, [tables]);

  // --- סגנון רקע ---
  const backgroundStyle: React.CSSProperties = areaSelect?.floorPlanImage
    ? {
        backgroundImage: `url(${areaSelect.floorPlanImage})`,
        backgroundSize: "100% 100%",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }
    : {
        backgroundColor: "#f8fafc",
        backgroundImage: showGrid 
          ? `radial-gradient(#cbd5e1 1px, transparent 1px)` 
          : "none",
        backgroundSize: `${gridSize}px ${gridSize}px`,
      };

  // --- פונקציות זום ---
  const handleZoomIn = () => onWheelZoom && onWheelZoom(0.1);
  const handleZoomOut = () => onWheelZoom && onWheelZoom(-0.1);
  const handleResetZoom = () => { if (onWheelZoom) onWheelZoom(1 - scale); };

  const handleFitToScreen = () => {
    if (!containerRef.current || !onWheelZoom) return;
    const container = containerRef.current;
    const padding = 60;
    const widthRatio = (container.clientWidth - padding) / stageSize.width;
    const heightRatio = (container.clientHeight - padding) / stageSize.height;
    const targetScale = Math.min(widthRatio, heightRatio);
    const clampedScale = Math.min(Math.max(targetScale, 0.15), 1.5);
    const delta = clampedScale - scale;
    onWheelZoom(delta);
  };

  const [tableModalOpen, setTableModalOpen] = useState(false); // נועד למודל אם קיים כאן

  const handleSelectTable = (tableId: string) => {
    onSelectTable(tableId); // קריאה לפונקציה שהגיעה מה-props
    setTableModalOpen(true);
  };

  return (
    <div className="relative flex flex-col w-full h-[70vh] sm:h-[75vh] lg:h-[80vh] bg-slate-100 rounded-3xl border border-slate-300 shadow-inner overflow-hidden group select-none">
      
      <div
        ref={containerRef}
        className={`h-full w-full overflow-auto cursor-grab active:cursor-grabbing custom-scrollbar ${isEditMode ? 'bg-slate-50' : 'bg-slate-100'}`}
        onWheel={(e) => {
          if (!onWheelZoom) return;
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const delta = -e.deltaY * 0.001;
            onWheelZoom(delta);
          }
        }}
      >
        <div style={{ width: scaledWidth, height: scaledHeight, minWidth: '100%', minHeight: '100%' }}>
          <div
            className="relative transition-transform duration-300 ease-out"
            style={{
              width: stageSize.width,
              height: stageSize.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <div className="absolute inset-0 shadow-sm transition-opacity duration-300" style={backgroundStyle} />

            {showGrid && areaSelect?.floorPlanImage && (
               <div 
                 className="absolute inset-0 pointer-events-none opacity-30" 
                 style={{
                   backgroundImage: `linear-gradient(to right, #94a3b8 1px, transparent 1px), linear-gradient(to bottom, #94a3b8 1px, transparent 1px)`,
                   backgroundSize: `${gridSize}px ${gridSize}px`
                 }} 
               />
            )}

            {/* --- השינוי העיקרי: שימוש ב-FloorTable במקום ב-Button --- */}
            {tables.map((t) => (
            
              <FloorTable
                key={t.id}
                table={t}
                scale={scale}
                stageSize={stageSize}
                gridSize={gridSize}
                isEditMode={isEditMode}
                canEditLayout={canEditLayout}
                containerRef={containerRef}
                selected={selectedTableId === t.id}
                collision={collisions.has(t.id)}
                onMove={onMoveTable}
                onMoveCommit={onMoveCommit}
                onSelect={handleSelectTable}
              />
              
            ))}
            
            
            
            
          </div>
        </div>
      </div>

      {/* --- UI Controls --- */}
      
      {isEditMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-amber-500/90 backdrop-blur-md text-white px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-bounce-slow border border-white/20">
            <BsPencilSquare />
            <span className="text-xs font-bold uppercase tracking-wider">מצב עריכה פעיל</span>
          </div>
        </div>
      )}

      {/* Floating Toolbar */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 z-20 items-end">
        
        {/* Mobile-only Quick Action */}
        <button 
            onClick={handleFitToScreen}
            className="sm:hidden flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/30 active:scale-95 transition-all"
        >
            <BsMap size={20} />
            <span className="text-xs font-black">מפה מלאה</span>
        </button>

        {/* Control Group */}
        <div className="flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            
            <button 
                onClick={handleFitToScreen}
                className="p-3.5 hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors flex flex-col items-center gap-1"
                title="Fit to Screen"
            >
                <BsMap size={20} />
                <span className="text-[9px] font-bold uppercase hidden lg:block">Fit</span>
            </button>

            <button onClick={handleZoomIn} className="p-3.5 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors" title="Zoom In">
                <BsZoomIn size={22} />
            </button>
            <button onClick={handleZoomOut} className="p-3.5 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors" title="Zoom Out">
                <BsZoomOut size={22} />
            </button>

            <button 
                onClick={handleResetZoom}
                className="p-3.5 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors flex flex-col items-center gap-1"
                title="Reset Size (100%)"
            >
                <BsArrowsFullscreen size={18} />
                <span className="text-[9px] font-bold uppercase hidden lg:block">1:1</span>
            </button>
        </div>
      </div>

      {/* Info Badge */}
      <div className="absolute bottom-6 left-6 z-10 pointer-events-none hidden sm:block">
         <div className="bg-white/90 backdrop-blur-md px-3 py-2.5 rounded-xl border border-slate-200 shadow-lg text-[10px] font-bold text-slate-500 flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
               <BsGrid3X3 className={showGrid ? "text-blue-500" : "text-slate-400"} />
               <span>Grid: {showGrid ? "Active" : "Off"}</span>
            </div>
            <div className="flex items-center gap-1.5">
               <BsImage className={areaSelect?.floorPlanImage ? "text-emerald-500" : "text-slate-400"} />
               <span>Scale: {Math.round(scale * 100)}%</span>
            </div>
         </div>
      </div>

      {isEditMode && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur text-white text-[10px] font-medium px-4 py-1.5 rounded-full pointer-events-none sm:hidden whitespace-nowrap shadow-lg flex items-center gap-2">
           <BsArrowsMove /> Drag tables to move
        </div>
      )}
    </div>
  );
}