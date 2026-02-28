"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import { gql, useMutation, useQuery } from "@urql/next";
import {
  HiOutlineClock,
  HiOutlineChartBar,
  HiOutlineExclamationTriangle,
  HiOutlineCheckCircle,
  HiOutlinePencilSquare,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineChevronDown,
  HiOutlineFunnel,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { Role } from "@/graphql/generated";
import type { User } from "@prisma/client";

// ---------------------------------------------------------------------------
// GraphQL Documents (inline -- codegen not yet run for attendance operations)
// ---------------------------------------------------------------------------

const GET_TIME_ENTRIES = gql`
  query GetTimeEntries(
    $from: DateTime!
    $to: DateTime!
    $userEmail: String
    $status: TimeEntryStatus
    $first: Int
    $after: ID
  ) {
    getTimeEntries(
      from: $from
      to: $to
      userEmail: $userEmail
      status: $status
      first: $first
      after: $after
    ) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          clockIn
          clockOut
          hoursWorked
          status
          note
          userEmail
          shiftId
          editedByEmail
          user {
            name
            email
            image
          }
          shift {
            id
            startTime
            endTime
            shiftRole
          }
          createdAt
        }
      }
    }
  }
`;

const GET_ATTENDANCE_SUMMARY = gql`
  query GetAttendanceSummary($from: DateTime!, $to: DateTime!, $userEmail: String) {
    getAttendanceSummary(from: $from, to: $to, userEmail: $userEmail) {
      totalHours
      shiftCount
      avgHoursPerShift
      overtimeHours
      attendanceRate
      lateCount
      missedCount
    }
  }
`;

const GET_SHIFTS = gql`
  query GetShifts(
    $from: DateTime!
    $to: DateTime!
    $status: ShiftStatus
    $userEmail: String
    $areaId: String
    $first: Int
    $after: ID
  ) {
    getShifts(
      from: $from
      to: $to
      status: $status
      userEmail: $userEmail
      areaId: $areaId
      first: $first
      after: $after
    ) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          startTime
          endTime
          status
          note
          shiftRole
          userEmail
          areaId
          templateId
          user {
            name
            email
            image
          }
          area {
            name
          }
          createdAt
        }
      }
    }
  }
`;

const GET_EMPLOYEE_DASHBOARD_KPIS = gql`
  query GetEmployeeDashboardKpis($from: DateTime!, $to: DateTime!) {
    getEmployeeDashboardKpis(from: $from, to: $to) {
      totalShifts
      publishedShifts
      cancelledShifts
      totalHoursWorked
      avgHoursPerEmployee
      activeClockIns
      staffCount
      uniqueEmployeesWorked
    }
  }
`;

const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      name
      email
      image
      role
    }
  }
`;

const EDIT_TIME_ENTRY = gql`
  mutation EditTimeEntry(
    $id: String!
    $clockIn: DateTime
    $clockOut: DateTime
    $note: String
  ) {
    editTimeEntry(id: $id, clockIn: $clockIn, clockOut: $clockOut, note: $note) {
      id
      clockIn
      clockOut
      hoursWorked
      status
      editedByEmail
      note
      updatedAt
    }
  }
