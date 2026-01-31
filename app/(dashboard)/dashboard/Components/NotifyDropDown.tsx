"use client";

import { Dialog, Menu, Transition } from "@headlessui/react";
import { useMutation, useQuery } from "@urql/next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import {
  HiOutlineBellAlert,
  HiOutlineCheckCircle,
  HiOutlineXMark,
} from "react-icons/hi2";

type Props = {
  userEmail: string;
};

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  status: "READ" | "UNREAD";
  priority: "LOW" | "NORMAL" | "HIGH";
  createdAt: string;
  updatedAt: string;
};

type GetNotificationsDropdownData = {
  getUnreadNotificationsCount: number;
  getUserNotifications: NotificationItem[];
};

type GetNotificationsDropdownVars = {
  userEmail: string;
};

type MarkNotificationAsReadData = {
  markNotificationAsRead: {
    id: string;
    status: "READ" | "UNREAD";
    updatedAt: string;
  };
};

type MarkNotificationAsReadVars = {
  id: string;
};

type MarkAllNotificationsAsReadData = {
  markAllNotificationsAsRead: number;
};

type MarkAllNotificationsAsReadVars = {
  userEmail: string;
  search?: string | null;
};

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: string; kind: ToastKind; message: string };

const GET_NOTIFICATIONS_DROPDOWN = `
  query GetNotificationsDropdown($userEmail: String!) {
    getUnreadNotificationsCount(userEmail: $userEmail)
    getUserNotifications(userEmail: $userEmail, take: 5) {
      id
      type
      message
      status
      priority
      createdAt
      updatedAt
    }
  }
`;

const MARK_NOTIFICATION_AS_READ = `
  mutation MarkNotificationAsRead($id: String!) {
    markNotificationAsRead(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

const MARK_ALL_NOTIFICATIONS_AS_READ = `
  mutation MarkAllNotificationsAsRead($userEmail: String!, $search: String) {
    markAllNotificationsAsRead(userEmail: $userEmail, search: $search)
  }
