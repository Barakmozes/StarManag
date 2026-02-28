"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@urql/next";
import toast from "react-hot-toast";
// שימוש ב-Heroicons 2 המודרניים והנקיים
import {
  HiSquares2X2, // Overview: All
  HiCheckCircle, // Overview: Available
  HiCurrencyDollar, // Overview: Unpaid
  HiMagnifyingGlass, // Search
  HiMap, // Empty State icon
  HiPencilSquare, // Edit Icon
  HiTrash, // Delete Icon
  HiPlus,
  HiOutlineMagnifyingGlass, // Add Icon
} from "react-icons/hi2";
import {
  BasicArea,
  GetAreasNameDescriptionDocument,
  GetAreasNameDescriptionQuery,
  GetAreasNameDescriptionQueryVariables,
  GetTablesDocument,
  GetTablesQuery,
  UpdateManyTablesDocument,
  UpdateManyTablesMutation,
  UpdateManyTablesMutationVariables,
  GetGridConfigByAreaDocument,
  GetGridConfigByAreaQuery,
  GetGridConfigByAreaQueryVariables,
  SortOrder,
} from "@/graphql/generated";

import { TableInStore, useRestaurantStore } from "@/lib/AreaStore";

import AddZoneForm from "./CRUD_Zone-CRUD_Table/AddZoneForm";
import EditZoneModal from "./CRUD_Zone-CRUD_Table/EditZoneModal";
import DeleteZoneModal from "./CRUD_Zone-CRUD_Table/DeleteZoneModal";
import AddTableModal from "./CRUD_Zone-CRUD_Table/AddTableModal";

import AreaSelector from "./AreaSelector";
import FloorToolbar from "./FloorToolbar";
import TablesSection from "./TablesSection";
import TableModal from "./TableModal";
import TableCard from "./TableCard";
import { HiViewBoards } from "react-icons/hi";
import { BsSearch } from "react-icons/bs";

type OverviewMode = "NONE" | "ALL" | "AVAILABLE" | "UNPAID";
type ZoneRestaurantProps = {
  userRole?: string | null;
};

