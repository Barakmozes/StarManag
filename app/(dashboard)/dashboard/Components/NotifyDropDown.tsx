"use client";

import { Dialog, Menu, Transition } from "@headlessui/react";
import { useMutation, useQuery } from "@urql/next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  HiOutlineBellAlert,
  HiOutlineCheckCircle,
  HiOutlineXMark,
} from "react-icons/hi2";

type Props = {
  userEmail?: string | null;
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

type GetUnreadCountData = {
  getUnreadNotificationsCount: number;
};
type GetUnreadCountVars = {
  userEmail: string;
};

type GetLastNotificationsData = {
  getUserNotifications: NotificationItem[];
};
type GetLastNotificationsVars = {
  userEmail: string;
};

type MarkNotificationAsReadData = {
  markNotificationAsRead: { id: string; status: "READ" | "UNREAD"; updatedAt: string };
};
type MarkNotificationAsReadVars = { id: string };

type MarkAllNotificationsAsReadData = { markAllNotificationsAsRead: number };
type MarkAllNotificationsAsReadVars = { userEmail: string; search?: string | null };

const NOTIFICATIONS_PAGE = "/dashboard/notifications";
const TAKE = 5;

const GET_UNREAD_COUNT = `
  query GetUnreadNotificationsCount($userEmail: String!) {
    getUnreadNotificationsCount(userEmail: $userEmail)
  }
`;

const GET_LAST_NOTIFICATIONS = `
  query GetLastUserNotifications($userEmail: String!) {
    getUserNotifications(userEmail: $userEmail, take: ${TAKE}) {
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

function formatDateTime(iso: string) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    return new Intl.DateTimeFormat(
      "he-IL",
      isToday
        ? { hour: "2-digit", minute: "2-digit" }
        : { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }
    ).format(d);
  } catch {
    return "";
  }
}

export default function NotifyDropDown({ userEmail }: Props) {
  const router = useRouter();

  const email = (userEmail ?? "").trim();
  const hasUser = email.length > 0;

  // ✅ מביאים את הרשימה רק אחרי פתיחה ראשונה (ביצועים)
  const [listEnabled, setListEnabled] = useState(false);
  const enableList = useCallback(() => setListEnabled(true), []);

  const [{ data: countData }, reexecuteCount] = useQuery<GetUnreadCountData, GetUnreadCountVars>({
    query: GET_UNREAD_COUNT,
    variables: { userEmail: email },
    pause: !hasUser,
    requestPolicy: "cache-and-network",
  });

  const unreadCount = countData?.getUnreadNotificationsCount ?? 0;

  const [{ data: listData, fetching: listFetching, error: listError }, reexecuteList] = useQuery<
    GetLastNotificationsData,
    GetLastNotificationsVars
  >({
    query: GET_LAST_NOTIFICATIONS,
    variables: { userEmail: email },
    pause: !hasUser || !listEnabled,
    requestPolicy: "cache-and-network",
  });

  const lastFive = useMemo(() => {
    const list = listData?.getUserNotifications ?? [];
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [listData?.getUserNotifications]);

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

  const refreshData = useCallback(
    (opts?: { list?: boolean }) => {
      reexecuteCount({ requestPolicy: "network-only" });
      if (opts?.list ?? listEnabled) {
        reexecuteList({ requestPolicy: "network-only" });
      }
    },
    [reexecuteCount, reexecuteList, listEnabled]
  );

  const markOne = useCallback(
    async (id: string, showToast = true) => {
      const res = await markAsRead({ id });
      if (res.error) {
        toast.error("נכשל לסמן התראה כנקראה");
        return false;
      }

      if (showToast) toast.success("סומן כנקרא");
      refreshData({ list: true });
      return true;
    },
    [markAsRead, refreshData]
  );

  const openNotification = useCallback(
    async (n: NotificationItem) => {
      if (n.status === "UNREAD") {
        await markOne(n.id, false);
      }
      router.push(NOTIFICATIONS_PAGE);
    },
    [markOne, router]
  );

  const confirmMarkAll = useCallback(async () => {
    if (!hasUser || busy || unreadCount === 0) return;

    const res = await markAllAsRead({ userEmail: email });
    if (res.error) {
      toast.error("נכשל לסמן את כל ההתראות כנקראו");
      return;
    }

    const count = res.data?.markAllNotificationsAsRead ?? 0;
    toast.success(count > 0 ? `סומנו ${count} התראות כנקראו` : "אין התראות חדשות לסמן כנקראו");

    setIsMarkAllOpen(false);
    refreshData({ list: true });
  }, [busy, email, hasUser, markAllAsRead, refreshData, unreadCount]);

  return (
    <>
      <Menu as="div" className="relative inline-block text-left">
        {({ open }) => (
          <>
            <Menu.Button
              onClick={enableList}
              className="relative rounded-full bg-slate-200 p-2 text-gray-500 transition hover:bg-green-200 hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
              aria-label="Open notifications"
              type="button"
            >
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 z-10 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-green-600 px-1 text-[10px] text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                  <span className="absolute -z-10 inline-flex h-4 w-4 animate-ping rounded-full bg-green-500 opacity-75" />
                </span>
              )}
              <HiOutlineBellAlert className="h-7 w-7" />
            </Menu.Button>

            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-[60] mt-2 w-[min(92vw,20rem)] origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
                {/* Header */}
                <div className="px-3 py-3 text-center">
                  <h3 className="font-semibold">Notifications</h3>
                  <p className="mt-1 text-xs text-slate-500">{unreadCount} unread</p>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 px-3 py-2">
                  <button
                    onClick={() => setIsMarkAllOpen(true)}
                    disabled={!hasUser || busy || unreadCount === 0}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      !hasUser || busy || unreadCount === 0
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                    type="button"
                  >
                    {markingAll ? "Marking..." : "Mark all as read"}
                  </button>

                  <button
                    onClick={() => refreshData({ list: true })}
                    disabled={!hasUser || busy}
                    className={`rounded-md px-3 py-2 text-sm transition ${
                      !hasUser || busy
                        ? "cursor-not-allowed bg-slate-100 text-slate-400"
                        : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                    }`}
                    type="button"
                  >
                    Refresh
                  </button>
                </div>

                {/* List */}
                <div className="max-h-60 overflow-y-auto overflow-x-hidden px-3 pr-2">
                  {!hasUser ? (
                    <div className="py-6 text-center text-sm text-slate-500">התחבר כדי לראות התראות.</div>
                  ) : listFetching && lastFive.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-500">Loading...</div>
                  ) : listError ? (
                    <div className="py-6 text-center text-sm text-red-600">Failed to load notifications</div>
                  ) : lastFive.length === 0 ? (
                    <div className="py-6 text-center text-sm text-slate-500">אין התראות כרגע.</div>
                  ) : (
                    lastFive.map((n) => (
                      <Menu.Item key={n.id}>
                        {({ active }) => (
                          <div className={`border-t py-2 pr-1 ${active ? "bg-slate-50" : ""}`}>
                            <div className="flex items-start gap-2">
                              <span
                                className={`mt-2 h-2 w-2 rounded-full ${
                                  n.status === "UNREAD" ? "bg-green-600" : "bg-slate-300"
                                }`}
                              />

                              <button onClick={() => openNotification(n)} className="flex-1 text-left" type="button">
                                <p className="text-sm leading-5">
                                  <span className="font-medium">{n.type}:</span>{" "}
                                  <span dir="auto" className="line-clamp-2 text-xs text-slate-500">
                                    {n.message}
                                  </span>
                                </p>
                                <p className="mt-1 text-xs text-green-600">{formatDateTime(n.createdAt)}</p>
                              </button>

                              {n.status === "UNREAD" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markOne(n.id);
                                  }}
                                  disabled={busy}
                                  className={`rounded-md p-1 transition ${
                                    busy
                                      ? "cursor-not-allowed text-slate-300"
                                      : "text-green-700 hover:bg-green-50"
                                  }`}
                                  aria-label="Mark as read"
                                  type="button"
                                >
                                  <HiOutlineCheckCircle className="h-5 w-5" />
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
                    href={NOTIFICATIONS_PAGE}
                    className="block rounded-md py-2 text-center text-green-700 transition hover:bg-green-50"
                  >
                    View all notifications
                  </Link>
                </div>
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>

      {/* Confirm Mark All Modal */}
      <Transition appear show={isMarkAllOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[80]" onClose={() => setIsMarkAllOpen(false)}>
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
                    <Dialog.Title className="text-lg font-semibold">Mark all as read?</Dialog.Title>
                    <button
                      onClick={() => setIsMarkAllOpen(false)}
                      className="text-slate-500 transition hover:text-slate-700"
                      type="button"
                      aria-label="Close"
                    >
                      <HiOutlineXMark className="h-6 w-6" />
                    </button>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">זה יסמן את כל ההתראות הבלתי נקראות שלך כנקראו.</p>

                  <div className="mt-6 flex justify-end gap-2">
                    <button
                      onClick={() => setIsMarkAllOpen(false)}
                      disabled={busy}
                      className="rounded-md bg-slate-200 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-70"
                      type="button"
                    >
                      Cancel
                    </button>

                    <button
                      onClick={confirmMarkAll}
                      disabled={busy || unreadCount === 0}
                      className={`rounded-md px-4 py-2 text-sm transition ${
                        busy || unreadCount === 0
                          ? "cursor-not-allowed bg-slate-100 text-slate-400"
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
