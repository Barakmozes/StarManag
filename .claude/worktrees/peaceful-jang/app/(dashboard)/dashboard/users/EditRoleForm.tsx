"use client";

import React, { useMemo, useState } from "react";
import { gql, useMutation } from "@urql/next";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { GoChevronDown } from "react-icons/go";
import { HiUser, HiOutlineTrash } from "react-icons/hi2";

import UploadImg from "../Components/UploadImg";
import { SupabaseImageUpload } from "@/lib/supabaseStorage";
import { Role } from "@/graphql/generated";

/* -------------------------------- GraphQL -------------------------------- */

const UPDATE_USER_PROFILE = gql`
  mutation UpdateUserProfile($id: String!, $name: String, $email: String, $image: String) {
    updateUserProfile(id: $id, name: $name, email: $email, image: $image) {
      id
      name
      email
      image
    }
  }
`;

const EDIT_USER_ROLE = gql`
  mutation EditUserRole($id: String!, $role: Role!) {
    editUserRole(id: $id, role: $role) {
      id
      role
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id) {
      id
      email
    }
  }
`;

/* --------------------------------- Types --------------------------------- */

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
  closeModal: () => void;
  onChanged?: () => void;
};

export default function EditRoleForm({
  user,
  currentUserId = null,
  closeModal,
  onChanged,
}: Props) {
  const router = useRouter();

  const [{ fetching: updatingProfile }, updateUserProfile] = useMutation<
    { updateUserProfile: { id: string } },
    { id: string; name?: string; email?: string; image?: string }
  >(UPDATE_USER_PROFILE);

  const [{ fetching: updatingRole }, editUserRole] = useMutation<
    { editUserRole: { id: string; role: Role } },
    { id: string; role: Role }
  >(EDIT_USER_ROLE);

  const [{ fetching: deleting }, deleteUser] = useMutation<
    { deleteUser: { id: string } },
    { id: string }
  >(DELETE_USER);

  const ROLES: Role[] = useMemo(
    () => [Role.User, Role.Admin, Role.Manager,  Role.Waiter, Role.Delivery],
    []
  );

  // form state
  const [name, setName] = useState(user.name ?? "");
  const [email, setEmail] = useState(user.email ?? "");
  const [role, setRole] = useState<Role>(user.role);

  const [showChangeRole, setShowChangeRole] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangeAvatar, setShowChangeAvatar] = useState(false);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const saving = updatingProfile || updatingRole || deleting;

  const normalizedOriginalEmail = (user.email ?? "").trim().toLowerCase();
  const normalizedNextEmail = email.trim().toLowerCase();

  const nameChanged = showEditDetails && name.trim() !== (user.name ?? "");
  const emailChanged =
    showEditDetails && showChangeEmail && normalizedNextEmail !== normalizedOriginalEmail;
  const roleChanged = showChangeRole && role !== user.role;
  const imageChanged = showChangeAvatar && !!avatarFile;

  const hasAnyChange = nameChanged || emailChanged || roleChanged || imageChanged;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAnyChange) {
      toast("No changes to save.");
      return;
    }

    if (emailChanged && (!normalizedNextEmail || !normalizedNextEmail.includes("@"))) {
      toast.error("Please enter a valid email.");
      return;
    }

    try {
      let uploadedUrl: string | undefined;

      if (imageChanged && avatarFile) {
        uploadedUrl = await SupabaseImageUpload(avatarFile);
      }

      if (nameChanged || emailChanged || uploadedUrl) {
        const res = await updateUserProfile({
          id: user.id,
          name: nameChanged ? name.trim() || undefined : undefined,
          email: emailChanged ? normalizedNextEmail : undefined,
          image: uploadedUrl,
        });

        if (res.error) throw res.error;
      }

      if (roleChanged) {
        const res = await editUserRole({ id: user.id, role });
        if (res.error) throw res.error;
      }

      toast.success("User updated");
      closeModal();
      router.refresh();
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update user");
    }
  };

  const onDelete = async () => {
    if (currentUserId && currentUserId === user.id) {
      toast.error("You can’t delete your own account.");
      return;
    }

    const label = user.email || user.name || user.id;
    const ok = confirm(`Delete user: ${label} ?\n\nThis action is permanent.`);
    if (!ok) return;

    try {
      const res = await deleteUser({ id: user.id });
      if (res.error) throw res.error;

      toast.success("User deleted");
      closeModal();
      router.refresh();
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete user");
    }
  };

  return (
    <form onSubmit={onSave} className="my-4 sm:my-6 space-y-5">
      {/* Read-only email */}
      <div>
        <label className="form-label">Current Email</label>
        <input type="text" className="form-input min-h-[44px]" value={user.email ?? ""} disabled />
      </div>

      {/* Toggle edit sections */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3">
          <input
            className="w-6 h-6 accent-green-600 bg-slate-100 rounded focus:outline-none"
            type="checkbox"
            checked={showEditDetails}
            onChange={(e) => setShowEditDetails(e.target.checked)}
          />
          <span className="text-slate-400">Edit name / email / avatar</span>
        </label>

        <label className="flex items-center gap-3">
          <input
            className="w-6 h-6 accent-green-600 bg-slate-100 rounded focus:outline-none"
            type="checkbox"
            checked={showChangeRole}
            onChange={(e) => setShowChangeRole(e.target.checked)}
          />
          <div className="flex items-center">
            <HiUser className="mr-2 h-5 w-5 text-green-700" />
            <span className="text-slate-400">Change Role</span>
          </div>
        </label>
      </div>

      {/* Details section */}
      {showEditDetails ? (
        <div className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input
              className="form-input min-h-[44px]"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              inputMode="email"
              className="form-input min-h-[44px]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={!showChangeEmail}
              placeholder="name@example.com"
              autoComplete="email"
            />

            <label className="mt-3 flex items-center gap-3">
              <input
                className="w-6 h-6 accent-green-600 bg-slate-100 rounded focus:outline-none"
                type="checkbox"
                checked={showChangeEmail}
                onChange={(e) => setShowChangeEmail(e.target.checked)}
              />
              <span className="text-slate-400">Change email</span>
            </label>

            <p className="text-xs text-slate-400 mt-2">
              Note: changing email may affect relations that use user email.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3">
              <input
                className="w-6 h-6 accent-green-600 bg-slate-100 rounded focus:outline-none"
                type="checkbox"
                checked={showChangeAvatar}
                onChange={(e) => setShowChangeAvatar(e.target.checked)}
              />
              <span className="text-slate-400">Change avatar</span>
            </label>

            {showChangeAvatar ? (
              <div className="mt-3">
                <UploadImg id={`edit-user-img-${user.id}`} handleCallBack={(f) => setAvatarFile(f)} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Role section */}
      {showChangeRole ? (
        <div>
          <label className="form-label">User Role</label>
          <div className="relative inline-block w-full">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="min-h-[44px] block w-full rounded-md appearance-none bg-white border border-green-400 px-4 py-2 pr-8 leading-tight focus:outline-none"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <GoChevronDown className="dark:text-gray-300" />
            </div>
          </div>
        </div>
      ) : null}

      <button type="submit" className="form-button w-full min-h-[44px]" disabled={saving}>
        {saving ? "Saving..." : "Save Changes"}
      </button>

      {/* Danger zone */}
      <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4">
        <div className="font-semibold text-red-700">Danger zone</div>
        <p className="text-sm text-red-700/80 mt-1">
          Deleting a user is permanent and may fail if the user is referenced by other records.
        </p>

        <button
          type="button"
          onClick={onDelete}
          disabled={saving}
          className="mt-3 w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-500 disabled:opacity-50"
        >
          <HiOutlineTrash className="h-5 w-5" />
          Delete User
        </button>
      </div>
    </form>
  );
}
