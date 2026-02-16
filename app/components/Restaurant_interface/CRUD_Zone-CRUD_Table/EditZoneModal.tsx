"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FaEdit } from "react-icons/fa";
import Modal from "../../Common/Modal";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@urql/next";

import {
  EditAreaDocument,
  EditAreaMutation,
  EditAreaMutationVariables,
  GetAreasNameDescriptionDocument,
  GetAreaDocument,
  GetAreaQuery,
  GetAreaQueryVariables,


  GetGridConfigByAreaDocument,
  GetGridConfigByAreaQuery,
  GetGridConfigByAreaQueryVariables,
  AddGridConfigDocument,
  AddGridConfigMutation,
  AddGridConfigMutationVariables,
  EditGridConfigDocument,
  EditGridConfigMutation,
  EditGridConfigMutationVariables,
  

  BasicArea,
} from "@/graphql/generated";

import UploadImg from "../../../(dashboard)/dashboard/Components/UploadImg";
import { SupabaseImageUpload } from "@/lib/supabaseStorage";

type Props = {
  areas: BasicArea[];
  areaSelectToEdit: BasicArea;
};

const EditZoneModal = ({ areas, areaSelectToEdit }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const [zoneName, setZoneName] = useState("");
  const [zoneDesc, setZoneDesc] = useState("");
  const [fileUrl, setFileUrl] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const [gridSize, setGridSize] = useState<number>(20);
  const [gridConfigId, setGridConfigId] = useState<string | null>(null);

  // Re-fetch areas list after save
  const [{}, reexecuteAreas] = useQuery({
    query: GetAreasNameDescriptionDocument,
    pause: true,
    variables: { orderBy: { createdAt: "asc" } },
  });

  // Fetch full area details (for description)
  const [areaDetails, reexecuteAreaDetails] = useQuery<GetAreaQuery, GetAreaQueryVariables>({
    query: GetAreaDocument,
    pause: true,
    variables: { getAreaId: selectedAreaId || "" },
  });

  // Fetch grid config for this area
  const [gridRes, reexecuteGrid] = useQuery<GetGridConfigByAreaQuery, GetGridConfigByAreaQueryVariables>({
    query: GetGridConfigByAreaDocument,
    pause: true,
    variables: { areaId: selectedAreaId || "" },
  });

  const [{ fetching: updating }, editArea] = useMutation<EditAreaMutation, EditAreaMutationVariables>(
    EditAreaDocument
  );

  const [{ fetching: addingGrid }, addGridConfig] = useMutation<AddGridConfigMutation, AddGridConfigMutationVariables>(
    AddGridConfigDocument
  );

  const [{ fetching: editingGrid }, editGridConfig] = useMutation<EditGridConfigMutation, EditGridConfigMutationVariables>(
    EditGridConfigDocument
  );

  const openModal = () => {
    const id = areaSelectToEdit?.id || "";
    setSelectedAreaId(id);
    setZoneName(areaSelectToEdit?.name || "");
    setFileUrl(areaSelectToEdit?.floorPlanImage || "");
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  // When modal opens / area changes, load area details and grid config
  useEffect(() => {
    if (!isOpen || !selectedAreaId) return;

    reexecuteAreaDetails({ requestPolicy: "network-only" });
    reexecuteGrid({ requestPolicy: "network-only" });
  }, [isOpen, selectedAreaId, reexecuteAreaDetails, reexecuteGrid]);

  // Sync description + image from area details
  useEffect(() => {
    const a = areaDetails.data?.getArea;
    if (!a) return;

    setZoneDesc(a.description || "");
    // keep fileUrl if user already uploaded in this session
    if (!fileUrl) setFileUrl(a.floorPlanImage || "");
  }, [areaDetails.data?.getArea, fileUrl]);

  // Sync grid config results
  useEffect(() => {
    const cfg = gridRes.data?.getGridConfigByArea;
    if (!cfg) {
      setGridConfigId(null);
      setGridSize(20);
      return;
    }
    setGridConfigId(cfg.id);
    setGridSize(cfg.gridSize ?? 20);
  }, [gridRes.data?.getGridConfigByArea]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const url = await SupabaseImageUpload(file);
      setFileUrl(url);
      toast.success("Floor plan uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload floor plan image.");
    } finally {
      setIsUploading(false);
    }
  };

  const canSave = useMemo(() => {
    return !!selectedAreaId && zoneName.trim().length > 0 && !updating && !isUploading && !addingGrid && !editingGrid;
  }, [selectedAreaId, zoneName, updating, isUploading, addingGrid, editingGrid]);

  const handleUpdateZone = useCallback(async () => {
    if (!selectedAreaId) return;

    const name = zoneName.trim();
    if (!name) {
      toast.error("Zone name is required.");
      return;
    }

    // Validate grid size
    const gs = Math.max(10, Math.min(100, Math.floor(gridSize || 20)));

    try {
      // 1) Update area fields
      const result = await editArea({
        editAreaId: selectedAreaId,
        name,
        description: zoneDesc || undefined,
        floorPlanImage: fileUrl || undefined,
      });

      if (!result.data?.editArea?.id) {
        if (result.error) toast.error(result.error.message);
        return;
      }

      // 2) Upsert grid config
      if (gridConfigId) {
        await editGridConfig({ id: gridConfigId, gridSize: gs });
      } else {
        await addGridConfig({ areaId: selectedAreaId, gridSize: gs });
      }

      toast.success("Zone updated!");
      reexecuteAreas({ requestPolicy: "network-only" });
      closeModal();
    } catch (error) {
      console.error(error);
      toast.error("Failed to update zone.");
    }
  }, [
    addGridConfig,
    editArea,
    editGridConfig,
    fileUrl,
    gridConfigId,
    gridSize,
    reexecuteAreas,
    selectedAreaId,
    zoneDesc,
    zoneName,
  ]);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 transition"
      >
        <FaEdit className="h-4 w-4" aria-hidden="true" />
        <span>Edit Zone</span>
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal}>
        <div className="relative w-full max-w-lg md:max-w-4xl mx-auto bg-white rounded-xl shadow overflow-hidden">
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>

          <div className="p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-10">
              Edit Zone
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Update zone details, floor plan, and grid snap size.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Zone
                </label>
                <select
                  value={selectedAreaId}
                  onChange={(e) => setSelectedAreaId(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring focus:ring-blue-200"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zone Name
                </label>
                <input
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  className="w-full min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring focus:ring-blue-200"
                  placeholder="e.g. Main Hall"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring focus:ring-blue-200 min-h-[96px]"
                  placeholder="Optional..."
                />
              </div>

              <div className="rounded-xl border border-gray-200 p-3">
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Grid size (snap)
                </label>
                <p className="text-xs text-gray-500">
                  Smaller = more precise placement. Recommended: 20.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={gridSize}
                    onChange={(e) => setGridSize(Number(e.target.value))}
                    className="w-32 min-h-[44px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setGridSize(20)}
                    className="min-h-[44px] rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-3">
                <UploadImg handleCallBack={handleFileUpload} id="zoneFloorPlan" />
                {isUploading && (
                  <p className="mt-2 text-sm text-blue-600">Uploading…</p>
                )}
                {fileUrl && (
                  <p className="mt-2 text-xs text-gray-500 break-all">
                    Current: {fileUrl}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="w-full sm:w-auto min-h-[44px] rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={handleUpdateZone}
                className={[
                  "w-full sm:w-auto min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold text-white transition",
                  canSave ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed",
                ].join(" ")}
              >
                {updating || addingGrid || editingGrid ? "Saving…" : "Save Zone"}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditZoneModal;