`;

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return "";
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
    <div className="fixed top-4 right-4 z-[70] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`shadow-xl rounded-md px-4 py-3 text-white text-sm w-[320px] ${kindClass(
            t.kind
          )}`}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 leading-5">{t.message}</p>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-white/90 hover:text-white"
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

export default function NotifyDropDown({ userEmail }: Props) {
  const router = useRouter();

  // Toasts (מובנה)
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const pushToast = (kind: ToastKind, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  };
  const dismissToast = (id: string) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  const [{ data, fetching, error }, reexecuteQuery] = useQuery<
    GetNotificationsDropdownData,
    GetNotificationsDropdownVars
  >({
    query: GET_NOTIFICATIONS_DROPDOWN,
    variables: { userEmail },
    pause: !userEmail,
    requestPolicy: "cache-and-network",
  });

  const unreadCount = data?.getUnreadNotificationsCount ?? 0;

  const lastFive = useMemo(() => {
    const list = data?.getUserNotifications ?? [];
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [data]);

  const [{ fetching: markingOne }, markAsRead] = useMutation<
    MarkNotificationAsReadData,
    MarkNotificationAsReadVars
  >(MARK_NOTIFICATION_AS_READ);

  const [{ fetching: markingAll }, markAllAsRead] = useMutation<
    MarkAllNotificationsAsReadData,
    MarkAllNotificationsAsReadVars
  >(MARK_ALL_NOTIFICATIONS_AS_READ);

  const [isMarkAllOpen, setIsMarkAllOpen] = useState(false);

  const busy = markingOne || markingAll;

  const refreshDropdown = () => {
    reexecuteQuery({ requestPolicy: "network-only" });
    router.refresh();
  };

  const markOne = async (id: string, showToast = true) => {
    const res = await markAsRead({ id });
    if (res.error) {
      pushToast("error", "נכשל לסמן התראה כנקראה");
      return false;
    }
    if (showToast) pushToast("success", "סומן כנקרא");
    refreshDropdown();
    return true;
  };

  const openNotification = async (n: NotificationItem) => {
    if (n.status === "UNREAD") {
      await markOne(n.id, false);
    }
    router.push("/dashboard/notifications");
  };

  const confirmMarkAll = async () => {
    if (!userEmail) return;

    const res = await markAllAsRead({ userEmail });
    if (res.error) {
      pushToast("error", "נכשל לסמן את כל ההתראות כנקראו");
      return;
    }

    const count = res.data?.markAllNotificationsAsRead ?? 0;
    pushToast(
      "success",
      count > 0 ? `סומנו ${count} התראות כנקראו` : "אין התראות חדשות לסמן כנקראו"
    );
    setIsMarkAllOpen(false);
    refreshDropdown();
  };

  return (
    <>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />

      <Menu as="div" className="relative inline-block text-left">
        <Menu.Button
          className="relative p-2 bg-slate-200 rounded-full text-gray-500 hover:bg-green-200 hover:text-green-600"
          aria-label="Open notifications"
          type="button"
        >
          {unreadCount > 0 && (
            <span className="absolute top-1 right-0 z-10 flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-green-600 text-[10px] text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
              <span className="absolute -z-10 inline-flex h-4 w-4 animate-ping rounded-full bg-green-500 opacity-75" />
            </span>
          )}

          <HiOutlineBellAlert className="h-7 w-7 pr-1" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 w-80 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            {/* Header */}
            <div className="text-center py-3 px-3">
              <h3 className="font-semibold">Notifications</h3>
              <p className="text-xs text-slate-500 mt-1">
                {unreadCount} unread
              </p>
            </div>

            {/* Actions */}
            <div className="px-3 py-2 flex items-center justify-between gap-2">
              <button
                onClick={() => setIsMarkAllOpen(true)}
                disabled={!userEmail || busy || unreadCount === 0}
                className={`px-3 py-2 rounded-md text-sm transition ${
                  !userEmail || busy || unreadCount === 0
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
                type="button"
              >
                {markingAll ? "Marking..." : "Mark all as read"}
              </button>

              <button
                onClick={() => reexecuteQuery({ requestPolicy: "network-only" })}
                disabled={!userEmail || fetching}
                className={`px-3 py-2 rounded-md text-sm transition ${
                  !userEmail || fetching
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                }`}
                type="button"
              >
                Refresh
              </button>
            </div>

            {/* List */}
            <div className="pl-3 pr-2 overflow-y-auto h-60 overflow-x-hidden scrollbar-hide">
              {!userEmail ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  התחבר כדי לראות התראות.
                </div>
              ) : fetching ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  Loading...
                </div>
              ) : error ? (
                <div className="py-6 text-center text-sm text-red-600">
                  Failed to load notifications
                </div>
              ) : lastFive.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  אין התראות כרגע.
                </div>
              ) : (
                lastFive.map((n) => (
                  <Menu.Item key={n.id}>
                    {({ active }) => (
                      <div
                        className={`border-t py-2 pr-2 ${
                          active ? "bg-slate-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-2 h-2 w-2 rounded-full ${
                              n.status === "UNREAD"
                                ? "bg-green-600"
                                : "bg-slate-300"
                            }`}
                          />

                          <button
                            onClick={() => openNotification(n)}
                            className="flex-1 text-right"
                            type="button"
                          >
                            <p className="text-sm leading-5">
                              <span className="font-medium">{n.type}:</span>{" "}
                              <span className="text-xs text-slate-500 line-clamp-2">
                                {n.message}
                              </span>
                            </p>
                            <p className="text-xs text-green-600 mt-1">
                              {formatTime(n.createdAt)}
                            </p>
                          </button>

                          {n.status === "UNREAD" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markOne(n.id);
                              }}
                              disabled={busy}
                              className={`p-1 rounded-md transition ${
                                busy
                                  ? "text-slate-300 cursor-not-allowed"
                                  : "text-green-700 hover:bg-green-50"
                              }`}
                              aria-label="Mark as read"
                              type="button"
                            >
                              <HiOutlineCheckCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-2">
              <Link
                href="/dashboard/notifications"
                className="block text-center text-green-700 hover:bg-green-50 rounded-md py-2"
              >
                View all notifications
              </Link>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>

      {/* Confirm Mark All Modal */}
      <Transition appear show={isMarkAllOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[80]"
          onClose={() => setIsMarkAllOpen(false)}
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
                <Dialog.Panel className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl">
                  <div className="flex items-start justify-between gap-3">
                    <Dialog.Title className="text-lg font-semibold">
                      Mark all as read?
                    </Dialog.Title>
                    <button
                      onClick={() => setIsMarkAllOpen(false)}
                      className="text-slate-500 hover:text-slate-700"
                      type="button"
                      aria-label="Close"
                    >
                      <HiOutlineXMark className="w-6 h-6" />
                    </button>
                  </div>

                  <p className="text-sm text-slate-600 mt-2">
                    זה יסמן את כל ההתראות הבלתי נקראות שלך כנקראו.
                  </p>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={() => setIsMarkAllOpen(false)}
                      disabled={busy}
                      className="px-4 py-2 rounded-md text-sm bg-slate-200 text-slate-700 hover:bg-slate-300"
                      type="button"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={confirmMarkAll}
                      disabled={busy}
                      className={`px-4 py-2 rounded-md text-sm ${
                        busy
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
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
    </>
  );
}
