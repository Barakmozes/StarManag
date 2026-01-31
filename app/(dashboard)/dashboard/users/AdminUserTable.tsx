"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { gql, useMutation, useQuery } from "@urql/next";;
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { GoChevronDown } from "react-icons/go";
import { HiMagnifyingGlass, HiOutlinePlus, HiArrowPath } from "react-icons/hi2";

import TableWrapper from "../Components/TableWrapper";
import EditRoleModal from "./EditRoleModal";
import Modal from "@/app/components/Common/Modal";
import UploadImg from "../Components/UploadImg";
import { SupabaseImageUpload } from "@/lib/supabaseStorage";
import { Role } from "@/graphql/generated";

/* -------------------------------- GraphQL -------------------------------- */

const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      name
      email
      image
      role
      createdAt
      updatedAt
    }
  }
`;

const ADD_PROFILE = gql`
  mutation AddProfile($email: String!, $name: String, $img: String, $phone: String) {
    addProfile(email: $email, name: $name, img: $img, phone: $phone) {
      id
      name
      img
      # NOTE: In your schema Profile.email is a relation to User (field name is "email")
      email {
        id
        email
        role
        name
        image
      }
    }
  }
`;

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

/* --------------------------------- Types --------------------------------- */

type UserRow = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: Role;
  createdAt?: any;
  updatedAt?: any;
};

type GetUsersData = { getUsers: UserRow[] };

type AddProfileData = {
  addProfile: {
    id: string;
    name?: string | null;
    img?: string | null;
    email: {
      id: string;
      email?: string | null;
      role: Role;
      name?: string | null;
      image?: string | null;
    };
  };
};

type UpdateUserProfileData = {
  updateUserProfile: { id: string; name?: string | null; email?: string | null; image?: string | null };
};

type EditUserRoleData = { editUserRole: { id: string; role: Role } };

/* -------------------------------- Helpers -------------------------------- */

function clampInt(v: string | null, fallback: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function isRole(val: string | null): val is Role {
  if (!val) return false;
  return (Object.values(Role) as string[]).includes(val);
}

function mutateUrl(
  router: ReturnType<typeof useRouter>,
  pathname: string,
  current: URLSearchParams,
  patch: (next: URLSearchParams) => void
) {
  const next = new URLSearchParams(current.toString());
  patch(next);
  const qs = next.toString();
  router.replace(qs ? `${pathname}?${qs}` : pathname);
}

/* ------------------------------ Add User Modal ---------------------------- */

function AddUserModal({
  canAdd,
  onCreated,
}: {
  canAdd: boolean;
  onCreated: () => void;
}) {
  const router = useRouter();

  const [{ fetching: creatingProfile }, addProfile] = useMutation<AddProfileData, { email: string; name?: string; img?: string; phone?: string }>(
    ADD_PROFILE
  );
  const [{ fetching: updatingUser }, updateUserProfile] = useMutation<
    UpdateUserProfileData,
    { id: string; name?: string; email?: string; image?: string }
  >(UPDATE_USER_PROFILE);
  const [{ fetching: updatingRole }, editUserRole] = useMutation<EditUserRoleData, { id: string; role: Role }>(EDIT_USER_ROLE);

  const [isOpen, setIsOpen] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>(Role.User);
  const [file, setFile] = useState<File | null>(null);

  const saving = creatingProfile || updatingUser || updatingRole;

  const close = () => {
    setIsOpen(false);
    setName("");
    setEmail("");
    setPhone("");
    setRole(Role.User);
    setFile(null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      toast.error("Please enter a valid email.");
      return;
    }

    try {
      let imgUrl: string | undefined;
      if (file) imgUrl = await SupabaseImageUpload(file);

      // Create profile (and in your backend it may also create/connect the user by email)
      const res = await addProfile({
        email: normalizedEmail,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        img: imgUrl,
      });

      if (res.error) throw res.error;

      // Try to get created user id from the profile relation (Profile.email -> User)
      const createdUserId = res.data?.addProfile?.email?.id;

      // Update user fields (name/image) so the Users table displays nicely
      if (createdUserId) {
        const up = await updateUserProfile({
          id: createdUserId,
          name: name.trim() || undefined,
          image: imgUrl,
        });
        if (up.error) throw up.error;

        // Set role if not default
        if (role && role !== Role.User) {
          const rr = await editUserRole({ id: createdUserId, role });
          if (rr.error) throw rr.error;
        }
      }

      toast.success("User created");
      close();
      router.refresh();
      onCreated();
    } catch (err: any) {
      toast.error(err?.message || "Failed to create user");
    }
  };

  if (!canAdd) return null;

  return (
    <>
      <button
        type="button"
        className="flex items-center gap-2 rounded-md bg-green-800 px-4 py-2 text-white hover:bg-green-700"
        onClick={() => setIsOpen(true)}
      >
        <HiOutlinePlus className="h-5 w-5" />
        Add User
      </button>

      <Modal isOpen={isOpen} closeModal={close} title="Add User">
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input
              className="formInput"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="form-label">Email *</label>
            <input
              className="formInput"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div>
            <label className="form-label">Phone</label>
            <input
              className="formInput"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div>
            <label className="form-label">Role</label>
            <div className="relative inline-block w-full">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="block w-full rounded-md appearance-none bg-white border border-green-400 px-4 py-2 pr-8 leading-tight focus:outline-none"
              >
                <option value={Role.User}>USER</option>
                <option value={Role.Admin}>ADMIN</option>
                <option value={Role.Manager}>MANAGER</option>
                <option value={Role.Chef}>CHEF</option>
                <option value={Role.Waiter}>WAITER</option>
                <option value={Role.Delivery}>DELIVERY</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <GoChevronDown className="dark:text-gray-300" />
              </div>
            </div>
          </div>

          <UploadImg id="add-user-img" handleCallBack={(f) => setFile(f)} />

          <button type="submit" className="form-button w-full" disabled={saving}>
            {saving ? "Saving..." : "Create"}
          </button>
        </form>
      </Modal>
    </>
  );
}

/* -------------------------------- Component ------------------------------- */

type Props = {
  currentUserId?: string | null;
  currentUserRole?: string | null;
};

const AdminUserTable = ({ currentUserId = null, currentUserRole = null }: Props) => {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [{ data, fetching, error }, reexecuteQuery] = useQuery<GetUsersData>({
    query: GET_USERS,
    requestPolicy: "cache-and-network",
  });

  const refetch = () => reexecuteQuery({ requestPolicy: "network-only" });

  // URL state
  const qParam = sp.get("q") ?? "";
  const roleParam = sp.get("role");
  const sortParam = sp.get("sort") ?? "createdAt_desc";
  const page = clampInt(sp.get("page"), 1, 1, 9999);
  const take = clampInt(sp.get("take"), 20, 5, 100);

  // Search draft (debounced URL update)
  const [qDraft, setQDraft] = useState(qParam);
  useEffect(() => setQDraft(qParam), [qParam]);

  useEffect(() => {
    const t = setTimeout(() => {
      mutateUrl(router, pathname, new URLSearchParams(sp.toString()), (next) => {
        const trimmed = qDraft.trim();
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        next.delete("page"); // reset page on search change
      });
    }, 350);

    return () => clearTimeout(t);
  }, [qDraft, router, pathname, sp]);

  const users = useMemo(() => data?.getUsers ?? [],[data?.getUsers]);

  const filteredSorted = useMemo(() => {
    let list = [...users];

    const q = qParam.trim().toLowerCase();
    if (q) {
      list = list.filter((u) => {
        const name = (u.name ?? "").toLowerCase();
        const email = (u.email ?? "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    if (isRole(roleParam)) {
      list = list.filter((u) => u.role === roleParam);
    }

    // Sorting (client-side)
    switch (sortParam) {
      case "name_asc":
        list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
        break;
      case "name_desc":
        list.sort((a, b) => (b.name ?? "").localeCompare(a.name ?? ""));
        break;
      case "email_asc":
        list.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
        break;
      case "email_desc":
        list.sort((a, b) => (b.email ?? "").localeCompare(a.email ?? ""));
        break;
      case "role_asc":
        list.sort((a, b) => String(a.role).localeCompare(String(b.role)));
        break;
      case "role_desc":
        list.sort((a, b) => String(b.role).localeCompare(String(a.role)));
        break;
      case "createdAt_asc":
        list.sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime());
        break;
      case "createdAt_desc":
      default:
        list.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
        break;
    }

    return list;
  }, [users, qParam, roleParam, sortParam]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / take));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * take;
  const pageItems = filteredSorted.slice(start, start + take);

  const setPage = (nextPage: number) => {
    mutateUrl(router, pathname, new URLSearchParams(sp.toString()), (next) => {
      next.set("page", String(nextPage));
    });
  };

  const clearFilters = () => {
    router.replace(pathname);
  };

  return (
    <TableWrapper title="All Users">
      {/* Toolbar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative w-full md:w-[320px]">
            <HiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              className="w-full rounded-md border border-slate-200 bg-white py-2 pl-10 pr-3 text-slate-700 focus:outline-none"
              placeholder="Search name/email..."
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
            />
          </div>

          {/* Role filter */}
          <div className="relative w-full md:w-[210px]">
            <select
              value={roleParam ?? ""}
              onChange={(e) => {
                mutateUrl(router, pathname, new URLSearchParams(sp.toString()), (next) => {
                  const v = e.target.value;
                  if (v) next.set("role", v);
                  else next.delete("role");
                  next.delete("page");
                });
              }}
              className="block w-full rounded-md appearance-none bg-white border border-slate-200 px-4 py-2 pr-8 leading-tight focus:outline-none"
            >
              <option value="">All roles</option>
              <option value={Role.Admin}>ADMIN</option>
              <option value={Role.Manager}>MANAGER</option>
              <option value={Role.Chef}>CHEF</option>
              <option value={Role.Waiter}>WAITER</option>
              <option value={Role.Delivery}>DELIVERY</option>
              <option value={Role.User}>USER</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <GoChevronDown className="dark:text-gray-300" />
            </div>
          </div>

          {/* Sort */}
          <div className="relative w-full md:w-[220px]">
            <select
              value={sortParam}
              onChange={(e) => {
                mutateUrl(router, pathname, new URLSearchParams(sp.toString()), (next) => {
                  next.set("sort", e.target.value);
                  next.delete("page");
                });
              }}
              className="block w-full rounded-md appearance-none bg-white border border-slate-200 px-4 py-2 pr-8 leading-tight focus:outline-none"
            >
              <option value="createdAt_desc">Created: Newest</option>
              <option value="createdAt_asc">Created: Oldest</option>
              <option value="name_asc">Name: A → Z</option>
              <option value="name_desc">Name: Z → A</option>
              <option value="email_asc">Email: A → Z</option>
              <option value="email_desc">Email: Z → A</option>
              <option value="role_asc">Role: A → Z</option>
              <option value="role_desc">Role: Z → A</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <GoChevronDown className="dark:text-gray-300" />
            </div>
          </div>

          {/* Page size */}
          <div className="relative w-full md:w-[160px]">
            <select
              value={String(take)}
              onChange={(e) => {
                mutateUrl(router, pathname, new URLSearchParams(sp.toString()), (next) => {
                  next.set("take", e.target.value);
                  next.delete("page");
                });
              }}
              className="block w-full rounded-md appearance-none bg-white border border-slate-200 px-4 py-2 pr-8 leading-tight focus:outline-none"
            >
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <GoChevronDown className="dark:text-gray-300" />
            </div>
          </div>

          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            onClick={() => refetch()}
            disabled={fetching}
          >
            <HiArrowPath className={`h-5 w-5 ${fetching ? "animate-spin" : ""}`} />
            Refresh
          </button>

          {/* For safety: only ADMIN can create users */}
          
          <AddUserModal  canAdd={currentUserRole === "ADMIN"} onCreated={refetch} /> (-damo)
         
        </div>
      </div>

      {/* Info / Errors */}
      <div className="mb-3 text-sm text-slate-500 flex items-center justify-between">
        <span>
          {fetching ? "Loading..." : `Showing ${pageItems.length} of ${total} result(s)`}
        </span>
        <span>
          Page {safePage} / {totalPages}
        </span>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">Could not load users</div>
          <div className="text-sm mt-1">{error.message}</div>
        </div>
      ) : null}

      {/* Table */}
      <table className="w-full border text-left text-slate-500">
        <thead className="text-xs overflow-x-auto whitespace-nowrap text-slate-700 uppercase bg-slate-100">
          <tr>
            <th scope="col" className="px-6 py-3">
              Avatar
            </th>
            <th scope="col" className="px-6 py-3">
              Name
            </th>
            <th scope="col" className="px-6 py-3">
              Email
            </th>
            <th scope="col" className="px-6 py-3">
              Role
            </th>
            <th scope="col" className="px-6 py-3">
              Edit
            </th>
          </tr>
        </thead>

        <tbody>
          {fetching && pageItems.length === 0 ? (
            Array.from({ length: 6 }).map((_, i) => (
              <tr className="bg-white" key={`skeleton-${i}`}>
                <td className="px-6 py-2">
                  <div className="h-[50px] w-[50px] rounded-full bg-slate-200 animate-pulse" />
                </td>
                <td className="px-6 py-2">
                  <div className="h-4 w-44 bg-slate-200 animate-pulse rounded" />
                </td>
                <td className="px-6 py-2">
                  <div className="h-4 w-60 bg-slate-200 animate-pulse rounded" />
                </td>
                <td className="px-6 py-2">
                  <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                </td>
                <td className="px-6 py-2">
                  <div className="h-6 w-10 bg-slate-200 animate-pulse rounded" />
                </td>
              </tr>
            ))
          ) : pageItems.length === 0 ? (
            <tr className="bg-white">
              <td className="px-6 py-6" colSpan={5}>
                No users found.
              </td>
            </tr>
          ) : (
            pageItems.map((user) => (
              <tr className="bg-white" key={user.id}>
                <td className="px-6 py-2">
                  <Image
                    src={user.image || "/img/humans/pro.jpg"}
                    width={50}
                    height={50}
                    alt="avatar"
                    className="rounded-full object-cover"
                  />
                </td>
                <td className="px-6 py-2">{user.name || "-"}</td>
                <td className="px-6 py-2">{user.email || "-"}</td>
                <td className="px-6 py-2">{user.role}</td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <EditRoleModal
                    user={user}
                    currentUserId={currentUserId}
                    onChanged={() => {
                      refetch();
                    }}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-slate-700 disabled:opacity-50"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            Prev
          </button>

          <div className="text-sm text-slate-500">
            Page {safePage} / {totalPages}
          </div>

          <button
            type="button"
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-slate-700 disabled:opacity-50"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </TableWrapper>
  );
};

export default AdminUserTable;
