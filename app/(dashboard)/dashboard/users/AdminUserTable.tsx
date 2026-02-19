"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { gql, useMutation, useQuery } from "@urql/next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { GoChevronDown } from "react-icons/go";
import { HiOutlinePlus, HiArrowPath, HiOutlineBell } from "react-icons/hi2";

import TableWrapper from "../Components/TableWrapper";
import EditRoleModal from "./EditRoleModal";
import Modal from "@/app/components/Common/Modal";
import UploadImg from "../Components/UploadImg";
import { SupabaseImageUpload } from "@/lib/supabaseStorage";
import { 
  Role, 
  AddNotificationDocument, 
  type AddNotificationMutation, 
  type AddNotificationMutationVariables 
} from "@/graphql/generated";


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
  updateUserProfile: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
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

function roleBadgeClass(role: Role) {
  if (role === Role.Admin) return "bg-red-100 text-red-700";
  if (role === Role.Manager) return "bg-green-100 text-green-700";
  if (role === Role.Waiter) return "bg-blue-100 text-blue-700";
  if (role === Role.Delivery) return "bg-purple-100 text-purple-700";
  return "bg-slate-100 text-slate-700";
}

/* ------------------------------ Notify Modal ------------------------------ */

function NotifyUserAction({ user }: { user: UserRow }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState("INFO");
  const [priority, setPriority] = useState("NORMAL");

  const [{ fetching, }, executeMutation] = useMutation<
    AddNotificationMutation,
    AddNotificationMutationVariables
  >(AddNotificationDocument);

  const close = () => {
    setIsOpen(false);
    setMessage("");
    setType("INFO");
    setPriority("NORMAL");
   
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user.email) {
      toast.error("This user does not have a valid email.");
      return;
    }

    if (!message.trim()) {
      toast.error("Message is required.");
      return;
    }

    const res = await executeMutation({
      userEmail: user.email,
      type,
      message: message.trim(),
      priority: priority as any, 
      status: "UNREAD" as any,   
    });

    if (res.error) {
      toast.error(res.error.message || "Failed to send notification.");
    } else {
      
      toast.success(`Notification sent to ${user.name || user.email}`);
      close();
        
    }
  };

  if (!user.email) {
    return (
      <button disabled className="p-2 text-slate-300 cursor-not-allowed rounded-md">
        <HiOutlineBell className="h-5 w-5" />
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
        title={`Notify ${user.name || user.email}`}
      >
        <HiOutlineBell className="h-5 w-5" />
      </button>

      <Modal isOpen={isOpen} closeModal={close} title={`Notify ${user.name || user.email}`}>
        <div className="w-[min(100vw-2rem,34rem)] max-w-full mx-auto max-h-[90vh] overflow-y-auto overscroll-contain p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Type</label>
                <div className="relative inline-block w-full">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="min-h-[44px] block w-full rounded-md appearance-none bg-white border border-slate-300 px-4 py-2 pr-8 leading-tight focus:border-blue-500 focus:outline-none"
                  >
                    <option value="INFO">Information</option>
                    <option value="ALERT">Alert</option>
                    <option value="PROMO">Promotion</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <GoChevronDown />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Priority</label>
                <div className="relative inline-block w-full">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="min-h-[44px] block w-full rounded-md appearance-none bg-white border border-slate-300 px-4 py-2 pr-8 leading-tight focus:border-blue-500 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                    <GoChevronDown />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="form-label">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                className="form-input min-h-[100px] resize-none focus:border-blue-500"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your personalized notification here..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              disabled={fetching}
            >
              <HiOutlineBell className="w-5 h-5" />
              {fetching ? "Sending..." : "Send Notification"}
            </button>
          </form>
        </div>
      </Modal>
    </>
  );
}

/* ------------------------------ Add User Modal ---------------------------- */

