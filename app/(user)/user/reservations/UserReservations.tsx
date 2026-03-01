"use client";

import React, { useState, useMemo, useCallback } from "react";
import { User } from "@prisma/client";
import { useQuery, useMutation } from "@urql/next";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  BsCalendarCheck,
  BsClock,
  BsPeople,
  BsGeoAlt,
  BsXCircle,
  BsArrowRepeat,
  BsBell,
} from "react-icons/bs";
import { HiOutlineChevronLeft, HiHome } from "react-icons/hi2";
import {
  GetUserReservationsDocument,
  GetUserReservationsQuery,
  GetUserReservationsQueryVariables,
  CancelReservationDocument,
  GetUserWaitlistEntriesDocument,
  GetUserWaitlistEntriesQuery,
  GetUserWaitlistEntriesQueryVariables,
  CancelWaitlistEntryDocument,
} from "@/graphql/generated";

type Props = { user: User };

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  PENDING: "bg-amber-100 text-amber-700 border-amber-200",
  CANCELLED: "bg-red-50 text-red-400 border-red-100",
  COMPLETED: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmed",
  PENDING: "Pending",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

const TABS = ["Upcoming", "Past", "Cancelled"] as const;
type TabType = (typeof TABS)[number];

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  weekday: "short",
  year: "numeric",
  month: "short",
  day: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("he-IL", {
  hour: "2-digit",
  minute: "2-digit",
});

export default function UserReservations({ user }: Props) {
  const [tab, setTab] = useState<TabType>("Upcoming");

  const [resResult, reexecute] = useQuery<
    GetUserReservationsQuery,
    GetUserReservationsQueryVariables
  >({
    query: GetUserReservationsDocument,
    variables: { userEmail: user.email ?? "" },
    requestPolicy: "cache-and-network",
  });

  const [waitlistResult, reexecuteWaitlist] = useQuery<
    GetUserWaitlistEntriesQuery,
    GetUserWaitlistEntriesQueryVariables
  >({
    query: GetUserWaitlistEntriesDocument,
    variables: { userEmail: user.email ?? "" },
    requestPolicy: "cache-and-network",
  });

  const [, cancelReservation] = useMutation(CancelReservationDocument);
  const [, cancelWaitlist] = useMutation(CancelWaitlistEntryDocument);

  const refresh = useCallback(() => {
    reexecute({ requestPolicy: "network-only" });
    reexecuteWaitlist({ requestPolicy: "network-only" });
  }, [reexecute, reexecuteWaitlist]);

  const reservations = resResult.data?.getUserReservations ?? [];
  const waitlistEntries = waitlistResult.data?.getUserWaitlistEntries ?? [];

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    return reservations.filter((r) => {
      const rTime = new Date(r.reservationTime);
      if (tab === "Upcoming") {
        return (
          (r.status === "PENDING" || r.status === "CONFIRMED") &&
          rTime >= now
        );
      }
      if (tab === "Cancelled") return r.status === "CANCELLED";
      return r.status === "COMPLETED" || (rTime < now && r.status !== "CANCELLED");
    });
  }, [reservations, tab, now]);

  const activeWaitlist = useMemo(
    () => waitlistEntries.filter((w) => w.status === "WAITING" || w.status === "CALLED"),
    [waitlistEntries]
  );

  const handleCancelReservation = async (id: string) => {
    if (!window.confirm("Cancel this reservation?")) return;
    const t = toast.loading("Cancelling...");
    const res = await cancelReservation({ cancelReservationId: id });
    if (res.error) {
      toast.error(res.error.message, { id: t });
    } else {
      toast.success("Reservation cancelled", { id: t });
      refresh();
    }
  };

  const handleCancelWaitlist = async (id: string) => {
    if (!window.confirm("Leave the waitlist?")) return;
    const t = toast.loading("Removing...");
    const res = await cancelWaitlist({ id });
    if (res.error) {
      toast.error(res.error.message, { id: t });
    } else {
      toast.success("Removed from waitlist", { id: t });
      refresh();
    }
  };

  const loading = resResult.fetching || waitlistResult.fetching;
  const error = resResult.error || waitlistResult.error;

  return (
    <div className="flex flex-col items-center py-8 px-4 mb-24">
      <div className="mt-4 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-full border border-green-500 bg-green-600 px-4 py-1 text-lg text-white hover:bg-green-200 hover:text-green-700"
        >
          <HiOutlineChevronLeft />
          <span>Back to Home</span>
          <HiHome size={20} />
        </Link>
      </div>

      <div className="mt-6 w-full max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-800">
            <BsCalendarCheck className="text-green-600" />
            My Reservations
          </h1>
          <button
            onClick={refresh}
            className="rounded-lg bg-gray-100 p-2 text-gray-500 hover:bg-gray-200"
          >
            <BsArrowRepeat className={loading ? "animate-spin" : ""} size={18} />
          </button>
        </div>

        {/* Active waitlist entries */}
        {activeWaitlist.length > 0 && (
          <div className="mb-6 space-y-3">
            {activeWaitlist.map((w) => (
              <div
                key={w.id}
                className={`rounded-2xl border p-4 shadow-sm ${
                  w.status === "CALLED"
                    ? "border-green-300 bg-green-50"
                    : "border-amber-200 bg-amber-50"
                }`}
              >
                {w.status === "CALLED" && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white">
                    <BsBell className="animate-bounce" />
                    Your table is ready! Please check in with staff.
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-700">
                      Waitlist &mdash; {w.area.name}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                      <BsPeople size={14} />
                      {w.numOfDiners} guests
                    </p>
                  </div>
                  {w.status === "WAITING" && (
                    <button
                      onClick={() => handleCancelWaitlist(w.id)}
                      className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50"
                    >
                      Leave
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${
                tab === t
                  ? "bg-green-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-600">{error.message}</p>
            <button
              onClick={refresh}
              className="mt-2 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        )}

        {loading && !resResult.data ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
                <div className="mb-3 h-5 w-40 rounded bg-gray-200" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-4 rounded bg-gray-100" />
                  <div className="h-4 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <BsCalendarCheck size={48} className="mb-3 text-gray-300" />
            <p className="font-bold text-gray-400">
              No {tab.toLowerCase()} reservations
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((r) => {
              const dt = new Date(r.reservationTime);
              const style =
                STATUS_STYLES[r.status] ?? STATUS_STYLES.PENDING;
              const label =
                STATUS_LABELS[r.status] ?? r.status;

              return (
                <div
                  key={r.id}
                  className={`rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md ${
                    r.status === "CANCELLED" ? "opacity-60" : ""
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-800">
                      {dateFmt.format(dt)}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-black ${style}`}
                    >
                      {label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <BsClock className="text-gray-400" />
                      {timeFmt.format(dt)}
                    </div>
                    <div className="flex items-center gap-2">
                      <BsPeople className="text-gray-400" />
                      {r.numOfDiners} guests
                    </div>
                    <div className="flex items-center gap-2">
                      <BsGeoAlt className="text-gray-400" />
                      {r.table.area.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <BsCalendarCheck className="text-gray-400" />
                      Table {r.table.tableNumber}
                    </div>
                  </div>

                  {tab === "Upcoming" && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleCancelReservation(r.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50"
                      >
                        <BsXCircle />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
