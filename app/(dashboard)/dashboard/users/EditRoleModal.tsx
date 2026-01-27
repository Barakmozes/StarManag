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

  return (
    <>
      <HiOutlinePencilSquare onClick={openModal} className="cursor-pointer h-6 w-6" />
      <Modal isOpen={isOpen} closeModal={closeModal} title="Edit User">
        <EditRoleForm
          user={user}
          currentUserId={currentUserId}
          closeModal={closeModal}
          onChanged={onChanged}
        />
      </Modal>
    </>
  );
};

export default EditRoleModal;
