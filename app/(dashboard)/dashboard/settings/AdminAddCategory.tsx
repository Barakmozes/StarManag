"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { HiPlus } from "react-icons/hi2";
import { useMutation } from "@urql/next";
import toast from "react-hot-toast";

import Modal from "@/app/components/Common/Modal";
import UploadImg from "../Components/UploadImg";
import { SupabaseImageUpload } from "@/lib/supabaseStorage";
import {
  AddCategoryDocument,
  AddCategoryMutation,
  AddCategoryMutationVariables,
  DisplayStation,
} from "@/graphql/generated";

const AdminAddCategory = () => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");
  const [station, setStation] = useState<DisplayStation>(DisplayStation.Kitchen);

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const clearForm = () => {
    setTitle("");
    setDesc("");
    setImg("");
    setStation(DisplayStation.Kitchen);
  };

  const getCategoryImageFile = async (file: File) => {
    try {
      const res = await SupabaseImageUpload(file);
      if (res) setImg(res);
    } catch (error) {
      toast.error(`Error uploading image: ${error}`, { duration: 3000 });
    }
  };

  const [, addCategory] = useMutation<AddCategoryMutation, AddCategoryMutationVariables>(
    AddCategoryDocument
  );

  const handleAddCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const requiredFields = [title, desc, img];
    if (requiredFields.some((f) => !f)) {
      toast.error("Please fill in all required fields", { duration: 3000 });
      return;
    }

    try {
      const res = await addCategory({ title, desc, img, station });

      if (res.data?.addCategory) {
        toast.success("Category Added Successfully", { duration: 1000 });
        clearForm();
        setTimeout(closeModal, 3000);
        router.refresh();
      } else {
        toast.error("An error occurred", { duration: 2000 });
      }
    } catch (error) {
      console.error("Error adding category:", error);
      toast.error("An error occurred", { duration: 2000 });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="w-full sm:w-auto min-h-11 text-white inline-flex items-center justify-center sm:whitespace-nowrap bg-green-600 hover:bg-green-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
      >
        <HiPlus className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
        Add Category
      </button>

      <Modal isOpen={isOpen} title="Add Category" closeModal={closeModal}>
        {/* Mobile-safe: prevent overflow + safe-area bottom padding */}
        <div className="max-h-[90vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+16px)]">
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="form-label">
                  Title
                </label>
                <input
                  id="title"
                  className="form-input min-h-11 text-base sm:text-sm"
                  placeholder="Category title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="desc" className="form-label">
                  Description
                </label>
                <textarea
                  id="desc"
                  rows={3}
                  className="form-input text-base sm:text-sm"
                  placeholder="Short description"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="station" className="form-label">
                  Station
                </label>
                <select
                  id="station"
                  className="form-input min-h-11 text-base sm:text-sm"
                  value={station}
                  onChange={(e) => setStation(e.target.value as DisplayStation)}
                >
                  <option value={DisplayStation.Kitchen}>Kitchen (food)</option>
                  <option value={DisplayStation.Bar}>Bar (drinks)</option>
                </select>
              </div>
            </div>

            <UploadImg handleCallBack={getCategoryImageFile} id="addAdminCategoryImg" />

            <button
              type="submit"
              className="w-full sm:w-auto min-h-11 text-white inline-flex items-center justify-center bg-green-600 hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              <HiPlus className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
              Save Category
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
};

export default AdminAddCategory;
