"use client";

import Modal from "@/app/components/Common/Modal";
import { useState } from "react";
import { HiOutlinePencilSquare } from "react-icons/hi2";
import EditRoleForm from "./EditRoleForm";
import { Role } from "@/graphql/generated";

type UserRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
};

type Props = {
  user: UserRow;
  currentUserId?: string | null;
  onChanged?: () => void;
};

const EditRoleModal = ({ user, currentUserId = null, onChanged }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const label = user.email || user.name || "user";

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center justify-center h-11 w-11 md:h-9 md:w-9 rounded-md hover:bg-slate-100 transition"
        aria-label={`Edit ${label}`}
        title="Edit user"
      >
        <HiOutlinePencilSquare className="h-6 w-6 text-green-700" />
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal} title="Edit User">
        {/* Mobile-safe modal wrapper */}
        <div className="w-[min(100vw-2rem,40rem)] max-w-full mx-auto max-h-[90vh] overflow-y-auto overscroll-contain p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <EditRoleForm
            user={user}
            currentUserId={currentUserId}
            closeModal={closeModal}
            onChanged={onChanged}
          />
        </div>
      </Modal>
    </>
  );
};

export default EditRoleModal;
