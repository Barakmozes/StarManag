"use client";

import { useState } from "react";
import { HiOutlineTrash } from "react-icons/hi2";
import { useMutation } from "@urql/next";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  DeleteMenuDocument,
  DeleteMenuMutation,
  DeleteMenuMutationVariables,
} from "@/graphql/generated";
import { SupabaseImageDelete } from "@/lib/supabaseStorage";
import Modal from "@/app/components/Common/Modal";

type MenuLike = {
  id: string;
  title: string;
  image: string;
};

function extractSupabaseFilename(urlOrName: string): string | null {
  if (!urlOrName) return null;
  const clean = urlOrName.split("?")[0].split("#")[0];

  const idx = clean.lastIndexOf("/public/");
  if (idx !== -1) return clean.substring(idx + "/public/".length);

  const parts = clean.split("/");
  return parts[parts.length - 1] || null;
}

type Props = {
  menu: MenuLike;
};

const AdminDeleteMenu = ({ menu }: Props) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const closeModal = () => setIsOpen(false);
  const openModal = () => setIsOpen(true);

  const deleteMenuId = menu.id;

  const [, deleteMenu] = useMutation<DeleteMenuMutation, DeleteMenuMutationVariables>(
    DeleteMenuDocument
  );

  const handleDeleteMenu = async () => {
    const toastId = toast.loading("Deleting menu...");
    try {
      const res = await deleteMenu({ deleteMenuId });

      if (res.data?.deleteMenu?.id) {
        // Best-effort image delete (doesn't block)
        const filename = extractSupabaseFilename(menu.image);
        if (filename) {
          try {
            await SupabaseImageDelete(filename);
          } catch {
            // ignore
          }
        }

        toast.success("Menu Deleted Successfully", { id: toastId, duration: 1200 });
        setTimeout(closeModal, 700);
        router.refresh();
      } else {
        toast.error("An error occurred", { id: toastId, duration: 2000 });
      }
    } catch {
      toast.error("An error occurred", { id: toastId, duration: 2000 });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center h-11 w-11 md:h-9 md:w-9 rounded-md hover:bg-slate-100 transition"
        aria-label={`Delete ${menu.title}`}
      >
        <HiOutlineTrash className="h-6 w-6 text-red-500" />
      </button>

      <Modal isOpen={isOpen} title={menu.title} closeModal={closeModal}>
        {/* Mobile-safe modal wrapper */}
        <div className="w-[min(100vw-2rem,28rem)] max-w-full mx-auto max-h-[90vh] overflow-y-auto overscroll-contain p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="text-center bg-white">
            <HiOutlineTrash className="text-gray-400 w-11 h-11 mb-3.5 mx-auto" />

            <p className="mb-4 text-gray-500">
              Are you sure you want to delete this item?
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-2 sm:gap-3">
              <button
                onClick={closeModal}
                type="button"
                className="w-full sm:w-auto min-h-[44px] py-2 px-4 text-sm font-medium text-gray-500 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 hover:text-gray-900"
              >
                No, cancel
              </button>

              <button
                onClick={handleDeleteMenu}
                type="button"
                className="w-full sm:w-auto min-h-[44px] py-2 px-4 text-sm font-medium text-center text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Yes, I&apos;m sure
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AdminDeleteMenu;