`;

const DELETE_TIME_ENTRY = gql`
  mutation DeleteTimeEntry($id: String!) {
    deleteTimeEntry(id: $id) {
      id
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimeEntryNode = {
  id: string;
  clockIn: string;
  clockOut: string | null;
  hoursWorked: number | null;
  status: "ACTIVE" | "COMPLETED" | "AUTO_CLOSED" | "EDITED";
  note: string | null;
  userEmail: string;
  shiftId: string | null;
  editedByEmail: string | null;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  shift: {
    id: string;
    startTime: string;
    endTime: string;
    shiftRole: string | null;
  } | null;
  createdAt: string;
};

type AttendanceSummaryData = {
  getAttendanceSummary: {
    totalHours: number;
    shiftCount: number;
    avgHoursPerShift: number;
    overtimeHours: number;
    attendanceRate: number;
    lateCount: number;
    missedCount: number;
  };
};

type ShiftNode = {
  id: string;
  startTime: string;
  endTime: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  note: string | null;
  shiftRole: string | null;
  userEmail: string;
  areaId: string | null;
  templateId: string | null;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  area: { name: string } | null;
  createdAt: string;
};

type GetTimeEntriesData = {
  getTimeEntries: {
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
    edges: Array<{ cursor: string; node: TimeEntryNode }>;
  };
};

type GetShiftsData = {
  getShifts: {
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
    edges: Array<{ cursor: string; node: ShiftNode }>;
  };
};

type EmployeeKpisData = {
  getEmployeeDashboardKpis: {
    totalShifts: number;
    publishedShifts: number;
    cancelledShifts: number;
    totalHoursWorked: number;
    avgHoursPerEmployee: number;
    activeClockIns: number;
    staffCount: number;
    uniqueEmployeesWorked: number;
  };
};

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: Role;
};

type GetUsersData = { getUsers: UserRow[] };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const TZ = "Asia/Jerusalem";

const dateFormatter = new Intl.DateTimeFormat("en-IL", {
  timeZone: TZ,
  year: "numeric",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("en-IL", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IL", {
  timeZone: TZ,
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? dateFormatter.format(d) : iso;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? timeFormatter.format(d) : iso;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return Number.isFinite(d.getTime()) ? dateTimeFormatter.format(d) : iso;
}

function fmtHours(h: number | null | undefined): string {
  if (h == null) return "--";
  return `${h.toFixed(1)}h`;
}

function toLocalDatetimeValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  // Convert to Jerusalem timezone for display in the datetime-local input
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}

function toLocalDateValue(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Deviation in minutes between two ISO date strings. Returns null if either is missing. */
function deviationMinutes(planned: string, actual: string | null): number | null {
  if (!actual) return null;
  const p = new Date(planned).getTime();
  const a = new Date(actual).getTime();
  if (!Number.isFinite(p) || !Number.isFinite(a)) return null;
  return Math.round((a - p) / 60_000);
}

/** Color class based on deviation minutes. */
function deviationColor(minutes: number | null): string {
  if (minutes === null) return "text-red-600 bg-red-50"; // no-show
  const abs = Math.abs(minutes);
  if (abs <= 10) return "text-green-700 bg-green-50";
  if (abs <= 30) return "text-amber-700 bg-amber-50";
  return "text-red-600 bg-red-50";
}

function deviationLabel(minutes: number | null): string {
  if (minutes === null) return "No-show";
  if (minutes === 0) return "On time";
  const abs = Math.abs(minutes);
  if (minutes > 0) return `${abs}m late`;
  return `${abs}m early`;
}

// ---------------------------------------------------------------------------
// StatusBadge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: TimeEntryNode["status"] }) {
  const map: Record<
    TimeEntryNode["status"],
    { label: string; cls: string }
  > = {
    ACTIVE: {
      label: "Active",
      cls: "bg-green-100 text-green-800 ring-green-300 animate-pulse",
    },
    COMPLETED: {
      label: "Completed",
      cls: "bg-blue-100 text-blue-800 ring-blue-300",
    },
    AUTO_CLOSED: {
      label: "Auto-closed",
      cls: "bg-amber-100 text-amber-800 ring-amber-300",
    },
    EDITED: {
      label: "Edited",
      cls: "bg-purple-100 text-purple-800 ring-purple-300",
    },
  };
  const { label, cls } = map[status] ?? { label: status, cls: "bg-slate-100 text-slate-700" };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// AttendanceKpiCards
// ---------------------------------------------------------------------------

function AttendanceKpiCards({
  summary,
  loading,
}: {
  summary: AttendanceSummaryData["getAttendanceSummary"] | null;
  loading: boolean;
}) {
  const cards = [
    {
      title: "Total Hours",
      value: summary ? fmtHours(summary.totalHours) : "--",
      icon: HiOutlineClock,
      color: "text-blue-600 bg-blue-100",
    },
    {
      title: "Attendance Rate",
      value: summary ? `${summary.attendanceRate.toFixed(1)}%` : "--",
      icon: HiOutlineChartBar,
      color: "text-green-600 bg-green-100",
    },
    {
      title: "Late Count",
      value: summary ? String(summary.lateCount) : "--",
      icon: HiOutlineExclamationTriangle,
      color: "text-amber-600 bg-amber-100",
    },
    {
      title: "Missed Shifts",
      value: summary ? String(summary.missedCount) : "--",
      icon: HiOutlineCheckCircle,
      color: "text-red-600 bg-red-100",
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className="rounded-lg border border-slate-100 bg-white p-5 shadow-sm"
        >
          <div
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${c.color}`}
            aria-hidden="true"
          >
            <c.icon className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            {loading ? (
              <span className="inline-block h-7 w-24 animate-pulse rounded bg-slate-100" />
            ) : (
              c.value
            )}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{c.title}</p>
        </div>
      ))}
    </section>
  );
}

// ---------------------------------------------------------------------------
// AttendanceFilters
// ---------------------------------------------------------------------------

function AttendanceFilters({
  from,
  to,
  selectedEmployeeEmail,
  selectedRole,
  employees,
  onFromChange,
  onToChange,
  onEmployeeChange,
  onRoleChange,
  onRefresh,
  refreshing,
}: {
  from: string;
  to: string;
  selectedEmployeeEmail: string;
  selectedRole: string;
  employees: UserRow[];
  onFromChange: (v: string) => void;
  onToChange: (v: string) => void;
  onEmployeeChange: (v: string) => void;
  onRoleChange: (v: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const staffRoles: Role[] = [Role.Admin, Role.Manager, Role.Waiter, Role.Delivery];

  const filteredEmployees = useMemo(() => {
    if (!selectedRole) return employees;
    return employees.filter((e) => e.role === selectedRole);
  }, [employees, selectedRole]);

  return (
    <section className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <HiOutlineFunnel className="h-4 w-4 text-slate-500" />
        <h3 className="text-sm font-semibold text-slate-700">Filters</h3>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* From */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => onFromChange(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>
        {/* To */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => onToChange(e.target.value)}
            className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
          />
        </div>
        {/* Role */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Role</label>
          <div className="relative">
            <select
              value={selectedRole}
              onChange={(e) => {
                onRoleChange(e.target.value);
                onEmployeeChange(""); // reset employee when role changes
              }}
              className="h-10 w-full appearance-none rounded-md border border-slate-200 px-3 pr-8 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white"
            >
              <option value="">All roles</option>
              {staffRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <HiOutlineChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        {/* Employee */}
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Employee</label>
          <div className="relative">
            <select
              value={selectedEmployeeEmail}
              onChange={(e) => onEmployeeChange(e.target.value)}
              className="h-10 w-full appearance-none rounded-md border border-slate-200 px-3 pr-8 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-white"
            >
              <option value="">All employees</option>
              {filteredEmployees.map((u) => (
                <option key={u.email} value={u.email ?? ""}>
                  {u.name || u.email || "Unnamed"}
                </option>
              ))}
            </select>
            <HiOutlineChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        {/* Refresh */}
        <div className="flex items-end">
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-60"
          >
            <HiOutlineArrowPath className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// AttendanceTable (time entries)
// ---------------------------------------------------------------------------

function AttendanceTable({
  entries,
  loading,
  hasNextPage,
  onLoadMore,
  loadingMore,
  canEdit,
  onEditEntry,
}: {
  entries: TimeEntryNode[];
  loading: boolean;
  hasNextPage: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
  canEdit: boolean;
  onEditEntry: (entry: TimeEntryNode) => void;
}) {
  if (loading && entries.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`te-sk-${i}`}
            className="h-16 animate-pulse rounded-lg border border-slate-100 bg-white"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
        No time entries found for the selected period.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {entries.map((entry) => (
          <TimeEntryCard
            key={entry.id}
            entry={entry}
            canEdit={canEdit}
            onEdit={() => onEditEntry(entry)}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Clock In</th>
                <th className="px-4 py-3">Clock Out</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Shift</th>
                {canEdit && <th className="px-4 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <TimeEntryRow
                  key={entry.id}
                  entry={entry}
                  canEdit={canEdit}
                  onEdit={() => onEditEntry(entry)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More */}
      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="h-10 w-full max-w-xs rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-60"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TimeEntryRow (desktop)
// ---------------------------------------------------------------------------

function TimeEntryRow({
  entry,
  canEdit,
  onEdit,
}: {
  entry: TimeEntryNode;
  canEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <tr className="bg-white hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          {entry.user.image ? (
            <Image
              src={entry.user.image}
              alt={entry.user.name || ""}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
              {(entry.user.name ?? entry.userEmail ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-slate-800">
              {entry.user.name || entry.userEmail}
            </p>
            <p className="truncate text-xs text-slate-400">{entry.userEmail}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
        {fmtDate(entry.clockIn)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
        {fmtTime(entry.clockIn)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
        {entry.clockOut ? fmtTime(entry.clockOut) : "--:--"}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800">
        {fmtHours(entry.hoursWorked)}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={entry.status} />
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
        {entry.shift ? (
          <span>
            {fmtTime(entry.shift.startTime)}-{fmtTime(entry.shift.endTime)}
            {entry.shift.shiftRole ? ` (${entry.shift.shiftRole})` : ""}
          </span>
        ) : (
          <span className="text-slate-300">Unlinked</span>
        )}
      </td>
      {canEdit && (
        <td className="px-4 py-3">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 transition"
            aria-label="Edit time entry"
          >
            <HiOutlinePencilSquare className="h-5 w-5 text-green-700" />
          </button>
        </td>
      )}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// TimeEntryCard (mobile)
// ---------------------------------------------------------------------------

function TimeEntryCard({
  entry,
  canEdit,
  onEdit,
}: {
  entry: TimeEntryNode;
  canEdit: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {entry.user.image ? (
            <Image
              src={entry.user.image}
              alt={entry.user.name || ""}
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
              {(entry.user.name ?? entry.userEmail ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">
              {entry.user.name || entry.userEmail}
            </p>
            <p className="truncate text-xs text-slate-400">{fmtDate(entry.clockIn)}</p>
          </div>
        </div>
        <StatusBadge status={entry.status} />
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs text-slate-400">Clock In</dt>
          <dd className="font-mono text-slate-700">{fmtTime(entry.clockIn)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Clock Out</dt>
          <dd className="font-mono text-slate-700">
            {entry.clockOut ? fmtTime(entry.clockOut) : "--:--"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Hours</dt>
          <dd className="font-semibold text-slate-800">{fmtHours(entry.hoursWorked)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Shift</dt>
          <dd className="text-slate-600">
            {entry.shift ? (
              <>
                {fmtTime(entry.shift.startTime)}-{fmtTime(entry.shift.endTime)}
              </>
            ) : (
              "Unlinked"
            )}
          </dd>
        </div>
      </dl>

      {canEdit && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-50 px-3 text-xs font-medium text-green-700 hover:bg-green-50 transition"
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanVsActualView
// ---------------------------------------------------------------------------

function PlanVsActualView({
  shifts,
  timeEntries,
  loading,
}: {
  shifts: ShiftNode[];
  timeEntries: TimeEntryNode[];
  loading: boolean;
}) {
  // Match published shifts to time entries by shiftId
  const rows = useMemo(() => {
    const entryByShiftId = new Map<string, TimeEntryNode>();
    for (const te of timeEntries) {
      if (te.shiftId) {
        // Take the first entry linked to each shift
        if (!entryByShiftId.has(te.shiftId)) {
          entryByShiftId.set(te.shiftId, te);
        }
      }
    }

    return shifts
      .filter((s) => s.status === "PUBLISHED")
      .map((shift) => {
        const actual = entryByShiftId.get(shift.id) ?? null;
        const startDev = deviationMinutes(shift.startTime, actual?.clockIn ?? null);
        const endDev = actual?.clockOut
          ? deviationMinutes(shift.endTime, actual.clockOut)
          : null;

        return { shift, actual, startDev, endDev };
      });
  }, [shifts, timeEntries]);

  if (loading && rows.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={`pva-sk-${i}`}
            className="h-14 animate-pulse rounded-lg border border-slate-100 bg-white"
          />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
        No published shifts found for the selected period.
      </div>
    );
  }

  return (
    <div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.map(({ shift, actual, startDev, endDev }) => (
          <PlanVsActualCard
            key={shift.id}
            shift={shift}
            actual={actual}
            startDev={startDev}
            endDev={endDev}
          />
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-lg border border-slate-100">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Planned Start</th>
                <th className="px-4 py-3">Actual Clock In</th>
                <th className="px-4 py-3">Start Deviation</th>
                <th className="px-4 py-3">Planned End</th>
                <th className="px-4 py-3">Actual Clock Out</th>
                <th className="px-4 py-3">End Deviation</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ shift, actual, startDev, endDev }) => (
                <PlanVsActualRow
                  key={shift.id}
                  shift={shift}
                  actual={actual}
                  startDev={startDev}
                  endDev={endDev}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanVsActualRow (desktop)
// ---------------------------------------------------------------------------

function PlanVsActualRow({
  shift,
  actual,
  startDev,
  endDev,
}: {
  shift: ShiftNode;
  actual: TimeEntryNode | null;
  startDev: number | null;
  endDev: number | null;
}) {
  return (
    <tr className="bg-white hover:bg-slate-50 transition-colors">
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {shift.user.image ? (
            <Image
              src={shift.user.image}
              alt={shift.user.name || ""}
              width={28}
              height={28}
              className="h-7 w-7 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
              {(shift.user.name ?? shift.userEmail ?? "?").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="truncate text-sm font-medium text-slate-800">
            {shift.user.name || shift.userEmail}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
        {fmtDate(shift.startTime)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
        {fmtTime(shift.startTime)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
        {actual ? fmtTime(actual.clockIn) : "--:--"}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${deviationColor(startDev)}`}
        >
          {deviationLabel(startDev)}
        </span>
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
        {fmtTime(shift.endTime)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
        {actual?.clockOut ? fmtTime(actual.clockOut) : "--:--"}
      </td>
      <td className="px-4 py-3">
        {actual?.clockOut ? (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${deviationColor(endDev)}`}
          >
            {deviationLabel(endDev)}
          </span>
        ) : (
          <span className="text-xs text-slate-300">--</span>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
        {shift.shiftRole || "--"}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// PlanVsActualCard (mobile)
// ---------------------------------------------------------------------------

function PlanVsActualCard({
  shift,
  actual,
  startDev,
  endDev,
}: {
  shift: ShiftNode;
  actual: TimeEntryNode | null;
  startDev: number | null;
  endDev: number | null;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        {shift.user.image ? (
          <Image
            src={shift.user.image}
            alt={shift.user.name || ""}
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
            {(shift.user.name ?? shift.userEmail ?? "?").charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">
            {shift.user.name || shift.userEmail}
          </p>
          <p className="text-xs text-slate-400">
            {fmtDate(shift.startTime)}
            {shift.shiftRole ? ` -- ${shift.shiftRole}` : ""}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-400">Planned Start</p>
          <p className="font-mono text-slate-700">{fmtTime(shift.startTime)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Actual In</p>
          <p className="font-mono text-slate-700">
            {actual ? fmtTime(actual.clockIn) : "--:--"}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Start</p>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${deviationColor(startDev)}`}
          >
            {deviationLabel(startDev)}
          </span>
        </div>
        <div>
          <p className="text-xs text-slate-400">End</p>
          {actual?.clockOut ? (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${deviationColor(endDev)}`}
            >
              {deviationLabel(endDev)}
            </span>
          ) : (
            <span className="text-xs text-slate-300">--</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditTimeEntryModal
// ---------------------------------------------------------------------------

function EditTimeEntryModal({
  entry,
  isOpen,
  onClose,
  isAdmin,
}: {
  entry: TimeEntryNode | null;
  isOpen: boolean;
  onClose: () => void;
  isAdmin: boolean;
}) {
  const [clockInVal, setClockInVal] = useState("");
  const [clockOutVal, setClockOutVal] = useState("");
  const [noteVal, setNoteVal] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Populate form when entry changes
  useEffect(() => {
    if (entry) {
      setClockInVal(toLocalDatetimeValue(entry.clockIn));
      setClockOutVal(toLocalDatetimeValue(entry.clockOut));
      setNoteVal(entry.note ?? "");
      setConfirmDelete(false);
    }
  }, [entry]);

  const [{ fetching: saving }, editTimeEntry] = useMutation(EDIT_TIME_ENTRY);
  const [{ fetching: deleting }, deleteTimeEntry] = useMutation(DELETE_TIME_ENTRY);

  const handleSave = useCallback(async () => {
    if (!entry) return;
    if (!clockInVal) {
      toast.error("Clock-in time is required.");
      return;
    }

    const toastId = toast.loading("Saving time entry...");
    try {
      const vars: Record<string, unknown> = {
        id: entry.id,
        clockIn: new Date(clockInVal).toISOString(),
        note: noteVal || null,
      };
      if (clockOutVal) {
        vars.clockOut = new Date(clockOutVal).toISOString();
      }
      const res = await editTimeEntry(vars);
      if (res.error) {
        toast.error(res.error.message || "Failed to save.", { id: toastId });
        return;
      }
      toast.success("Time entry updated.", { id: toastId, duration: 1500 });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      toast.error(message, { id: toastId });
    }
  }, [entry, clockInVal, clockOutVal, noteVal, editTimeEntry, onClose]);

  const handleDelete = useCallback(async () => {
    if (!entry) return;
    const toastId = toast.loading("Deleting time entry...");
    try {
      const res = await deleteTimeEntry({ id: entry.id });
      if (res.error) {
        toast.error(res.error.message || "Failed to delete.", { id: toastId });
        return;
      }
      toast.success("Time entry deleted.", { id: toastId, duration: 1500 });
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An error occurred.";
      toast.error(message, { id: toastId });
    }
  }, [entry, deleteTimeEntry, onClose]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-300/75" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-2 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-2 sm:scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">
                    Edit Time Entry
                  </Dialog.Title>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-green-100 hover:text-green-600 transition"
                    aria-label="Close"
                  >
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-5 py-4">
                  {entry && (
                    <p className="text-sm text-slate-500">
                      {entry.user.name || entry.userEmail} --{" "}
                      {fmtDate(entry.clockIn)}
                    </p>
                  )}

                  {/* Clock In */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Clock In
                    </label>
                    <input
                      type="datetime-local"
                      value={clockInVal}
                      onChange={(e) => setClockInVal(e.target.value)}
                      className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>

                  {/* Clock Out */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Clock Out
                    </label>
                    <input
                      type="datetime-local"
                      value={clockOutVal}
                      onChange={(e) => setClockOutVal(e.target.value)}
                      className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Note
                    </label>
                    <textarea
                      value={noteVal}
                      onChange={(e) => setNoteVal(e.target.value)}
                      rows={3}
                      placeholder="Reason for adjustment..."
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 resize-none"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* Delete (ADMIN only) */}
                  {isAdmin && (
                    <div>
                      {confirmDelete ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-600">Confirm delete?</span>
                          <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="inline-flex h-9 items-center gap-1 rounded-md bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            {deleting ? "Deleting..." : "Yes, Delete"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-xs text-slate-600 hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(true)}
                          className="inline-flex h-9 items-center gap-1 rounded-md text-xs font-medium text-red-600 hover:bg-red-50 px-3 transition"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 sm:ml-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="inline-flex h-10 items-center justify-center rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// ---------------------------------------------------------------------------
// Tab selector
// ---------------------------------------------------------------------------

function TabSelector({
  activeTab,
  onChange,
}: {
  activeTab: "entries" | "plan";
  onChange: (tab: "entries" | "plan") => void;
}) {
  return (
    <div className="flex border-b border-slate-200">
      <button
        type="button"
        onClick={() => onChange("entries")}
        className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
          activeTab === "entries"
            ? "border-green-600 text-green-700"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Time Entries
      </button>
      <button
        type="button"
        onClick={() => onChange("plan")}
        className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
          activeTab === "plan"
            ? "border-green-600 text-green-700"
            : "border-transparent text-slate-500 hover:text-slate-700"
        }`}
      >
        Plan vs Actual
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main: AttendanceDashboard
// ---------------------------------------------------------------------------

type Props = { user: User };

export default function AttendanceDashboard({ user }: Props) {
  // ---- Authorization ----
  const role = (user as User & { role?: string })?.role;
  const isAdmin = role === "ADMIN";
  const isManager = role === "MANAGER";
  const canAccess = isAdmin || isManager;

  // ---- Date range (default: 1st of current month to today) ----
  const today = useMemo(() => new Date(), []);
  const monthStart = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );

  const [fromStr, setFromStr] = useState(() => toLocalDateValue(monthStart));
  const [toStr, setToStr] = useState(() => toLocalDateValue(today));
  const [selectedEmployeeEmail, setSelectedEmployeeEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [activeTab, setActiveTab] = useState<"entries" | "plan">("entries");

  // ---- Computed date ISO strings ----
  const fromISO = useMemo(() => new Date(`${fromStr}T00:00:00`).toISOString(), [fromStr]);
  const toISO = useMemo(() => {
    const d = new Date(`${toStr}T23:59:59.999`);
    return d.toISOString();
  }, [toStr]);

  // ---- Pagination for time entries ----
  const [teAfter, setTeAfter] = useState<string | null>(null);
  const [teAcc, setTeAcc] = useState<TimeEntryNode[]>([]);
  const [teLoadingMore, setTeLoadingMore] = useState(false);

  // Reset accumulated entries when filters change
  const filtersKey = `${fromStr}_${toStr}_${selectedEmployeeEmail}`;
  const prevFiltersKey = useRef(filtersKey);
  useEffect(() => {
    if (prevFiltersKey.current !== filtersKey) {
      prevFiltersKey.current = filtersKey;
      setTeAfter(null);
      setTeAcc([]);
      setTeLoadingMore(false);
    }
  }, [filtersKey]);

  // ---- Users query ----
  const [{ data: usersData }] = useQuery<GetUsersData>({
    query: GET_USERS,
    requestPolicy: "cache-first",
  });
  const employees = useMemo(() => usersData?.getUsers ?? [], [usersData]);

  // ---- Attendance summary query ----
  const [{ data: summaryData, fetching: summaryFetching, error: summaryError }, refetchSummary] =
    useQuery<AttendanceSummaryData>({
      query: GET_ATTENDANCE_SUMMARY,
      variables: {
        from: fromISO,
        to: toISO,
        userEmail: selectedEmployeeEmail || undefined,
      },
      requestPolicy: "cache-and-network",
      pause: !canAccess,
    });

  // ---- Time entries query ----
  const teVars = useMemo(
    () => ({
      from: fromISO,
      to: toISO,
      userEmail: selectedEmployeeEmail || undefined,
      first: 50,
      after: teAfter,
    }),
    [fromISO, toISO, selectedEmployeeEmail, teAfter]
  );

  const [{ data: teData, fetching: teFetching, error: teError }, refetchEntries] =
    useQuery<GetTimeEntriesData>({
      query: GET_TIME_ENTRIES,
      variables: teVars,
      requestPolicy: "cache-and-network",
      pause: !canAccess,
    });

  // Accumulate time entry pages
  useEffect(() => {
    const nodes =
      teData?.getTimeEntries?.edges?.map((e) => e.node).filter(Boolean) ?? [];
    if (!nodes.length) {
      setTeLoadingMore(false);
      return;
    }
    setTeAcc((prev) => {
      const seen = new Set(prev.map((x) => x.id));
      const next = [...prev];
      for (const n of nodes) {
        if (!seen.has(n.id)) next.push(n);
      }
      return next;
    });
    setTeLoadingMore(false);
  }, [teData?.getTimeEntries?.edges]);

  const tePageInfo = teData?.getTimeEntries?.pageInfo;
  const teHasNextPage = !!tePageInfo?.hasNextPage;
  const teEndCursor = tePageInfo?.endCursor ?? null;

  const loadMoreEntries = useCallback(() => {
    if (!teHasNextPage || !teEndCursor || teLoadingMore) return;
    setTeLoadingMore(true);
    setTeAfter(teEndCursor);
  }, [teHasNextPage, teEndCursor, teLoadingMore]);

  // ---- Shifts query (for Plan vs Actual) ----
  const [{ data: shiftsData, fetching: shiftsFetching, error: shiftsError }, refetchShifts] =
    useQuery<GetShiftsData>({
      query: GET_SHIFTS,
      variables: {
        from: fromISO,
        to: toISO,
        status: "PUBLISHED" as const,
        userEmail: selectedEmployeeEmail || undefined,
        first: 200,
      },
      requestPolicy: "cache-and-network",
      pause: !canAccess || activeTab !== "plan",
    });

  const shiftNodes = useMemo(
    () => shiftsData?.getShifts?.edges?.map((e) => e.node) ?? [],
    [shiftsData]
  );

  // ---- Error toasts (de-duped) ----
  const lastErrRef = useRef<string | null>(null);
  useEffect(() => {
    const err = summaryError || teError || shiftsError;
    if (!err) return;
    const msg = err.message || "Failed to load data.";
    if (lastErrRef.current === msg) return;
    lastErrRef.current = msg;
    toast.error(msg);
  }, [summaryError, teError, shiftsError]);

  // ---- Edit modal ----
  const [editEntry, setEditEntry] = useState<TimeEntryNode | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const openEdit = useCallback((entry: TimeEntryNode) => {
    setEditEntry(entry);
    setEditModalOpen(true);
  }, []);

  const closeEdit = useCallback(() => {
    setEditModalOpen(false);
    // Refetch data after edit/delete
    setTeAfter(null);
    setTeAcc([]);
    refetchEntries({ requestPolicy: "network-only" });
    refetchSummary({ requestPolicy: "network-only" });
    if (activeTab === "plan") {
      refetchShifts({ requestPolicy: "network-only" });
    }
  }, [refetchEntries, refetchSummary, refetchShifts, activeTab]);

  // ---- Refresh all ----
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setTeAfter(null);
    setTeAcc([]);
    refetchEntries({ requestPolicy: "network-only" });
    refetchSummary({ requestPolicy: "network-only" });
    if (activeTab === "plan") {
      refetchShifts({ requestPolicy: "network-only" });
    }
    toast.success("Data refreshed.");
    // Reset spinner after a short delay
    setTimeout(() => setRefreshing(false), 800);
  }, [refetchEntries, refetchSummary, refetchShifts, activeTab]);

  // ---- Access denied ----
  if (!canAccess) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
        <HiOutlineExclamationTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h1 className="text-xl font-semibold text-slate-800 mb-2">Access Denied</h1>
        <p className="text-sm text-slate-500 text-center max-w-sm">
          You do not have permission to view the attendance dashboard. This page is
          restricted to ADMIN and MANAGER roles.
        </p>
      </div>
    );
  }

  // ---- Render ----
  const summary = summaryData?.getAttendanceSummary ?? null;

  return (
    <div className="space-y-6 pb-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Attendance Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Track employee attendance, hours worked, and shift compliance.
        </p>
      </div>

      {/* KPI Cards */}
      <AttendanceKpiCards summary={summary} loading={summaryFetching && !summary} />

      {/* Filters */}
      <AttendanceFilters
        from={fromStr}
        to={toStr}
        selectedEmployeeEmail={selectedEmployeeEmail}
        selectedRole={selectedRole}
        employees={employees}
        onFromChange={setFromStr}
        onToChange={setToStr}
        onEmployeeChange={setSelectedEmployeeEmail}
        onRoleChange={setSelectedRole}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* Tab selector */}
      <TabSelector activeTab={activeTab} onChange={setActiveTab} />

      {/* Content */}
      {activeTab === "entries" ? (
        <AttendanceTable
          entries={teAcc}
          loading={teFetching && teAcc.length === 0}
          hasNextPage={teHasNextPage}
          onLoadMore={loadMoreEntries}
          loadingMore={teLoadingMore}
          canEdit={isAdmin || isManager}
          onEditEntry={openEdit}
        />
      ) : (
        <PlanVsActualView
          shifts={shiftNodes}
          timeEntries={teAcc}
          loading={shiftsFetching && shiftNodes.length === 0}
        />
      )}

      {/* Edit Modal */}
      <EditTimeEntryModal
        entry={editEntry}
        isOpen={editModalOpen}
        onClose={closeEdit}
        isAdmin={isAdmin}
      />
    </div>
  );
}
