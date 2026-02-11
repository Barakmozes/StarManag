"use client";

import React, { useState } from "react";
import { FaEdit } from "react-icons/fa";
import Modal from "../../Common/Modal";
import toast from "react-hot-toast";
import { useMutation, useQuery } from "@urql/next";

import {
  Area,
  GetAreasNameDescriptionDocument,
  EditAreaDocument,
  EditAreaMutation,
  EditAreaMutationVariables,
} from "@/graphql/generated";

// The SupabaseImageUpload function is assumed to be imported from your storage logic
import { SupabaseImageUpload } from "@/lib/supabaseStorage";
// The UploadImg component you mentioned
import UploadImg from "../../../(dashboard)/dashboard/Components/UploadImg";
import Image from "next/image";

type Props = {
  /** All available areas, if you want to populate a dropdown */
  areas: Area[];
  /** An initial area to edit, if you already know which one is selected */
  areaSelectToEdit?: Area;
};

const EditZoneModal = ({ areas, areaSelectToEdit }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  // 1) State for selecting which area we're editing
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");

  // 2) Fields for editing area data
  const [zoneName, setZoneName] = useState("");
  const [zoneDesc, setZoneDesc] = useState("");
  const [zoneImage, setZoneImage] = useState("");

  // GraphQL: re-fetch areas so updated info appears immediately
  const [{}, reexecuteQuery] = useQuery({
    query: GetAreasNameDescriptionDocument,
    pause: true,
    variables: {
      orderBy: { createdAt: "asc" },
    },
  });

  // GraphQL: editArea mutation
  const [{ fetching: updating }, editArea] = useMutation<
    EditAreaMutation,
    EditAreaMutationVariables
  >(EditAreaDocument);

  // ---------------------------
  // OPEN/CLOSE MODAL
  // ---------------------------
  const openModal = () => {
    // If we already have a selected area from props, use that;
    // else pick the first from areas[] if it exists:
    const initialId =
      areaSelectToEdit?.id || (areas.length > 0 ? areas[0].id : "");

    setSelectedAreaId(initialId);
    // Pre-fill fields if we have an existing area
    if (areaSelectToEdit) {
      setZoneName(areaSelectToEdit.name || "");
      setZoneDesc(areaSelectToEdit.description || "");
      setZoneImage(areaSelectToEdit.floorPlanImage || "");
    } else if (areas.length > 0) {
      setZoneName(areas[0].name || "");
      setZoneDesc(areas[0].description || "");
      setZoneImage(areas[0].floorPlanImage || "");
    }

    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Optional: Reset fields
    setSelectedAreaId("");
    setZoneName("");
    setZoneDesc("");
    setZoneImage("");
  };

  // ---------------------------
  // HANDLE DROPDOWN CHANGE
  // ---------------------------
  const handleSelectArea = (id: string) => {
    setSelectedAreaId(id);
    const found = areas.find((a) => a.id === id);
    if (found) {
      setZoneName(found.name || "");
      setZoneDesc(found.description || "");
      setZoneImage(found.floorPlanImage || "");
    } else {
      setZoneName("");
      setZoneDesc("");
      setZoneImage("");
    }
  };

  // ---------------------------
  // IMAGE UPLOAD HANDLER
  // ---------------------------
  const getMenuImageFile = async (file: File) => {
    try {
      const res = await SupabaseImageUpload(file);
      if (res) {
        setZoneImage(res);
        toast.success("Floor plan image uploaded!");
        console.log(res);
      }
    } catch (error) {
      toast.error(`Error uploading image: ${error}`, { duration: 3000 });
    }
  };

  // ---------------------------
  // SUBMIT EDIT
  // ---------------------------
  const handleUpdateArea = async () => {
    if (!selectedAreaId) return;

    try {
      const result = await editArea({
        editAreaId: selectedAreaId,
        name: zoneName || undefined,
        description: zoneDesc || undefined,
        floorPlanImage: zoneImage || undefined,
      });

      if (result.data?.editArea?.id) {
        toast.success("Area updated successfully!", { duration: 1200 });
        // Re-fetch the list of areas to see the changes
        reexecuteQuery({ requestPolicy: "network-only" });
        closeModal();
      }
    } catch (error) {
      console.error("Error editing area:", error);
      toast.error("Failed to update area.");
    }
  };

  return (
    <>
      {/* Trigger to open modal (mobile friendly) */}
      <button
        type="button"
        onClick={openModal}
        className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 transition"
        aria-label="Edit zone"
      >
        <FaEdit className="h-5 w-5" aria-hidden="true" />
        <span>Edit Zone</span>
      </button>

      {/* EDIT ZONE MODAL */}
      <Modal isOpen={isOpen} closeModal={closeModal}>
        <div className="relative w-[min(100vw-2rem,36rem)] max-w-lg mx-auto bg-white rounded-lg shadow max-h-[90vh] overflow-y-auto overscroll-contain">
          {/* Close */}
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>

          <div className="p-4 sm:p-6">
            {/* Title & Icon */}
            <div className="text-center">
              <FaEdit
                className="text-gray-500 w-10 h-10 mb-2 mx-auto"
                aria-hidden="true"
              />
              <h2 className="text-lg font-semibold text-gray-700 mb-4">
                Edit Zone
              </h2>
            </div>

            {/* CONTENT */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateArea();
              }}
              className="flex flex-col gap-4"
            >
              {/* (Optional) Select which area to edit */}
              {areas.length > 0 && (
                <div>
                  <label
                    htmlFor="areaSelect"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Select Zone
                  </label>
                  <select
                    id="areaSelect"
                    value={selectedAreaId}
                    onChange={(e) => handleSelectArea(e.target.value)}
                    className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                  >
                    <option value="">-- Choose an area --</option>
                    {areas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Name */}
              <div>
                <label
                  htmlFor="zoneName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Zone Name
                </label>
                <input
                  id="zoneName"
                  type="text"
                  value={zoneName}
                  onChange={(e) => setZoneName(e.target.value)}
                  placeholder="Zone name"
                  className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="zoneDesc"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="zoneDesc"
                  value={zoneDesc}
                  onChange={(e) => setZoneDesc(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 min-h-[96px]"
                />
              </div>

              {/* Floor Plan Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Floor Plan Image
                </label>

                {/* Show current image thumbnail if available */}
                {zoneImage && (
                  <div className="mb-2">
                    <Image
                      width={800}
                      height={600}
                      src={zoneImage}
                      alt="Floor Plan Preview"
                      className="w-full h-auto max-h-48 object-contain border rounded"
                    />
                  </div>
                )}

                {/* Upload input */}
                <div className="rounded-lg border border-dashed border-gray-200 p-2">
                  <UploadImg
                    handleCallBack={getMenuImageFile}
                    id="editZoneFloorPlan"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-2 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto min-h-[44px] py-2 px-4 text-sm font-medium text-gray-500 bg-gray-200 rounded hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedAreaId || updating}
                  className="w-full sm:w-auto min-h-[44px] py-2 px-4 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition disabled:bg-gray-400"
                >
                  {updating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default EditZoneModal;
