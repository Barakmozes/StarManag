import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { HiPlus } from "react-icons/hi2";
import { useMutation } from "@urql/next";
import toast from "react-hot-toast";

import Modal from "@/app/components/Common/Modal";
import UploadImg from "../Components/UploadImg";
import { SupabaseImageUpload } from "@/lib/supabaseStorage";
// import { categoriesData } from "@/data/categories-data";
import {
  AddCategoryDocument,
  AddCategoryMutation,
  AddCategoryMutationVariables,
} from "@/graphql/generated";

const AdminAddCategory = () => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [img, setImg] = useState("");

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const clearForm = () => {
    setTitle("");
    setDesc("");
    setImg("");
  };

  const getCategoryImageFile = async (file: File) => {
    try {
      const res = await SupabaseImageUpload(file);
      if (res) setImg(res);
    } catch (error) {
      toast.error(`Error uploading image: ${error}`, { duration: 3000 });
    }
  };

  const [_, addCategory] = useMutation<
    AddCategoryMutation,
    AddCategoryMutationVariables
  >(AddCategoryDocument);

  const handleAddCategory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const requiredFields = [title, desc, img];
    if (requiredFields.some((f) => !f)) {
      toast.error("Please fill in all required fields", { duration: 3000 });
      return;
    }

    try {
      const res = await addCategory({ title, desc, img });

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

//   const seedCategories = async () => {
//   try {
//     for (const c of categoriesData) {
//       const title = c.title?.trim();
//       if (!title) continue; // אצלך יש פריט שחסר לו title

//       await addCategory({
//         title,
//         desc: c.desc,
//         img: c.imageSrc, // ✅ מיפוי: imageSrc -> img
//       });
//     }

//     toast.success("כל הקטגוריות נוספו בהצלחה");
//     router.refresh();
//   } catch (err) {
//     toast.error("שגיאה בהוספת קטגוריות");
//     console.error(err);
//   }
// };


  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="text-white inline-flex items-center whitespace-nowrap bg-green-600
         hover:bg-green-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
      >
        <HiPlus className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
        Add Category
      </button>
{/* <button
  type="button"
  onClick={seedCategories}
  className="bg-slate-200 text-gray-600 px-4 py-2 rounded-lg hover:bg-green-200 hover:text-green-700"
>
  Seed Categories
</button> */}

      <Modal isOpen={isOpen} title="Add Category" closeModal={closeModal}>
        <form onSubmit={handleAddCategory}>
          <div className="grid gap-4 mb-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="title" className="form-label">
                Title
              </label>
              <input
                id="title"
                className="form-input"
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
                className="form-input"
                placeholder="Short description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>
          </div>

          <UploadImg handleCallBack={getCategoryImageFile} id="addAdminCategoryImg" />

          <button
            type="submit"
            className="mt-4 text-white inline-flex items-center bg-green-600
              hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300
              font-medium rounded-lg text-sm px-5 py-2.5 text-center"
          >
            <HiPlus className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
            Save Category
          </button>
        </form>
      </Modal>
    </>
  );
};

export default AdminAddCategory;
