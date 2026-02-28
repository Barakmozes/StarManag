"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { User } from "@prisma/client";
import { useQuery, useMutation } from "@urql/next";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineChevronLeft,
  HiOutlineArrowPath,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePencilSquare,
} from "react-icons/hi2";

import {
  GetActiveClockInDocument,
  GetActiveClockInQuery,
  GetActiveClockInQueryVariables,
  GetMyShiftsDocument,
  GetMyShiftsQuery,
  GetMyShiftsQueryVariables,
  GetMyTimeEntriesDocument,
  GetMyTimeEntriesQuery,
  GetMyTimeEntriesQueryVariables,
  GetAttendanceSummaryDocument,
  GetAttendanceSummaryQuery,
  GetAttendanceSummaryQueryVariables,
  ClockInDocument,
  ClockOutDocument,
} from "@/graphql/generated";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Props = { user: User };

// ---------------------------------------------------------------------------
// Date Helpers
// ---------------------------------------------------------------------------

const TZ = "Asia/Jerusalem";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: TZ,
});

const timeFmt = new Intl.DateTimeFormat("he-IL", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const dateTimeFmt = new Intl.DateTimeFormat("he-IL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

function toDate(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v as string);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTime(v: unknown): string {
  const d = toDate(v);
  return d ? timeFmt.format(d) : "--:--";
}

function formatDate(v: unknown): string {
  const d = toDate(v);
  return d ? dateFmt.format(d) : "---";
}

function formatDateTime(v: unknown): string {
  const d = toDate(v);
  return d ? dateTimeFmt.format(d) : "---";
}

function formatHours(h: number | null | undefined): string {
  if (h == null || !Number.isFinite(h)) return "---";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return `${hrs}h ${mins}m`;
}

function elapsedSince(start: Date): string {
  const diff = Math.max(0, Date.now() - start.getTime());
  const totalSec = Math.floor(diff / 1000);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  return [
    hrs.toString().padStart(2, "0"),
    mins.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":");
}

// ---------------------------------------------------------------------------
// Date ranges
// ---------------------------------------------------------------------------

function getUpcomingRange(): { from: string; to: string } {
  const now = new Date();
  const to = new Date(now);
  to.setDate(to.getDate() + 7);
  return { from: now.toISOString(), to: to.toISOString() };
}

function getHistoryRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 30);
  return { from: from.toISOString(), to: now.toISOString() };
}

function getMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: from.toISOString(), to: now.toISOString() };
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function roleBadgeClass(role: string | null | undefined): string {
  switch (role) {
    case "WAITER":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "DELIVERY":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "MANAGER":
      return "bg-purple-100 text-purple-700 border-purple-200";
    case "ADMIN":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function shiftStatusBadge(status: string): {
  className: string;
  label: string;
} {
  switch (status) {
    case "PUBLISHED":
      return {
        className: "bg-green-100 text-green-700 border-green-200",
        label: "Published",
      };
    case "CANCELLED":
      return {
        className: "bg-red-100 text-red-600 border-red-200",
        label: "Cancelled",
      };
    case "DRAFT":
    default:
      return {
        className: "bg-gray-100 text-gray-500 border-gray-200",
        label: "Draft",
      };
  }
}

function timeEntryStatusBadge(status: string): {
  className: string;
  label: string;
} {
  switch (status) {
    case "ACTIVE":
      return {
        className: "bg-green-100 text-green-700 border-green-200",
        label: "Active",
      };
    case "COMPLETED":
      return {
        className: "bg-blue-100 text-blue-700 border-blue-200",
        label: "Completed",
      };
    case "AUTO_CLOSED":
      return {
        className: "bg-amber-100 text-amber-700 border-amber-200",
        label: "Auto-closed",
      };
    case "EDITED":
      return {
        className: "bg-purple-100 text-purple-700 border-purple-200",
        label: "Edited",
      };
    default:
      return {
        className: "bg-slate-100 text-slate-600 border-slate-200",
        label: status,
      };
  }
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function MyShifts({ user }: Props) {
  const upcomingRange = useMemo(getUpcomingRange, []);
  const historyRange = useMemo(getHistoryRange, []);
  const monthRange = useMemo(getMonthRange, []);

  // ---- Queries ----

  const [activeClockInResult, refetchActiveClockIn] = useQuery<
    GetActiveClockInQuery,
    GetActiveClockInQueryVariables
  >({
    query: GetActiveClockInDocument,
    variables: {},
    requestPolicy: "cache-and-network",
  });

  const [upcomingResult, refetchUpcoming] = useQuery<
    GetMyShiftsQuery,
    GetMyShiftsQueryVariables
  >({
    query: GetMyShiftsDocument,
    variables: { from: upcomingRange.from, to: upcomingRange.to, first: 50 },
    requestPolicy: "cache-and-network",
  });

  const [historyResult, refetchHistory] = useQuery<
    GetMyShiftsQuery,
    GetMyShiftsQueryVariables
  >({
    query: GetMyShiftsDocument,
    variables: { from: historyRange.from, to: historyRange.to, first: 50 },
    requestPolicy: "cache-and-network",
  });

  const [timeEntriesResult, refetchTimeEntries] = useQuery<
    GetMyTimeEntriesQuery,
    GetMyTimeEntriesQueryVariables
  >({
    query: GetMyTimeEntriesDocument,
    variables: { from: historyRange.from, to: historyRange.to, first: 50 },
    requestPolicy: "cache-and-network",
  });

  const [summaryResult, refetchSummary] = useQuery<
    GetAttendanceSummaryQuery,
    GetAttendanceSummaryQueryVariables
  >({
    query: GetAttendanceSummaryDocument,
    variables: { from: monthRange.from, to: monthRange.to },
    requestPolicy: "cache-and-network",
  });

  // ---- Mutations ----

  const [, doClockIn] = useMutation(ClockInDocument);
  const [, doClockOut] = useMutation(ClockOutDocument);

  // ---- Local state ----

  const [clockNote, setClockNote] = useState("");
  const [clockLoading, setClockLoading] = useState(false);

  // ---- Derived data ----

  const activeEntry = activeClockInResult.data?.getActiveClockIn ?? null;
  const isClockedIn = activeEntry != null;

  const upcomingShifts = useMemo(() => {
    const edges = upcomingResult.data?.getMyShifts?.edges ?? [];
    return edges
      .map((e) => e.node)
      .filter(
        (s) => s.status === "PUBLISHED" && toDate(s.startTime)! > new Date()
      );
  }, [upcomingResult.data]);

  const historyShifts = useMemo(() => {
    const edges = historyResult.data?.getMyShifts?.edges ?? [];
    return edges.map((e) => e.node);
  }, [historyResult.data]);

  const timeEntriesMap = useMemo(() => {
    const edges = timeEntriesResult.data?.getMyTimeEntries?.edges ?? [];
    const map = new Map<string, typeof edges[0]["node"][]>();
    for (const edge of edges) {
      const shiftId = edge.node.shiftId;
      if (shiftId) {
        const existing = map.get(shiftId) ?? [];
        existing.push(edge.node);
        map.set(shiftId, existing);
      }
    }
    return map;
  }, [timeEntriesResult.data]);

  // Time entries not linked to any shift
  const unlinkedTimeEntries = useMemo(() => {
    const edges = timeEntriesResult.data?.getMyTimeEntries?.edges ?? [];
    return edges.map((e) => e.node).filter((te) => !te.shiftId);
  }, [timeEntriesResult.data]);

  const summary = summaryResult.data?.getAttendanceSummary ?? null;

  // ---- Refresh all ----

  const refreshAll = useCallback(() => {
    refetchActiveClockIn({ requestPolicy: "network-only" });
    refetchUpcoming({ requestPolicy: "network-only" });
    refetchHistory({ requestPolicy: "network-only" });
    refetchTimeEntries({ requestPolicy: "network-only" });
    refetchSummary({ requestPolicy: "network-only" });
  }, [
    refetchActiveClockIn,
    refetchUpcoming,
    refetchHistory,
    refetchTimeEntries,
    refetchSummary,
  ]);

  // ---- Clock In / Out handlers ----

  const handleClockIn = async () => {
    setClockLoading(true);
    const t = toast.loading("Clocking in...");
    try {
      const res = await doClockIn({ note: clockNote || undefined });
      if (res.error) {
        toast.error(res.error.message, { id: t });
      } else {
        toast.success("Clocked in successfully!", { id: t });
        setClockNote("");
        refreshAll();
      }
    } catch {
      toast.error("An unexpected error occurred", { id: t });
    } finally {
      setClockLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockLoading(true);
    const t = toast.loading("Clocking out...");
    try {
      const res = await doClockOut({
        timeEntryId: activeEntry?.id,
        note: clockNote || undefined,
      });
      if (res.error) {
        toast.error(res.error.message, { id: t });
      } else {
        toast.success("Clocked out successfully!", { id: t });
        setClockNote("");
        refreshAll();
      }
    } catch {
      toast.error("An unexpected error occurred", { id: t });
    } finally {
      setClockLoading(false);
    }
  };

  // ---- Loading / Error ----

  const isLoading =
    activeClockInResult.fetching &&
    !activeClockInResult.data &&
    upcomingResult.fetching &&
    !upcomingResult.data;

  const hasError =
    activeClockInResult.error ||
    upcomingResult.error ||
    historyResult.error ||
    timeEntriesResult.error ||
    summaryResult.error;

  // ---- Render ----

  return (
    <div className="flex flex-col items-center py-6 px-2 sm:px-4 mb-24">
      {/* Header */}
      <div className="w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <Link
            href="/user"
            className="inline-flex items-center gap-1.5 rounded-full border border-green-500 bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-200 hover:text-green-700 transition"
          >
            <HiOutlineChevronLeft size={16} />
            <span>Back to Profile</span>
          </Link>

          <h1 className="flex items-center gap-2 text-2xl sm:text-3xl font-bold text-gray-800">
            <HiOutlineClock className="text-green-600" size={28} />
            My Shifts
          </h1>

          <button
            onClick={refreshAll}
            className="rounded-lg bg-gray-100 p-2.5 text-gray-500 hover:bg-gray-200 transition"
            title="Refresh"
          >
            <HiOutlineArrowPath
              className={
                activeClockInResult.fetching || upcomingResult.fetching
                  ? "animate-spin"
                  : ""
              }
              size={20}
            />
          </button>
        </div>

        {/* Global error banner */}
        {hasError && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-center">
            <p className="text-sm text-red-600 flex items-center justify-center gap-2">
              <HiOutlineExclamationTriangle size={18} />
              Error loading some data. Please try refreshing.
            </p>
            <button
              onClick={refreshAll}
              className="mt-2 rounded-lg bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Clock In/Out Section */}
            <ClockSection
              isClockedIn={isClockedIn}
              activeEntry={activeEntry}
              clockNote={clockNote}
              setClockNote={setClockNote}
              onClockIn={handleClockIn}
              onClockOut={handleClockOut}
              loading={clockLoading}
            />

            {/* Hours Summary */}
            {summary && <HoursSummaryCard summary={summary} />}

            {/* Upcoming Shifts */}
            <UpcomingShifts
              shifts={upcomingShifts}
              fetching={upcomingResult.fetching}
            />

            {/* Shift History */}
            <ShiftHistoryTable
              shifts={historyShifts}
              timeEntriesMap={timeEntriesMap}
              unlinkedTimeEntries={unlinkedTimeEntries}
              fetching={historyResult.fetching}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClockSection
// ---------------------------------------------------------------------------

function ClockSection({
  isClockedIn,
  activeEntry,
  clockNote,
  setClockNote,
  onClockIn,
  onClockOut,
  loading,
}: {
  isClockedIn: boolean;
  activeEntry: {
    id: string;
    clockIn: unknown;
    status: string;
    note?: string | null;
    shiftId?: string | null;
    shift?: {
      id: string;
      startTime: unknown;
      endTime: unknown;
      shiftRole?: string | null;
    } | null;
  } | null;
  clockNote: string;
  setClockNote: (v: string) => void;
  onClockIn: () => void;
  onClockOut: () => void;
  loading: boolean;
}) {
  const [elapsed, setElapsed] = useState("00:00:00");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isClockedIn && activeEntry?.clockIn) {
      const clockInDate = toDate(activeEntry.clockIn);
      if (!clockInDate) return;

      const tick = () => setElapsed(elapsedSince(clockInDate));
      tick();
      timerRef.current = setInterval(tick, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      setElapsed("00:00:00");
    }
  }, [isClockedIn, activeEntry?.clockIn]);

  return (
    <section className="mb-8">
      <div
        className={`rounded-2xl border-2 p-6 sm:p-8 text-center transition-all ${
          isClockedIn
            ? "border-green-300 bg-green-50/50"
            : "border-gray-200 bg-white"
        }`}
      >
        {/* Status label */}
        <div className="mb-3">
          {isClockedIn ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-600 px-3 py-1 text-sm font-bold text-white">
              <span className="inline-block h-2 w-2 rounded-full bg-white animate-pulse" />
              Clocked In
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-200 px-3 py-1 text-sm font-semibold text-gray-600">
              Not Clocked In
            </span>
          )}
        </div>

        {/* Elapsed timer */}
        {isClockedIn && (
          <div className="mb-2">
            <div className="text-4xl sm:text-5xl font-mono font-bold text-green-700 tracking-wider">
              {elapsed}
            </div>
            <div className="mt-1 text-sm text-gray-500">
              Since {formatTime(activeEntry?.clockIn)}
              {activeEntry?.shift?.shiftRole && (
                <span className="ml-2">
                  ({activeEntry.shift.shiftRole})
                </span>
              )}
            </div>
          </div>
        )}

        {/* Note input */}
        <div className="mt-4 mx-auto max-w-md">
          <input
            type="text"
            value={clockNote}
            onChange={(e) => setClockNote(e.target.value)}
            placeholder={isClockedIn ? "Add note (optional)..." : "Note for clock-in (optional)..."}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 placeholder:text-gray-400 focus:border-green-400 focus:ring-2 focus:ring-green-200 focus:outline-none transition"
          />
        </div>

        {/* Clock button */}
        <div className="mt-4">
          {isClockedIn ? (
            <button
              onClick={onClockOut}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-10 py-4 text-lg font-bold text-white shadow-lg hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <HiOutlineXCircle size={24} />
              Clock Out
            </button>
          ) : (
            <button
              onClick={onClockIn}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-green-600 px-10 py-4 text-lg font-bold text-white shadow-lg hover:bg-green-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <HiOutlineCheckCircle size={24} />
              Clock In
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// HoursSummaryCard
// ---------------------------------------------------------------------------

type SummaryData = {
  totalHours: number;
  shiftCount: number;
  avgHoursPerShift: number;
  overtimeHours: number;
  attendanceRate: number;
  lateCount: number;
  missedCount: number;
};

function HoursSummaryCard({ summary }: { summary: SummaryData }) {
  const stats = [
    {
      label: "Total Hours",
      value: formatHours(summary.totalHours),
      icon: <HiOutlineClock size={20} className="text-green-600" />,
    },
    {
      label: "Shifts Worked",
      value: summary.shiftCount.toString(),
      icon: <HiOutlineCalendarDays size={20} className="text-blue-600" />,
    },
    {
      label: "Avg Hours / Shift",
      value: formatHours(summary.avgHoursPerShift),
      icon: <HiOutlineChartBar size={20} className="text-indigo-600" />,
    },
    {
      label: "Overtime",
      value: formatHours(summary.overtimeHours),
      icon: <HiOutlineExclamationTriangle size={20} className="text-amber-600" />,
    },
    {
      label: "Attendance",
      value: `${summary.attendanceRate.toFixed(0)}%`,
      icon: <HiOutlineCheckCircle size={20} className="text-emerald-600" />,
    },
  ];

  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
        <HiOutlineChartBar size={22} className="text-green-600" />
        This Month Summary
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm text-center"
          >
            <div className="flex justify-center mb-2">{stat.icon}</div>
            <div className="text-xl font-bold text-gray-800">{stat.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>
      {/* Secondary stats */}
      {(summary.lateCount > 0 || summary.missedCount > 0) && (
        <div className="mt-3 flex flex-wrap gap-3 justify-center">
          {summary.lateCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              <HiOutlineExclamationTriangle size={14} />
              {summary.lateCount} late arrival{summary.lateCount !== 1 ? "s" : ""}
            </span>
          )}
          {summary.missedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
              <HiOutlineXCircle size={14} />
              {summary.missedCount} missed shift{summary.missedCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// UpcomingShifts
// ---------------------------------------------------------------------------

type ShiftNode = {
  id: string;
  startTime: unknown;
  endTime: unknown;
  status: string;
  note?: string | null;
  shiftRole?: string | null;
  areaId?: string | null;
  area?: { name: string } | null;
  timeEntries?: {
    id: string;
    clockIn: unknown;
    clockOut?: unknown;
    hoursWorked?: number | null;
    status: string;
  }[];
  createdAt: unknown;
};

function UpcomingShifts({
  shifts,
  fetching,
}: {
  shifts: ShiftNode[];
  fetching: boolean;
}) {
  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
        <HiOutlineCalendarDays size={22} className="text-green-600" />
        Upcoming Shifts
        {shifts.length > 0 && (
          <span className="text-sm font-normal text-gray-400">
            ({shifts.length})
          </span>
        )}
      </h2>

      {fetching && shifts.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-100 bg-white p-5"
            >
              <div className="h-5 w-32 rounded bg-gray-200 mb-2" />
              <div className="h-4 w-48 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      ) : shifts.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
          <HiOutlineCalendarDays size={40} className="mb-2 text-gray-300" />
          <p className="font-semibold text-gray-400">
            No upcoming shifts scheduled
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Check back later or contact your manager
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {shifts.map((shift) => {
            const startDate = toDate(shift.startTime);
            const endDate = toDate(shift.endTime);
            const statusBadge = shiftStatusBadge(shift.status);

            // Calculate duration in hours
            let durationStr = "---";
            if (startDate && endDate) {
              const hrs =
                (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
              durationStr = formatHours(hrs);
            }

            return (
              <div
                key={shift.id}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition"
              >
                {/* Date row */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-gray-800">
                    {formatDate(shift.startTime)}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${statusBadge.className}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                {/* Time range */}
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <HiOutlineClock size={16} className="text-gray-400" />
                  <span>
                    {formatTime(shift.startTime)} - {formatTime(shift.endTime)}
                  </span>
                  <span className="text-gray-400">({durationStr})</span>
                </div>

                {/* Badges row */}
                <div className="flex flex-wrap gap-1.5">
                  {shift.shiftRole && (
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${roleBadgeClass(
                        shift.shiftRole
                      )}`}
                    >
                      {shift.shiftRole}
                    </span>
                  )}
                  {shift.area?.name && (
                    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
                      {shift.area.name}
                    </span>
                  )}
                </div>

                {/* Note */}
                {shift.note && (
                  <div className="mt-2 flex items-start gap-1.5 text-xs text-gray-500">
                    <HiOutlinePencilSquare
                      size={14}
                      className="shrink-0 mt-0.5 text-gray-400"
                    />
                    <span className="line-clamp-2">{shift.note}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// ShiftHistoryTable
// ---------------------------------------------------------------------------

type TimeEntryNode = {
  id: string;
  clockIn: unknown;
  clockOut?: unknown;
  hoursWorked?: number | null;
  status: string;
  note?: string | null;
  shiftId?: string | null;
  shift?: {
    id: string;
    startTime: unknown;
    endTime: unknown;
    shiftRole?: string | null;
  } | null;
  createdAt: unknown;
};

function ShiftHistoryTable({
  shifts,
  timeEntriesMap,
  unlinkedTimeEntries,
  fetching,
}: {
  shifts: ShiftNode[];
  timeEntriesMap: Map<string, TimeEntryNode[]>;
  unlinkedTimeEntries: TimeEntryNode[];
  fetching: boolean;
}) {
  if (fetching && shifts.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
          <HiOutlineClock size={22} className="text-green-600" />
          Shift History (Past 30 Days)
        </h2>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-100 bg-white p-5"
            >
              <div className="h-5 w-40 rounded bg-gray-200 mb-3" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-4 rounded bg-gray-100" />
                <div className="h-4 rounded bg-gray-100" />
                <div className="h-4 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  const hasData = shifts.length > 0 || unlinkedTimeEntries.length > 0;

  return (
    <section className="mb-8">
      <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800 mb-3">
        <HiOutlineClock size={22} className="text-green-600" />
        Shift History (Past 30 Days)
        {shifts.length > 0 && (
          <span className="text-sm font-normal text-gray-400">
            ({shifts.length} shift{shifts.length !== 1 ? "s" : ""})
          </span>
        )}
      </h2>

      {!hasData ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
          <HiOutlineClock size={40} className="mb-2 text-gray-300" />
          <p className="font-semibold text-gray-400">
            No shift history available
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Scheduled shifts with matched time entries */}
          {shifts.map((shift) => {
            const statusBadge = shiftStatusBadge(shift.status);
            const matchedEntries = timeEntriesMap.get(shift.id) ?? [];

            return (
              <div
                key={shift.id}
                className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden"
              >
                {/* Shift header */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-800">
                          {formatDate(shift.startTime)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatTime(shift.startTime)} -{" "}
                          {formatTime(shift.endTime)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusBadge.className}`}
                        >
                          {statusBadge.label}
                        </span>
                        {shift.shiftRole && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${roleBadgeClass(
                              shift.shiftRole
                            )}`}
                          >
                            {shift.shiftRole}
                          </span>
                        )}
                        {shift.area?.name && (
                          <span className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                            {shift.area.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Shift note */}
                  {shift.note && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-500 sm:max-w-[200px]">
                      <HiOutlinePencilSquare
                        size={14}
                        className="shrink-0 mt-0.5 text-gray-400"
                      />
                      <span className="line-clamp-2">{shift.note}</span>
                    </div>
                  )}
                </div>

                {/* Matched time entries */}
                {matchedEntries.length > 0 && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                    <div className="text-[11px] uppercase tracking-wider text-gray-400 font-bold mb-2">
                      Time Entries
                    </div>
                    <div className="space-y-2">
                      {matchedEntries.map((te) => {
                        const teBadge = timeEntryStatusBadge(te.status);
                        return (
                          <div
                            key={te.id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-lg bg-white border border-gray-100 px-3 py-2"
                          >
                            <div className="flex items-center gap-3 text-sm">
                              <span className="text-gray-600">
                                {formatTime(te.clockIn)}
                              </span>
                              <span className="text-gray-400">-</span>
                              <span className="text-gray-600">
                                {te.clockOut
                                  ? formatTime(te.clockOut)
                                  : "In progress"}
                              </span>
                              {te.hoursWorked != null && (
                                <span className="font-semibold text-gray-800">
                                  {formatHours(te.hoursWorked)}
                                </span>
                              )}
                            </div>
                            <span
                              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${teBadge.className}`}
                            >
                              {teBadge.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No time entries */}
                {matchedEntries.length === 0 &&
                  shift.status === "PUBLISHED" && (
                    <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3">
                      <div className="text-xs text-gray-400 italic">
                        No clock-in recorded for this shift
                      </div>
                    </div>
                  )}
              </div>
            );
          })}

          {/* Unlinked time entries (clock-ins without a scheduled shift) */}
          {unlinkedTimeEntries.length > 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50/30 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="text-sm font-bold text-amber-800 mb-1">
                  Extra Clock-ins (No Scheduled Shift)
                </div>
                <div className="text-xs text-amber-600 mb-3">
                  These time entries were not matched to a scheduled shift
                </div>
                <div className="space-y-2">
                  {unlinkedTimeEntries.map((te) => {
                    const teBadge = timeEntryStatusBadge(te.status);
                    return (
                      <div
                        key={te.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 rounded-lg bg-white border border-amber-100 px-3 py-2"
                      >
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-700 font-semibold">
                            {formatDate(te.clockIn)}
                          </span>
                          <span className="text-gray-600">
                            {formatTime(te.clockIn)}
                          </span>
                          <span className="text-gray-400">-</span>
                          <span className="text-gray-600">
                            {te.clockOut
                              ? formatTime(te.clockOut)
                              : "In progress"}
                          </span>
                          {te.hoursWorked != null && (
                            <span className="font-semibold text-gray-800">
                              {formatHours(te.hoursWorked)}
                            </span>
                          )}
                        </div>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${teBadge.className}`}
                        >
                          {teBadge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// LoadingSkeleton
// ---------------------------------------------------------------------------

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Clock section skeleton */}
      <div className="animate-pulse rounded-2xl border-2 border-gray-200 p-8">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-28 rounded-full bg-gray-200" />
          <div className="h-12 w-48 rounded bg-gray-200" />
          <div className="h-10 w-64 rounded-lg bg-gray-100" />
          <div className="h-14 w-40 rounded-2xl bg-gray-200" />
        </div>
      </div>

      {/* Summary skeleton */}
      <div>
        <div className="h-6 w-48 rounded bg-gray-200 mb-3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="h-5 w-5 rounded-full bg-gray-200 mx-auto mb-2" />
              <div className="h-6 w-16 rounded bg-gray-200 mx-auto mb-1" />
              <div className="h-3 w-20 rounded bg-gray-100 mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming skeleton */}
      <div>
        <div className="h-6 w-40 rounded bg-gray-200 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-100 bg-white p-4"
            >
              <div className="h-5 w-32 rounded bg-gray-200 mb-2" />
              <div className="h-4 w-48 rounded bg-gray-100 mb-2" />
              <div className="h-4 w-20 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>

      {/* History skeleton */}
      <div>
        <div className="h-6 w-56 rounded bg-gray-200 mb-3" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-100 bg-white p-5"
            >
              <div className="h-5 w-40 rounded bg-gray-200 mb-3" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-4 rounded bg-gray-100" />
                <div className="h-4 rounded bg-gray-100" />
                <div className="h-4 rounded bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
