"use client";

import React, { useState, useMemo } from "react";
import { useQuery } from "@urql/next";
import {
  GetReservationsDocument,
  GetReservationsQuery,
  GetReservationsQueryVariables,
  ReservationStatus,
} from "@/graphql/generated";
import { useRestaurantStore } from "@/lib/AreaStore";
import { getIsraelDateString } from "@/lib/localeUtils";
import { ModalBase } from "./ui/ModalBase";
import { HiCalendarDays, HiClock } from "react-icons/hi2";
import { BsInbox, BsPeople, BsArrowRepeat } from "react-icons/bs";

type StatusFilter = "ALL" | ReservationStatus;

const STATUS_STYLES: Record<string, { label: string; cls: string }> = {
  CONFIRMED: {
    label: "Confirmed",
    cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  PENDING: {
    label: "Pending",
    cls: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CANCELLED: {
    label: "Cancelled",
    cls: "bg-red-50 text-red-400 border-red-100",
  },
  COMPLETED: {
    label: "Completed",
    cls: "bg-gray-100 text-gray-500 border-gray-200",
  },
};

const FILTER_TABS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: ReservationStatus.Pending, label: "Pending" },
  { key: ReservationStatus.Confirmed, label: "Confirmed" },
  { key: ReservationStatus.Completed, label: "Completed" },
  { key: ReservationStatus.Cancelled, label: "Cancelled" },
];

export default function DailyReservationsModal() {
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const areas = useRestaurantStore((s) => s.areas);
  const storeTables = useRestaurantStore((s) => s.tables);

  const todayStr = getIsraelDateString();

  const [result, reexecute] = useQuery<
    GetReservationsQuery,
    GetReservationsQueryVariables
  >({
    query: GetReservationsDocument,
    pause: !open,
    requestPolicy: "cache-and-network",
  });

  const { data, fetching } = result;

  const areaNameByTableId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of storeTables) {
      const area = areas.find((a) => a.id === t.areaId);
      map[t.id] = area?.name ?? "—";
    }
    return map;
  }, [storeTables, areas]);

  const allTodayReservations = useMemo(() => {
    if (!data?.getReservations) return [];
    return data.getReservations.filter((r) =>
      r.reservationTime.startsWith(todayStr),
    );
  }, [data, todayStr]);

  const filteredReservations = useMemo(() => {
    return allTodayReservations
      .filter((r) => statusFilter === "ALL" || r.status === statusFilter)
      .sort(
        (a, b) =>
          new Date(a.reservationTime).getTime() -
          new Date(b.reservationTime).getTime(),
      );
  }, [allTodayReservations, statusFilter]);

  const stats = useMemo(() => {
    const list = allTodayReservations;
    return {
      total: list.length,
      confirmed: list.filter((r) => r.status === "CONFIRMED").length,
      pending: list.filter((r) => r.status === "PENDING").length,
      completed: list.filter((r) => r.status === "COMPLETED").length,
    };
  }, [allTodayReservations]);

  const groupedByTable = useMemo(() => {
    const groups: Record<
      string,
      {
        tableNumber: number;
        areaName: string;
        items: typeof filteredReservations;
      }
    > = {};
    for (const r of filteredReservations) {
      const key = r.tableId;
      if (!groups[key]) {
        groups[key] = {
          tableNumber: r.table.tableNumber,
          areaName: areaNameByTableId[r.tableId] ?? "—",
          items: [],
        };
      }
      groups[key].items.push(r);
    }
    return Object.values(groups).sort(
      (a, b) => a.tableNumber - b.tableNumber,
    );
  }, [filteredReservations, areaNameByTableId]);

  function getDisplayName(r: GetReservationsQuery["getReservations"][number]) {
    const name = r.user?.name;
    if (name) return name;
    if (r.userEmail.includes("guest_")) {
      const parts = r.userEmail.split("_");
      return parts.length >= 2 ? parts[1].replace(/_/g, " ") : "Guest";
    }
    return r.userEmail.split("@")[0];
  }

  const dateDisplay = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 min-h-[40px] text-sm font-semibold rounded-full border transition-all duration-200 whitespace-nowrap bg-white border-gray-200 text-slate-700 hover:bg-violet-50 hover:border-violet-300 hover:text-violet-800"
        title="View today's reservations"
      >
        <HiCalendarDays size={16} className="opacity-70" />
        <span>Reservations</span>
      </button>

      <ModalBase
        open={open}
        onClose={() => {
          setOpen(false);
          setStatusFilter("ALL");
        }}
        title="Today's Reservations"
        size="xl"
      >
        {/* Date & Refresh */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500 font-medium">{dateDisplay}</p>
          <button
            onClick={() => reexecute({ requestPolicy: "network-only" })}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 transition-colors"
            disabled={fetching}
          >
            <BsArrowRepeat
              className={fetching ? "animate-spin" : ""}
              size={14}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: "Total",
              value: stats.total,
              color: "bg-blue-50 text-blue-700 border-blue-100",
            },
            {
              label: "Confirmed",
              value: stats.confirmed,
              color: "bg-emerald-50 text-emerald-700 border-emerald-100",
            },
            {
              label: "Pending",
              value: stats.pending,
              color: "bg-amber-50 text-amber-700 border-amber-100",
            },
            {
              label: "Completed",
              value: stats.completed,
              color: "bg-gray-50 text-gray-600 border-gray-100",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`flex flex-col items-center p-3 rounded-xl border ${s.color}`}
            >
              <span className="text-2xl font-black">{s.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                statusFilter === tab.key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {fetching && !data ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredReservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-gray-100 p-4 mb-3">
              <BsInbox size={28} className="text-gray-400" />
            </div>
            <p className="text-gray-500 font-semibold">
              {statusFilter === "ALL"
                ? "No reservations for today"
                : `No ${statusFilter.toLowerCase()} reservations`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedByTable.map((group) => (
              <div
                key={group.tableNumber}
                className="rounded-xl border border-gray-200 bg-white overflow-hidden"
              >
                {/* Table group header */}
                <div className="flex items-center justify-between bg-gray-50 px-4 py-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 text-white text-sm font-black">
                      {group.tableNumber}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-gray-800">
                        Table {group.tableNumber}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {group.areaName}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-100">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "reservation" : "reservations"}
                  </span>
                </div>

                {/* Reservation rows */}
                <div className="divide-y divide-gray-50">
                  {group.items.map((r) => {
                    const time = new Date(r.reservationTime).toLocaleTimeString(
                      "en-US",
                      { hour: "2-digit", minute: "2-digit" },
                    );
                    const style =
                      STATUS_STYLES[r.status] ?? STATUS_STYLES.PENDING;
                    const displayName = getDisplayName(r);

                    return (
                      <div
                        key={r.id}
                        className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 transition-colors hover:bg-gray-50/50 ${
                          r.status === "CANCELLED" ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:min-w-[90px]">
                          <HiClock
                            size={14}
                            className="text-gray-400 shrink-0"
                          />
                          <span className="text-sm font-bold text-gray-800">
                            {time}
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-gray-700 truncate block">
                            {displayName}
                          </span>
                          {r.user?.profile?.phone && (
                            <span className="text-xs text-gray-400">
                              {r.user.profile.phone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-gray-500">
                          <BsPeople size={13} />
                          <span className="text-xs font-semibold">
                            {r.numOfDiners}
                          </span>
                        </div>

                        <span
                          className={`self-start sm:self-auto text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${style.cls}`}
                        >
                          {style.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBase>
    </>
  );
}
