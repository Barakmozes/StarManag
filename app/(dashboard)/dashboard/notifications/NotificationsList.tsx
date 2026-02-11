"use client";

import { Dialog, Transition } from "@headlessui/react";
import { useMutation } from "@urql/next";
import { useRouter } from "next/navigation";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import { HiOutlineCheckCircle, HiOutlineTrash, HiOutlineXMark } from "react-icons/hi2";
import { TbLetterO, TbLetterQ, TbLetterS } from "react-icons/tb";

export type NotificationDTO = {
  id: string;
  userEmail: string;
  type: string;
  message: string;
  status: "READ" | "UNREAD";
  priority: "LOW" | "NORMAL" | "HIGH";
  createdAt: string;
  updatedAt: string;
};


export type NotificationFilters = {
  q: string;
  status: "ALL" | "READ" | "UNREAD";
  take: number;
};

type Props = {
  userEmail: string;
  initialNotifications: NotificationDTO[];
  filters: NotificationFilters;
  hasMore: boolean;
};

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: string; kind: ToastKind; message: string };

const MARK_NOTIFICATION_AS_READ = `
  mutation MarkNotificationAsRead($id: String!) {
    markNotificationAsRead(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

const UPDATE_NOTIFICATION = `
  mutation UpdateNotification($id: String!, $status: NotificationStatus!) {
    updateNotification(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

const DELETE_NOTIFICATION = `
  mutation DeleteNotification($id: String!) {
    deleteNotification(id: $id) {
      id
    }
  }
`;

const MARK_ALL_NOTIFICATIONS_AS_READ = `
  mutation MarkAllNotificationsAsRead($userEmail: String!, $search: String) {
    markAllNotificationsAsRead(userEmail: $userEmail, search: $search)
  }
`;

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("he-IL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

function getTypeTheme(type: string) {
  const t = (type || "").toLowerCase();

  if (t.includes("order")) return { bg: "bg-green-700", icon: <TbLetterO size={22} /> };
  if (t.includes("signup") || t.includes("user") || t.includes("register"))
    return { bg: "bg-purple-700", icon: <TbLetterS size={22} /> };
  if (t.includes("query") || t.includes("help") || t.includes("support"))
    return { bg: "bg-orange-700", icon: <TbLetterQ size={22} /> };

  return { bg: "bg-slate-700", icon: <TbLetterQ size={22} /> };
}

function priorityBadge(priority: NotificationDTO["priority"]) {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-700";
    case "LOW":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-green-50 text-green-700";
  }
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  const kindClass = (kind: ToastKind) => {
    if (kind === "success") return "bg-green-700";
    if (kind === "error") return "bg-red-700";
    return "bg-slate-800";
  };

  return (
    <div className="fixed inset-x-4 top-4 z-[60] space-y-2 sm:inset-x-auto sm:right-4 sm:left-auto">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`shadow-xl rounded-md px-4 py-3 text-white text-sm w-full max-w-sm ${kindClass(
            t.kind
          )}`}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 leading-5 break-words">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className="h-11 w-11 -mr-2 -mt-2 inline-flex items-center justify-center rounded-md text-white/90 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Close toast"
              type="button"
            >
              <HiOutlineXMark className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function buildNotificationsUrl(next: NotificationFilters) {
  const usp = new URLSearchParams();
  if (next.q) usp.set("q", next.q);
  if (next.status !== "ALL") usp.set("status", next.status);
  if (next.take !== 80) usp.set("take", String(next.take));
  const qs = usp.toString();
  return `/dashboard/notifications${qs ? `?${qs}` : ""}`;
}

export default function NotificationsList({
  userEmail,
  initialNotifications,
  filters,
  hasMore,
}: Props) {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationDTO[]>(initialNotifications);

  // UI state שמייצג את ה-URL filters
  const [activeTab, setActiveTab] = useState<NotificationFilters["status"]>(filters.status);
  const [search, setSearch] = useState(filters.q);
  const [take, setTake] = useState(filters.take);

  // Sync props -> state (אחרי router.refresh / שינוי URL)
  useEffect(() => setNotifications(initialNotifications), [initialNotifications]);
  useEffect(() => setActiveTab(filters.status), [filters.status]);
  useEffect(() => setSearch(filters.q), [filters.q]);
  useEffect(() => setTake(filters.take), [filters.take]);

  // Toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (kind: ToastKind, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };
  const dismissToast = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.status === "UNREAD").length,
    [notifications]
  );

  // Modals
  const [selected, setSelected] = useState<NotificationDTO | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isMarkAllConfirmOpen, setIsMarkAllConfirmOpen] = useState(false);

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setSelected(null);
    setIsDeleteConfirmOpen(false);
  };

  const [{ fetching: markingOne }, markAsRead] = useMutation(MARK_NOTIFICATION_AS_READ);
  const [{ fetching: updatingOne }, updateNotification] = useMutation(UPDATE_NOTIFICATION);
  const [{ fetching: deletingOne }, deleteNotification] = useMutation(DELETE_NOTIFICATION);
  const [{ fetching: markingAll }, markAllAsRead] = useMutation(MARK_ALL_NOTIFICATIONS_AS_READ);

  const isBusy = markingOne || updatingOne || deletingOne || markingAll;

  // Search server-side (URL-based) with debounce
  useEffect(() => {
    const next: NotificationFilters = { q: search.trim(), status: activeTab, take };

    // אם אין שינוי מול ה-filters הנוכחיים מהשרת – לא עושים replace
    if (next.q === filters.q && next.status === filters.status && next.take === filters.take) {
      return;
    }

    const t = window.setTimeout(() => {
      router.replace(buildNotificationsUrl(next));
      // אין צורך לקרוא refresh ידנית – שינוי URL יגרום לשרת להביא נתונים מחדש
    }, 350);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const applyTab = (tab: NotificationFilters["status"]) => {
    setActiveTab(tab);
    const next: NotificationFilters = { q: search.trim(), status: tab, take };
    router.replace(buildNotificationsUrl(next));
  };

  const loadMore = () => {
    const nextTake = Math.min(take + 50, 200);
    setTake(nextTake);
    const next: NotificationFilters = { q: search.trim(), status: activeTab, take: nextTake };
    router.replace(buildNotificationsUrl(next));
  };

  const openDetails = (n: NotificationDTO) => {
    setSelected(n);
    setIsDetailsOpen(true);
  };

  const markOneRead = async (id: string) => {
    // optimistic
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "READ" } : n)));

    const res = await markAsRead({ id });
    if (res.error) {
      // rollback
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "UNREAD" } : n)));
      pushToast("error", "נכשל לסמן כהתראה שנקראה");
      return;
    }

    pushToast("success", "ההתראה סומנה כנקראה");
    router.refresh();
  };

  const markOneUnread = async (id: string) => {
    const prevSnapshot = notifications;

    // optimistic
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, status: "UNREAD" } : n)));

    const res = await updateNotification({ id, status: "UNREAD" });
    if (res.error) {
      setNotifications(prevSnapshot);
      pushToast("error", "נכשל לסמן כלא נקרא");
      return;
    }

    pushToast("success", "סומן כלא נקרא");
    router.refresh();
  };

  const confirmDelete = async () => {
    if (!selected) return;

    const id = selected.id;

    // optimistic remove
    const prevSnapshot = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setIsDeleteConfirmOpen(false);
    setIsDetailsOpen(false);
    setSelected(null);

    const res = await deleteNotification({ id });
    if (res.error) {
      setNotifications(prevSnapshot);
      pushToast("error", "נכשל למחוק התראה");
      return;
    }

    pushToast("success", "ההתראה נמחקה");
    router.refresh();
  };

  const confirmMarkAll = async () => {
    if (!userEmail) return;

    if (unreadCount === 0) {
      pushToast("info", "אין התראות חדשות לסמן כנקראו");
      setIsMarkAllConfirmOpen(false);
      return;
    }

    // bulk mutation (יעיל)
    const res = await markAllAsRead({
      userEmail,
      search: search.trim() ? search.trim() : null,
    });

    if (res.error) {
      pushToast("error", "נכשל לסמן את כל ההתראות כנקראו");
      return;
    }

    const count = res.data?.markAllNotificationsAsRead ?? 0;
    pushToast("success", count > 0 ? `סומנו ${count} התראות כנקראו` : "אין מה לעדכן");
    setIsMarkAllConfirmOpen(false);
    router.refresh();
  };

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <section className="bg-white">
        {/* Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 md:p-6 items-center border-b">
          <div className="space-y-1">
            <h1 className="text-lg md:text-3xl text-center md:text-start">Notifications</h1>
            <p className="text-xs text-slate-500 text-center md:text-start">
              {unreadCount} unread • showing {notifications.length}
            </p>
          </div>

          <div className="flex justify-center md:justify-end gap-2">
            <button
              onClick={() => setIsMarkAllConfirmOpen(true)}
              disabled={isBusy || unreadCount === 0}
              className={`w-full sm:w-auto min-h-11 px-4 py-2 rounded-md transition ${
                isBusy || unreadCount === 0
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "text-green-700 hover:bg-green-100"
              }`}
              type="button"
            >
              {markingAll ? "Marking..." : "Mark all as read"}
            </button>
          </div>
        </div>

        {/* Tabs + Search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 md:px-6 py-3 border-b">
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            <button
              className={`min-h-11 px-4 py-2 rounded-md text-sm ${
                activeTab === "ALL"
                  ? "border-b-2 border-green-600 text-green-700 bg-green-50"
                  : "hover:bg-slate-50"
              }`}
              onClick={() => applyTab("ALL")}
              type="button"
            >
              All
            </button>

            <button
              className={`min-h-11 px-4 py-2 rounded-md text-sm ${
                activeTab === "READ"
                  ? "border-b-2 border-green-600 text-green-700 bg-green-50"
                  : "hover:bg-slate-50"
              }`}
              onClick={() => applyTab("READ")}
              type="button"
            >
              Read
            </button>

            <button
              className={`min-h-11 px-4 py-2 rounded-md text-sm ${
                activeTab === "UNREAD"
                  ? "border-b-2 border-green-600 text-green-700 bg-green-50"
                  : "hover:bg-slate-50"
              }`}
              onClick={() => applyTab("UNREAD")}
              type="button"
            >
              Unread
            </button>
          </div>

          <div className="flex justify-center md:justify-end">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full md:w-80 min-h-11 border rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-200"
            />
          </div>
        </div>

        {/* List */}
        <div className="p-4 md:p-6 max-h-[calc(100dvh-220px)] md:max-h-[70vh] space-y-3 overflow-y-auto scrollbar-hide pb-[calc(env(safe-area-inset-bottom)+16px)]">
          {notifications.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-500">No notifications found.</p>
            </div>
          ) : (
            notifications.map((n) => {
              const theme = getTypeTheme(n.type);

              return (
                <div
                  key={n.id}
                  className="flex items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  role="button"
                  tabIndex={0}
                  onClick={() => openDetails(n)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") openDetails(n);
                  }}
                >
                  <div
                    className={`h-11 w-11 shrink-0 flex items-center justify-center text-white rounded-full ${theme.bg}`}
                    aria-hidden="true"
                  >
                    {theme.icon}
                  </div>

                  <div
                    className={`flex flex-col flex-1 min-w-0 p-3 rounded-md cursor-pointer transition ${
                      n.status === "UNREAD"
                        ? "bg-slate-100 text-green-800 hover:bg-green-100"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3
                        className={`text-sm md:text-base truncate ${
                          n.status === "UNREAD" ? "font-semibold" : ""
                        }`}
                      >
                        {n.type}
                      </h3>

                      <span
                        className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full ${priorityBadge(
                          n.priority
                        )}`}
                      >
                        {n.priority}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <p className="text-sm text-slate-700 break-words sm:truncate">{n.message}</p>
                      <p className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDateTime(n.createdAt)}
                      </p>
                    </div>

                    {n.status === "UNREAD" && (
                      <div className="mt-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markOneRead(n.id);
                          }}
                          disabled={isBusy}
                          className={`inline-flex items-center gap-2 text-sm px-4 py-2 min-h-11 rounded-md transition ${
                            isBusy
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                          type="button"
                        >
                          <HiOutlineCheckCircle className="w-5 h-5" />
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                className="min-h-11 w-full sm:w-auto px-4 py-2 rounded-md bg-slate-200 text-slate-700 hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                type="button"
              >
                Load more
              </button>
            </div>
          )}
        </div>

        {/* Details Modal */}
        <Transition appear show={isDetailsOpen} as={Fragment}>
          <Dialog as="div" className="relative z-50" onClose={closeDetails}>
            <Transition.Child
          
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl pb-[calc(env(safe-area-inset-bottom)+16px)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Dialog.Title className="text-lg font-semibold truncate">
                          {selected?.type ?? "Notification"}
                        </Dialog.Title>
                        <p className="text-xs text-slate-500 mt-1">
                          {selected ? formatDateTime(selected.createdAt) : ""}
                        </p>
                      </div>

                      <button
                        onClick={closeDetails}
                        className="h-11 w-11 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                        type="button"
                        aria-label="Close modal"
                      >
                        <HiOutlineXMark className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="mt-4">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                          Status: {selected?.status}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full ${
                            selected ? priorityBadge(selected.priority) : ""
                          }`}
                        >
                          Priority: {selected?.priority}
                        </span>
                      </div>

                      <p className="mt-4 text-sm text-slate-700 whitespace-pre-wrap break-words">
                        {selected?.message ?? ""}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {selected?.status === "UNREAD" ? (
                          <button
                            onClick={() => selected && markOneRead(selected.id)}
                            disabled={isBusy}
                            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 min-h-11 rounded-md text-sm ${
                              isBusy
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                            type="button"
                          >
                            <HiOutlineCheckCircle className="w-5 h-5" />
                            Mark as read
                          </button>
                        ) : (
                          <button
                            onClick={() => selected && markOneUnread(selected.id)}
                            disabled={isBusy}
                            className={`w-full sm:w-auto px-4 py-2 min-h-11 rounded-md text-sm ${
                              isBusy
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                            }`}
                            type="button"
                          >
                            Mark as unread
                          </button>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                        <button
                          onClick={() => setIsDeleteConfirmOpen(true)}
                          disabled={isBusy}
                          className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 min-h-11 rounded-md text-sm ${
                            isBusy
                              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                              : "bg-red-600 text-white hover:bg-red-700"
                          }`}
                          type="button"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Delete confirm */}
                    <Transition appear show={isDeleteConfirmOpen} as={Fragment}>
                      <Dialog
                        as="div"
                        className="relative z-[70]"
                        onClose={() => setIsDeleteConfirmOpen(false)}
                      >
                        <Transition.Child
                          as={Fragment}
                          enter="ease-out duration-200"
                          enterFrom="opacity-0"
                          enterTo="opacity-100"
                          leave="ease-in duration-150"
                          leaveFrom="opacity-100"
                          leaveTo="opacity-0"
                        >
                          <div className="fixed inset-0 bg-black/30" />
                        </Transition.Child>

                        <div className="fixed inset-0 overflow-y-auto">
                          <div className="flex min-h-full items-center justify-center p-4">
                            <Transition.Child
                              as={Fragment}
                              enter="ease-out duration-200"
                              enterFrom="opacity-0 scale-95"
                              enterTo="opacity-100 scale-100"
                              leave="ease-in duration-150"
                              leaveFrom="opacity-100 scale-100"
                              leaveTo="opacity-0 scale-95"
                            >
                              <Dialog.Panel className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl pb-[calc(env(safe-area-inset-bottom)+16px)]">
                                <Dialog.Title className="text-lg font-semibold">
                                  Delete notification?
                                </Dialog.Title>

                                <p className="text-sm text-slate-600 mt-2">
                                  הפעולה הזו תמחק את ההתראה לצמיתות.
                                </p>

                                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                  <button
                                    onClick={() => setIsDeleteConfirmOpen(false)}
                                    disabled={isBusy}
                                    className="w-full sm:w-auto min-h-11 px-4 py-2 rounded-md text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                                    type="button"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    onClick={confirmDelete}
                                    disabled={isBusy}
                                    className={`w-full sm:w-auto min-h-11 px-4 py-2 rounded-md text-sm ${
                                      isBusy
                                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                        : "bg-red-600 text-white hover:bg-red-700"
                                    } focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500`}
                                    type="button"
                                  >
                                    {deletingOne ? "Deleting..." : "Delete"}
                                  </button>
                                </div>
                              </Dialog.Panel>
                            </Transition.Child>
                          </div>
                        </div>
                      </Dialog>
                    </Transition>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Mark all confirm */}
        <Transition appear show={isMarkAllConfirmOpen} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-[70]"
            onClose={() => setIsMarkAllConfirmOpen(false)}
          >
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/30" />
            </Transition.Child>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-150"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <Dialog.Panel className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-xl pb-[calc(env(safe-area-inset-bottom)+16px)]">
                    <div className="flex items-start justify-between gap-3">
                      <Dialog.Title className="text-lg font-semibold">Mark all as read?</Dialog.Title>
                      <button
                        onClick={() => setIsMarkAllConfirmOpen(false)}
                        className="h-11 w-11 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                        type="button"
                        aria-label="Close"
                      >
                        <HiOutlineXMark className="w-6 h-6" />
                      </button>
                    </div>

                    <p className="text-sm text-slate-600 mt-2">
                      יסמן את כל ההתראות הבלתי נקראות כנקראו (בהתאם לחיפוש הנוכחי אם קיים).
                    </p>

                    <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button
                        onClick={() => setIsMarkAllConfirmOpen(false)}
                        disabled={isBusy}
                        className="w-full sm:w-auto min-h-11 px-4 py-2 rounded-md text-sm bg-slate-200 text-slate-700 hover:bg-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                        type="button"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={confirmMarkAll}
                        disabled={isBusy}
                        className={`w-full sm:w-auto min-h-11 px-4 py-2 rounded-md text-sm ${
                          isBusy
                            ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                            : "bg-green-600 text-white hover:bg-green-700"
                        } focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500`}
                        type="button"
                      >
                        {markingAll ? "Marking..." : "Confirm"}
                      </button>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition>

        {/* Footer info */}
        <div className="px-4 md:px-6 pb-4">
          <p className="text-[11px] text-slate-400">
            Loaded for: <span className="font-mono">{userEmail}</span>
          </p>
        </div>
      </section>
    </>
  );
}
