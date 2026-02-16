"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@urql/next";
import Modal from "../../Common/Modal";
import AddZoneModal from "./AddZoneModal";
import {
  AddAreaDocument,
  AddAreaMutation,
  AddAreaMutationVariables,
  GetAreasNameDescriptionDocument,
} from "@/graphql/generated";
import toast from "react-hot-toast";

const AddZoneForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [zoneDescription, setZoneDescription] = useState("");

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const [, reexecuteQuery] = useQuery({
    query: GetAreasNameDescriptionDocument,
    pause: true,
    variables: {
      orderBy: { createdAt: "asc" },
    },
  });

  const [{ fetching, error }, addArea] = useMutation<
    AddAreaMutation,
    AddAreaMutationVariables
  >(AddAreaDocument);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    try {
      const result = await addArea({
        name: zoneName,
        description: zoneDescription,
      });

      if (result.data?.addArea?.id) {
        await reexecuteQuery({ requestPolicy: "network-only" });
        setZoneName("");
        setZoneDescription("");
        closeModal();
        toast.success("Area successfully added and updated!", { duration: 800 });
      }
    } catch (err) {
      console.error("Failed to add area:", err);
    }
  };

  return (
    <>
      <AddZoneModal openModal={openModal} />

      <Modal isOpen={isOpen} closeModal={closeModal}>
        <form
          onSubmit={handleSubmit}
className="relative w-full max-w-lg md:max-w-4xl mx-auto bg-white rounded-xl shadow overflow-hidden"        >
          <button
            type="button"
            onClick={closeModal}
            className="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition"
            aria-label="Close"
          >
            <span aria-hidden="true">×</span>
          </button>

          <h2 className="text-lg sm:text-xl font-bold text-gray-800 pr-10">
            Create a New Zone
          </h2>

          <div className="mt-4 flex flex-col gap-4">
            <div>
              <label htmlFor="zoneName" className="block text-sm font-medium mb-1">
                Zone Name <span className="text-red-500">*</span>
              </label>
              <input
                id="zoneName"
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="Enter zone name"
                className="w-full min-h-[44px] px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200"
                required
              />
            </div>

            <div>
              <label htmlFor="zoneDescription" className="block text-sm font-medium mb-1">
                Description (optional)
              </label>
              <textarea
                id="zoneDescription"
                value={zoneDescription}
                onChange={(e) => setZoneDescription(e.target.value)}
                placeholder="Describe this zone"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring focus:ring-blue-200 min-h-[110px]"
                rows={3}
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm break-words">
                Something went wrong: {error.message}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={fetching}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {fetching ? "Adding..." : "Add Zone"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default AddZoneForm;
