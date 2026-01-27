import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { useMutation } from "@urql/next";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import Modal from "@/app/components/Common/Modal";
import { SupabaseImageDelete } from "@/lib/supabaseStorage";

import {
  DeleteCategoryDocument,
  DeleteCategoryMutation,
  DeleteCategoryMutationVariables,
  GetCategoriesQuery,
} from "@/graphql/generated";

type Props = {
  category: GetCategoriesQuery["getCategories"][number];
};

const getSupabaseFileName = (urlOrPath: string) => {
  if (!urlOrPath) return "";
  if (!urlOrPath.includes("http")) return urlOrPath.replace("public/", "");
  const idx = urlOrPath.lastIndexOf("/public/");
  if (idx !== -1) return urlOrPath.substring(idx + "/public/".length);
  return urlOrPath.split("/").pop() ?? urlOrPath;
};

const AdminDeleteCategory = ({ category }: Props) => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const deleteCategoryId = category.id;

  const [_, deleteCategory] = useMutation<
    DeleteCategoryMutation,
    DeleteCategoryMutationVariables
  >(DeleteCategoryDocument);

  const deleteOldCategoryImg = async () => {
    const file = category.img;
    if (!file) return;
    try {
      await SupabaseImageDelete(getSupabaseFileName(file));
    } catch (e) {
      console.warn("Failed to delete old category image:", e);
    }
  };

  const handleDeleteCategory = async () => {
    try {
      // best-effort, don’t block DB deletion if the storage delete fails
      await deleteOldCategoryImg();

      const res = await deleteCategory({ deleteCategoryId });

      if (res.data?.deleteCategory) {
        toast.success("Category Deleted Successfully", { duration: 1000 });
        setTimeout(closeModal, 3000);
        router.refresh();
      } else {
        toast.error("An error occurred", { duration: 2000 });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(
        "Delete failed. If this category has menus attached, remove/move them first.",
        { duration: 3000 }
      );
    }
  };

  return (
    <>
      <HiOutlineTrash
        onClick={openModal}
        className="cursor-pointer h-6 w-6 text-red-600"
      />

      <Modal isOpen={isOpen} title={category.title} closeModal={closeModal}>
        <div className="text-center">
          <HiOutlineTrash className="mx-auto mb-4 text-gray-400 w-12 h-12" />
          <h3 className="mb-5 text-lg font-normal text-gray-500">
            Are you sure you want to delete this category?
          </h3>

          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={handleDeleteCategory}
              className="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300
              font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center"
            >
              Yes, I&apos;m sure
            </button>

            <button
              type="button"
              onClick={closeModal}
              className="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200
              rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900"
            >
              No, cancel
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminDeleteCategory;