export default function ZoneRestaurant({ userRole }: ZoneRestaurantProps) {
  const canManage = userRole === "ADMIN" || userRole === "MANAGER";
  const canEditLayout = canManage;

  // Zustand store
  const selectedArea = useRestaurantStore((s) => s.selectedArea);
  const areas = useRestaurantStore((s) => s.areas);
  const tables = useRestaurantStore((s) => s.tables);

  const setAreas = useRestaurantStore((s) => s.setAreas);
  const setTables = useRestaurantStore((s) => s.setTables);
  const setSelectedArea = useRestaurantStore((s) => s.setSelectedArea);
  const clearSelectedArea = useRestaurantStore((s) => s.clearSelectedArea);

  const scale = useRestaurantStore((s) => s.scale);
  const adjustScale = useRestaurantStore((s) => s.adjustScale);
  const resetScale = useRestaurantStore((s) => s.resetScale);

  const moveTable = useRestaurantStore((s) => s.moveTable);
  const markTablesClean = useRestaurantStore((s) => s.markTablesClean);

  // UI state
  const [overviewMode, setOverviewMode] = useState<OverviewMode>("NONE");
  const [isEditMode, setIsEditMode] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  const [areaSearch, setAreaSearch] = useState("");
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [tableModalOpen, setTableModalOpen] = useState(false);

  // Undo state
  const lastMoveRef = useRef<{
    tableId: string;
    prevAreaId: string;
    prevPos: { x: number; y: number };
    nextAreaId: string;
    nextPos: { x: number; y: number };
  } | null>(null);

  // --- Queries & Mutations ---

  const [areasResult] = useQuery<
    GetAreasNameDescriptionQuery,
    GetAreasNameDescriptionQueryVariables
  >({
    query: GetAreasNameDescriptionDocument,
    variables: { orderBy: { createdAt: SortOrder.Asc } },
  });

  const [tablesResult] = useQuery<GetTablesQuery>({
    query: GetTablesDocument,
  });

  const [{ fetching: saving }, updateManyTables] = useMutation<
    UpdateManyTablesMutation,
    UpdateManyTablesMutationVariables
  >(UpdateManyTablesDocument);

  const [, reexecuteTablesQuery] = useQuery<GetTablesQuery>({
    query: GetTablesDocument,
    pause: true,
  });

  const [gridRes] = useQuery<
    GetGridConfigByAreaQuery,
    GetGridConfigByAreaQueryVariables
  >({
    query: GetGridConfigByAreaDocument,
    variables: { areaId: selectedArea?.id ?? "" },
    pause: !selectedArea?.id,
  });

  const gridSize = gridRes.data?.getGridConfigByArea?.gridSize ?? 20;

  // --- Effects ---

  // 1. Sync Logic: If an area is selected, force Overview Mode to NONE.
  // This ensures the UI updates strictly based on area selection.
  useEffect(() => {
    if (selectedArea) {
      setOverviewMode("NONE");
    }
  }, [selectedArea]);

  // 2. Hydration of Areas & Auto-select Logic
  // Using refs to prevent dependency loops when auto-selecting inside useEffect
  const selectedAreaRef = useRef(selectedArea);
  const overviewModeRef = useRef(overviewMode);

  useEffect(() => {
    selectedAreaRef.current = selectedArea;
    overviewModeRef.current = overviewMode;
  });

  useEffect(() => {
    const list = areasResult.data?.getAreasNameDescription;
    if (!list) return;

    setAreas(list as BasicArea[]);

    const currentSelectedArea = selectedAreaRef.current;
    const currentOverviewMode = overviewModeRef.current;

    // Handle deletion: if selected area no longer exists
    if (
      currentSelectedArea &&
      !list.some((a) => a.id === currentSelectedArea.id)
    ) {
      clearSelectedArea();
      setOverviewMode("NONE");
    }

    // Auto select first zone if nothing is selected and not in overview mode
    if (
      !currentSelectedArea &&
      list.length > 0 &&
      currentOverviewMode === "NONE"
    ) {
      setSelectedArea(list[0].id);
    }
  }, [
    areasResult.data?.getAreasNameDescription,
    setAreas,
    setSelectedArea,
    clearSelectedArea,
  ]);

  // 3. Hydration of Tables
  useEffect(() => {
    const data = tablesResult.data?.getTables;
    if (!data) return;

    const fetched: TableInStore[] = data.map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      areaId: t.areaId,
      diners: t.diners,
      reserved: t.reserved,
      specialRequests: t.specialRequests ?? [],
      unpaidOrdersCount: t.unpaidOrdersCount ?? 0,
      position: (t.position as any) ?? { x: 0, y: 0 },
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      dirty: false,
    }));

    setTables(fetched);
  }, [tablesResult.data?.getTables, setTables]);

  // 4. Force exit edit mode if permissions change
  useEffect(() => {
    if (!canEditLayout && isEditMode) setIsEditMode(false);
  }, [canEditLayout, isEditMode]);

  // --- Memoized Data ---

  const dirtyCount = useMemo(
    () => tables.filter((t) => t.dirty).length,
    [tables],
  );
  const canUndo = !!lastMoveRef.current;
  const hasUnpaidOrders = useCallback(
    (table: TableInStore) => (table.unpaidOrdersCount ?? 0) > 0,
    [],
  );

  const countsByAreaId = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of tables) map[t.areaId] = (map[t.areaId] || 0) + 1;
    return map;
  }, [tables]);

  const visibleTables = useMemo(() => {
    if (overviewMode === "ALL") return tables;
    if (overviewMode === "AVAILABLE") return tables.filter((t) => !t.reserved);
    if (overviewMode === "UNPAID") return tables.filter(hasUnpaidOrders);
    if (!selectedArea) return [];
    return tables.filter((t) => t.areaId === selectedArea.id);
  }, [tables, selectedArea, overviewMode, hasUnpaidOrders]);

  const groupedTables = useMemo(() => {
    const groups: Record<string, TableInStore[]> = {};
    for (const t of tables) {
      if (!groups[t.areaId]) groups[t.areaId] = [];
      groups[t.areaId].push(t);
    }
    return groups;
  }, [tables]);

  const selectedTable = useMemo(
    () =>
      selectedTableId
        ? (tables.find((t) => t.id === selectedTableId) ?? null)
        : null,
    [tables, selectedTableId],
  );

  // --- Handlers ---

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setTableModalOpen(true);
  };

  const handleSaveLayout = async () => {
    if (!canEditLayout || !isEditMode) return;

    const dirty = tables.filter((t) => t.dirty);
    if (dirty.length === 0) {
      toast("No layout changes to save.", { duration: 1200 });
      return;
    }

    try {
      const updates = dirty.map((t) => ({
        id: t.id,
        areaId: t.areaId,
        position: t.position,
        reserved: t.reserved,
      }));

      const result = await updateManyTables({ updates });
      if (result.error) {
        toast.error("Failed to save layout: " + result.error.message);
        return;
      }

      markTablesClean(dirty.map((t) => t.id));
      toast.success("Layout saved!", { duration: 1200 });

      reexecuteTablesQuery({ requestPolicy: "network-only" });
      lastMoveRef.current = null;
    } catch (e) {
      console.error(e);
      toast.error("Unexpected error while saving layout.");
    }
  };

  const handleUndo = () => {
    if (!lastMoveRef.current) return;
    const m = lastMoveRef.current;
    moveTable(m.tableId, m.prevAreaId, m.prevPos);
    toast.success("Undid last move.", { duration: 900 });
    lastMoveRef.current = null;
  };

  const loading = areasResult.fetching || tablesResult.fetching;
  const error = areasResult.error || tablesResult.error;

  return (
    <section className="w-full">
      <div className="mx-auto max-w-[1400px] p-3 sm:p-4">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                Floor
              </h1>
              <p className="text-sm text-gray-600">
                Manage zones and tables. Drag in edit mode, then save layout.
              </p>
            </div>

            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-2 p-2 bg-white border border-slate-200 rounded-xl shadow-sm mb-4">
              {/* --- Left Side: Filters (English) --- */}
              <div className="flex w-full md:w-auto  rounded-lg overflow-x-auto scrollbar-hide">
                <div className="flex w-full md:w-auto items-center gap-1 text-slate-700">
                  {[
                    {
                      mode: "ALL",
                      label: "All Tables",
                      icon: HiSquares2X2,
                      activeColor:
                        "border-blue-200 bg-blue-100 text-blue-800 ring-1 ring-blue-200",
                    },
                    {
                      mode: "AVAILABLE",
                      label: "Available",
                      icon: HiCheckCircle,
                      activeColor:
                        "border-emerald-200 bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200",
                    },
                    {
                      mode: "UNPAID",
                      label: "Unpaid",
                      icon: HiCurrencyDollar,
                      activeColor:
                        "border-amber-200 bg-amber-100 text-amber-800 ring-1 ring-amber-200",
                    },
                  ].map((btn) => {
                    const isActive = overviewMode === btn.mode;
                    const Icon = btn.icon;

                    return (
                      <button
                        key={btn.mode}
                        onClick={() => {
                          setOverviewMode((m) =>
                            m === btn.mode
                              ? "NONE"
                              : (btn.mode as OverviewMode),
                          );
                          if (!isActive) clearSelectedArea();
                        }}
                        className={`
              relative flex-1 md:flex-none flex items-center justify-center gap-1.5 
              px-4 py-2 min-h-[40px]  text-sm font-semibold rounded-full border transition-all duration-200 whitespace-nowrap
              ${
                isActive
                  ? btn.activeColor
                  : "bg-white border-gray-200 text-slate-700 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
              }
            `}
                      >
                        <Icon
                          size={16}
                          className={isActive ? "opacity-100" : "opacity-70"}
                        />
                        <span>{btn.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* --- Right Side: Admin Actions --- */}
              {canManage && (
                <div className="flex flex-wrap w-full md:w-auto items-center justify-end gap-2 px-1">
                  {/* 1. Add Table Button (High Emphasis) */}

              
                      <AddTableModal
                        allAreas={areas}
                        areaSelectID={selectedArea}
                      />
                 
                    
               

                  {/* 2. Add Zone Button (Medium Emphasis) */}

                
                      <AddZoneForm />
                  
                 

                  {/* 3. Context Actions (Only if area selected) */}
                  {selectedArea && (
                    <>
                      <div className="w-px h-5 bg-slate-200 mx-0.5" />{" "}
                      {/* Divider */}
                      <button
                        className="p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Edit Zone"
                      >
                        <HiViewBoards size={18} />
                      </button>
                     
                          <DeleteZoneModal
                            areas={areas}
                            areaSelectToDelete={selectedArea}
                          />
                      
                      <EditZoneModal
                            areas={areas}
                            areaSelectToEdit={selectedArea}
                          />
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Area selector */}
          {/* Only shown when NOT in overview mode, to avoid confusion */}
          {overviewMode === "NONE" && (
            <AreaSelector
              areas={areas}
              selectedAreaId={selectedArea?.id ?? null}
              onSelect={(areaId) => {
                setSelectedArea(areaId);
                // Note: The useEffect above will automatically set overviewMode to "NONE"
              }}
              search={areaSearch}
              onSearchChange={setAreaSearch}
              countsByAreaId={countsByAreaId}
            />
          )}

          {/* Toolbar */}
            {overviewMode === "NONE" && (
          <FloorToolbar
            scale={scale}
            onZoomIn={() => adjustScale(0.1)}
            onZoomOut={() => adjustScale(-0.1)}
            onResetZoom={() => resetScale()}
            showGrid={showGrid}
            onToggleGrid={() => setShowGrid((v) => !v)}
            gridSize={gridSize}
            isEditMode={isEditMode}
            canEditLayout={canEditLayout}
            onToggleEditMode={() => setIsEditMode((v) => !v)}
            dirtyCount={dirtyCount}
            onSaveLayout={handleSaveLayout}
            saving={saving}
            canUndo={canUndo}
            onUndo={handleUndo}
          />
            )}
        </div>

        {/* Content */}
        <div className="mt-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {error.message}
            </div>
          )}

          {loading && (
            <div className="mt-4 grid grid-cols-1 gap-3">
              <div className="h-[65vh] rounded-xl border border-gray-200 bg-gray-50 animate-pulse" />
            </div>
          )}
          {/* Overview Mode View */}
{/* Overview Mode View */}
{!loading && overviewMode !== "NONE" && (
  <div className="mt-4 space-y-6">
    
    {/* 1. Search Bar Only (No Dropdown) */}
      <div className="w-full">
        <label className="sr-only" htmlFor="areaSearch">
          Search zones
        </label>
        <div className="relative">
          <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            id="areaSearch"
          value={areaSearch}
            onChange={(e) => setAreaSearch(e.target.value)}
            placeholder="Search zones…"
            className="w-full min-h-[44px] rounded-xl border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>
    </div>

    {/* 2. Table Lists Grouped by Area */}
    <div className="space-y-8">
      {Object.entries(groupedTables).map(([areaId, group]) => {
        const areaName =
          areas.find((a) => a.id === areaId)?.name ?? "Unknown zone";

        // --- FILTER LEVEL 1: Search Text ---
        // אם יש טקסט בחיפוש, מציג רק אזורים ששמם מכיל את הטקסט
        if (
          areaSearch &&
          !areaName.toLowerCase().includes(areaSearch.toLowerCase())
        ) {
          return null;
        }

        // --- FILTER LEVEL 2: Table Status (Overview Mode) ---
        const list =
          overviewMode === "AVAILABLE"
            ? group.filter((t) => !t.reserved)
            : overviewMode === "UNPAID"
            ? group.filter(hasUnpaidOrders)
            : group; // מציג הכל

        // אם אין שולחנות באזור זה לאחר הסינון, מסתיר את האזור
        if (list.length === 0) return null;

        return (
          <div 
            key={areaId} 
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md"
          >
            {/* Area Header */}
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 px-4 py-3">
              <h2 className="text-lg font-bold text-gray-800">
                {areaName}
              </h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {list.length} שולחנות
              </span>
            </div>

            {/* Tables Grid */}
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {list.map((t) => (
                  <button
                    key={t.id}
                    className="w-full text-left transition-transform duration-200 hover:scale-[1.02] active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg"
                    onClick={() => handleSelectTable(t.id)}
                  >
                    <TableCard table={t} />
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>

    {/* Empty State Message (אם החיפוש לא מצא כלום) */}
    {Object.entries(groupedTables).every(([areaId, group]) => {
        const areaName = areas.find((a) => a.id === areaId)?.name ?? "";
        // בדיקה ידנית האם הכל הוסתר ע"י החיפוש
        const matchesSearch = !areaSearch || areaName.toLowerCase().includes(areaSearch.toLowerCase());
        // בדיקה האם הכל הוסתר ע"י הפילטר (פנוי/תפוס)
        const list = overviewMode === "AVAILABLE" ? group.filter(t => !t.reserved) : 
                     overviewMode === "UNPAID" ? group.filter(hasUnpaidOrders) : group;
        
        return !matchesSearch || list.length === 0;
    }) && (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-gray-100 p-3 text-gray-400 mb-3">
          <BsSearch size={24} />
        </div>
        <p className="text-gray-500 font-medium">לא נמצאו אזורים תואמים לחיפוש.</p>
      </div>
    )}
  </div>
)}

          {/* Single Zone View */}
          {!loading && overviewMode === "NONE" && selectedArea && (
            <>
              {visibleTables.length === 0 ? (
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900">
                    No tables in {selectedArea.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Add tables to start managing this zone.
                  </p>
                  {canManage && (
                    <div className="mt-4 flex justify-center">
                      <AddTableModal
                        allAreas={areas}
                        areaSelectID={selectedArea}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <TablesSection
                  areaSelect={selectedArea}
                  tables={visibleTables}
                  scale={scale}
                  gridSize={gridSize}
                  showGrid={showGrid}
                  isEditMode={isEditMode}
                  canEditLayout={canEditLayout}
                  onMoveTable={(tableId, areaId, pos) =>
                    moveTable(tableId, areaId, pos)
                  }
                  onMoveCommit={(m) => {
                    lastMoveRef.current = m;
                  }}
                  selectedTableId={selectedTableId}
                  onSelectTable={handleSelectTable}
                  onWheelZoom={(delta) => adjustScale(delta)}
                />
              )}
            </>
          )}

          {/* Empty State (No Zone, No Overview) */}
          {!loading && overviewMode === "NONE" && !selectedArea && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Select a zone
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Choose a zone to view and manage its floor layout.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Table Inspector Modal */}
      <TableModal
        open={tableModalOpen}
        onClose={() => {
          setTableModalOpen(false);
          setSelectedTableId(null);
        }}
        table={selectedTable}
        currentArea={selectedArea}
        allAreas={areas}
        isEditMode={isEditMode}
        canManage={canManage}
        onMoveToArea={(tableId, newAreaId) => {
          moveTable(tableId, newAreaId, { x: 40, y: 40 });
          toast.success("Moved table (unsaved). Save layout to persist.", {
            duration: 1400,
          });
        }}
      />
    </section>
  );
}