function AddUserModal({ canAdd, onCreated }: { canAdd: boolean; onCreated: () => void }) {
  const router = useRouter();

  const [{ fetching: creatingProfile }, addProfile] = useMutation<
    AddProfileData,
    { email: string; name?: string; img?: string; phone?: string }
  >(ADD_PROFILE);

  const [{ fetching: updatingUser }, updateUserProfile] = useMutation<
    UpdateUserProfileData,
    { id: string; name?: string; email?: string; image?: string }
  >(UPDATE_USER_PROFILE);

  const [{ fetching: updatingRole }, editUserRole] = useMutation<
    EditUserRoleData,
    { id: string; role: Role }
  >(EDIT_USER_ROLE);

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

      const res = await addProfile({
        email: normalizedEmail,
        name: name.trim() || undefined,
        phone: phone.trim() || undefined,
        img: imgUrl,
      });

      if (res.error) throw res.error;

      const createdUserId = res.data?.addProfile?.email?.id;

      if (createdUserId) {
        const up = await updateUserProfile({
          id: createdUserId,
          name: name.trim() || undefined,
          image: imgUrl,
        });
        if (up.error) throw up.error;

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
        className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-md bg-green-800 px-4 py-2 text-white hover:bg-green-700 transition-colors"
        onClick={() => setIsOpen(true)}
      >
        <HiOutlinePlus className="h-5 w-5" />
        Add User
      </button>

      <Modal isOpen={isOpen} closeModal={close} title="Add User">
        <div className="w-[min(100vw-2rem,34rem)] max-w-full mx-auto   overscroll-contain p-3 sm:p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <form onSubmit={submit} className="space-y-4">
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
              <label className="form-label">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                inputMode="email"
                className="form-input min-h-[44px]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="form-label">Phone</label>
              <input
                type="tel"
                inputMode="tel"
                className="form-input min-h-[44px]"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="form-label">Role</label>
              <div className="relative inline-block w-full">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="min-h-[44px] block w-full rounded-md appearance-none bg-white border border-green-400 px-4 py-2 pr-8 leading-tight focus:outline-none"
                >
                  <option value={Role.User}>USER</option>
                  <option value={Role.Admin}>ADMIN</option>
                  <option value={Role.Manager}>MANAGER</option>
                  <option value={Role.Waiter}>WAITER</option>
                  <option value={Role.Delivery}>DELIVERY</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <GoChevronDown className="dark:text-gray-300" />
                </div>
              </div>
            </div>

            <UploadImg id="add-user-img" handleCallBack={(f) => setFile(f)} />

            <button
              type="submit"
              className="form-button w-full min-h-[44px] bg-green-600 hover:bg-green-700 transition-colors mb-2"
              disabled={saving}
            >
              {saving ? "Saving..." : "Create"}
            </button>
          </form>
        </div>
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

  const qParam = sp.get("q") ?? "";
  const roleParam = sp.get("role");
  const sortParam = sp.get("sort") ?? "createdAt_desc";
  const page = clampInt(sp.get("page"), 1, 1, 9999);
  const take = clampInt(sp.get("take"), 20, 5, 100);

  const [qDraft, setQDraft] = useState(qParam);
  useEffect(() => setQDraft(qParam), [qParam]);

  useEffect(() => {
    const t = setTimeout(() => {
      mutateUrl(router, pathname, new URLSearchParams(sp.toString()), (next) => {
        const trimmed = qDraft.trim();
        if (trimmed) next.set("q", trimmed);
        else next.delete("q");
        next.delete("page");
      });
    }, 350);

    return () => clearTimeout(t);
  }, [qDraft, router, pathname, sp]);

  const users = useMemo(() => data?.getUsers ?? [], [data?.getUsers]);

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
        list.sort(
          (a, b) =>
            new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime()
        );
        break;
      case "createdAt_desc":
      default:
        list.sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
        );
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
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-[210px]">
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
              className="min-h-[44px] block w-full rounded-md appearance-none bg-white border border-slate-200 px-4 py-2 pr-8 text-sm leading-tight focus:outline-none"
            >
              <option value="">All roles</option>
              <option value={Role.Admin}>ADMIN</option>
              <option value={Role.Manager}>MANAGER</option>
              <option value={Role.Waiter}>WAITER</option>
              <option value={Role.Delivery}>DELIVERY</option>
              <option value={Role.User}>USER</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <GoChevronDown className="dark:text-gray-300" />
            </div>
          </div>

          <div className="relative w-full sm:w-[220px]">
            <select
              value={sortParam}
              onChange={(e) => {
                mutateUrl(router, pathname, new URLSearchParams(sp.toString()), (next) => {
                  next.set("sort", e.target.value);
                  next.delete("page");
                });
              }}
              className="min-h-[44px] block w-full rounded-md appearance-none bg-white border border-slate-200 px-4 py-2 pr-8 text-sm leading-tight focus:outline-none"
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

          <div className="relative w-full sm:w-[160px]">
            <select
              value={String(take)}
              onChange={(e) => {
                mutateUrl(router, pathname, new URLSearchParams(sp.toString()), (next) => {
                  next.set("take", e.target.value);
                  next.delete("page");
                });
              }}
              className="min-h-[44px] block w-full rounded-md appearance-none bg-white border border-slate-200 px-4 py-2 pr-8 text-sm leading-tight focus:outline-none"
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
            className="w-full sm:w-auto min-h-[44px] rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            onClick={clearFilters}
          >
            Clear
          </button>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:w-auto">
          <button
            type="button"
            className="w-full sm:w-auto min-h-[44px] flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors"
            onClick={() => refetch()}
            disabled={fetching}
          >
            <HiArrowPath className={`h-5 w-5 ${fetching ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <AddUserModal canAdd={currentUserRole === "ADMIN"} onCreated={refetch} />
        </div>
      </div>

      <div className="mb-3 text-sm text-slate-500 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <span>{fetching ? "Loading..." : `Showing ${pageItems.length} of ${total} result(s)`}</span>
        <span>
          Page {safePage} / {totalPages}
        </span>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="font-semibold">Could not load users</div>
          <div className="text-sm mt-1 break-words">{error.message}</div>
        </div>
      ) : null}

      {/* Mobile view */}
      <div className="md:hidden space-y-3">
        {fetching && pageItems.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`mobile-skeleton-${i}`}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse shrink-0" />
                  <div className="min-w-0 space-y-2">
                    <div className="h-4 w-40 bg-slate-200 animate-pulse rounded" />
                    <div className="h-3 w-56 bg-slate-200 animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-9 w-9 rounded-md bg-slate-200 animate-pulse" />
              </div>
            </div>
          ))
        ) : pageItems.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No users found.
          </div>
        ) : (
          pageItems.map((user) => (
            <div
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
              key={user.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Image
                    src={user.image || "/img/humans/pro.jpg"}
                    width={40}
                    height={40}
                    alt="avatar"
                    className="h-10 w-10 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-800 truncate">
                      {user.name || "-"}
                    </div>
                    <div className="text-xs text-slate-500 break-all">
                      {user.email || "-"}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <span
                    className={[
                      "inline-flex px-2 py-1 rounded-md text-xs border border-slate-200 whitespace-nowrap",
                      roleBadgeClass(user.role),
                    ].join(" ")}
                  >
                    {user.role}
                  </span>
                  
                  <div className="flex items-center gap-1">
                    <NotifyUserAction user={user} />
                    <EditRoleModal
                      user={user}
                      currentUserId={currentUserId}
                      onChanged={() => refetch()}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[720px] text-left text-slate-500 bg-white">
          <thead className="text-xs whitespace-nowrap text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
            <tr>
              <th scope="col" className="px-3 lg:px-6 py-3 font-semibold">Avatar</th>
              <th scope="col" className="px-3 lg:px-6 py-3 font-semibold">Name</th>
              <th scope="col" className="px-3 lg:px-6 py-3 font-semibold">Email</th>
              <th scope="col" className="px-3 lg:px-6 py-3 font-semibold">Role</th>
              <th scope="col" className="px-3 lg:px-6 py-3 font-semibold text-center">Notify</th>
              <th scope="col" className="px-3 lg:px-6 py-3 font-semibold text-center">Edit</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {fetching && pageItems.length === 0 ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr className="bg-white" key={`skeleton-${i}`}>
                  <td className="px-3 lg:px-6 py-3">
                    <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse" />
                  </td>
                  <td className="px-3 lg:px-6 py-3">
                    <div className="h-4 w-44 bg-slate-200 animate-pulse rounded" />
                  </td>
                  <td className="px-3 lg:px-6 py-3">
                    <div className="h-4 w-60 bg-slate-200 animate-pulse rounded" />
                  </td>
                  <td className="px-3 lg:px-6 py-3">
                    <div className="h-4 w-24 bg-slate-200 animate-pulse rounded" />
                  </td>
                  <td className="px-3 lg:px-6 py-3 text-center">
                    <div className="h-9 w-9 bg-slate-200 animate-pulse rounded-md mx-auto" />
                  </td>
                  <td className="px-3 lg:px-6 py-3 text-center">
                    <div className="h-9 w-9 bg-slate-200 animate-pulse rounded-md mx-auto" />
                  </td>
                </tr>
              ))
            ) : pageItems.length === 0 ? (
              <tr className="bg-white">
                <td className="px-3 lg:px-6 py-6 text-center text-slate-500" colSpan={6}>
                  No users found.
                </td>
              </tr>
            ) : (
              pageItems.map((user) => (
                <tr className="bg-white hover:bg-slate-50 transition-colors" key={user.id}>
                  <td className="px-3 lg:px-6 py-3">
                    <Image
                      src={user.image || "/img/humans/pro.jpg"}
                      width={50}
                      height={50}
                      alt="avatar"
                      className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-cover border border-slate-100"
                    />
                  </td>
                  <td className="px-3 lg:px-6 py-3 text-sm font-medium text-slate-800">{user.name || "-"}</td>
                  <td className="px-3 lg:px-6 py-3 text-sm break-all">{user.email || "-"}</td>
                  <td className="px-3 lg:px-6 py-3 text-sm">
                    <span
                      className={[
                        "inline-flex px-2 py-1 rounded-md text-xs font-medium border border-slate-200",
                        roleBadgeClass(user.role),
                      ].join(" ")}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-3 lg:px-6 py-3 whitespace-nowrap text-center">
                    <NotifyUserAction user={user} />
                  </td>
                  <td className="px-3 lg:px-6 py-3 whitespace-nowrap text-center">
                    <EditRoleModal
                      user={user}
                      currentUserId={currentUserId}
                      onChanged={() => refetch()}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            className="w-full sm:w-auto min-h-[44px] rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
          >
            Previous
          </button>

          <div className="text-sm font-medium text-slate-500 text-center">
            Page {safePage} of {totalPages}
          </div>

          <button
            type="button"
            className="w-full sm:w-auto min-h-[44px] rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
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