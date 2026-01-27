import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { HiOutlinePencil, HiOutlinePencilSquare } from "react-icons/hi2";
import { useMutation } from "@urql/next";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import Modal from "@/app/components/Common/Modal";
import UploadImg from "../Components/UploadImg";
import { SupabaseImageDelete, SupabaseImageUpload } from "@/lib/supabaseStorage";

import {
  EditCategoryDocument,
  EditCategoryMutation,
  EditCategoryMutationVariables,
  GetCategoriesQuery,
} from "@/graphql/generated";

type Props = {
  category: GetCategoriesQuery["getCategories"][number];
};

// NOTE: SupabaseImageDelete in your project expects a path-ish value.
// This helper makes deletion work whether you stored a filename OR a full public URL.
const getSupabaseFileName = (urlOrPath: string) => {
  if (!urlOrPath) return "";
  if (!urlOrPath.includes("http")) return urlOrPath.replace("public/", "");
  const idx = urlOrPath.lastIndexOf("/public/");
  if (idx !== -1) return urlOrPath.substring(idx + "/public/".length);
  return urlOrPath.split("/").pop() ?? urlOrPath;
};

const AdminEditCategory = ({ category }: Props) => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState(category.title);
  const [desc, setDesc] = useState(category.desc);
  const [img, setImg] = useState(category.img);

  // Keep modal form in sync (fixes exhaustive-deps warning properly)
  useEffect(() => {
    if (!isOpen) return;
    setTitle(category.title);
    setDesc(category.desc);
    setImg(category.img);
  }, [isOpen, category.title, category.desc, category.img]);

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const deleteOldCategoryImg = async () => {
    const file = category.img;
    if (!file) return;
    try {
      await SupabaseImageDelete(getSupabaseFileName(file));
    } catch (e) {
      // non-blocking
      console.warn("Failed to delete old category image:", e);
    }
  };

  const getCategoryImageFile = async (file: File) => {
    await deleteOldCategoryImg();
    try {
      const res = await SupabaseImageUpload(file);
      if (res) setImg(res);
    } catch (error) {
      toast.error(`Error uploading image: ${error}`, { duration: 3000 });
    }
  };

  const editCategoryId = category.id;
  const [_, editCategory] = useMutation<
    EditCategoryMutation,
    EditCategoryMutationVariables
  >(EditCategoryDocument);

  const handleEditCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const requiredFields = [title, desc, img];
    if (requiredFields.some((f) => !f)) {
      toast.error("Please fill in all required fields", { duration: 3000 });
      return;
    }

    try {
      const res = await editCategory({ editCategoryId, title, desc, img });

      if (res.data?.editCategory) {
        toast.success("Category Edited Successfully", { duration: 1000 });
        setTimeout(closeModal, 3000);
        router.refresh();
      } else {
        toast.error("An error occurred", { duration: 2000 });
      }
    } catch (error) {
      console.error("Error editing category:", error);
      toast.error("An error occurred", { duration: 2000 });
    }
  };

  return (
    <>
      <HiOutlinePencilSquare
        onClick={openModal}
        className="cursor-pointer h-6 w-6 text-green-600"
      />

      <Modal isOpen={isOpen} title={title} closeModal={closeModal}>
        <form onSubmit={handleEditCategory}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div className="sm:col-span-2 border-gray-300">
              <Image
                src={img || category.img}
                alt={category.title}
                width={360}
                height={200}
                className="h-32 w-full object-cover rounded-md"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="title" className="form-label">
                Title
              </label>
              <input
                id="title"
                className="form-input"
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
                className="form-input"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>

          <UploadImg
            handleCallBack={getCategoryImageFile}
            id={`editAdminCategoryImg-${category.id}`}
          />

          <button
            type="submit"
            className="mt-4 text-white inline-flex items-center bg-green-600
              hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300
              font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            <HiOutlinePencil className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
            Edit Category
          </button>
        </form>
      </Modal>
    </>
  );
};

export default AdminEditCategory;
