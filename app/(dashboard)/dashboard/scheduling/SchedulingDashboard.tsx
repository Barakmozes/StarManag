"use client";

import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { gql, useMutation, useQuery } from "@urql/next";
import Image from "next/image";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import {
  HiOutlineCalendarDays,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlinePlus,
  HiOutlinePencil,
} from "react-icons/hi2";
import { HiOutlineXMark } from "react-icons/hi2";
import { User } from "@prisma/client";

import { useEmployeeStore } from "@/lib/employeeStore";

/* ========================================================================= */
/* GraphQL Documents (inline because codegen has not yet run for shift files) */
/* ========================================================================= */

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

const GET_USERS = gql`
  query GetUsers {
    getUsers {
      id
      name
      email
      image
      role
      createdAt
    }
  }
`;

const GET_AREAS = gql`
  query GetAreasNameDescription {
    getAreasNameDescription {
      id
      name
    }
  }
`;

const GET_SHIFT_TEMPLATES = gql`
  query GetShiftTemplates($active: Boolean) {
    getShiftTemplates(active: $active) {
      id
      name
      description
      dayOfWeek
      startTime
      endTime
      crossesMidnight
      defaultRole
      active
      areaId
      area {
        name
      }
      createdAt
      updatedAt
    }
  }
`;

const CREATE_SHIFT = gql`
  mutation CreateShift(
    $userEmail: String!
    $startTime: DateTime!
    $endTime: DateTime!
    $shiftRole: Role
    $areaId: String
    $note: String
  ) {
    createShift(
      userEmail: $userEmail
      startTime: $startTime
      endTime: $endTime
      shiftRole: $shiftRole
      areaId: $areaId
      note: $note
    ) {
      id
      startTime
      endTime
      status
      shiftRole
      userEmail
      areaId
      note
      createdAt
    }
  }
`;

const EDIT_SHIFT = gql`
  mutation EditShift(
    $id: String!
    $startTime: DateTime
    $endTime: DateTime
    $status: ShiftStatus
    $note: String
    $shiftRole: Role
    $areaId: String
  ) {
    editShift(
      id: $id
      startTime: $startTime
      endTime: $endTime
      status: $status
      note: $note
      shiftRole: $shiftRole
      areaId: $areaId
    ) {
      id
      startTime
      endTime
      status
      shiftRole
      note
      areaId
      updatedAt
    }
  }
`;

const CANCEL_SHIFT = gql`
  mutation CancelShift($id: String!) {
    cancelShift(id: $id) {
      id
      status
      updatedAt
    }
  }
`;

const PUBLISH_SHIFTS = gql`
  mutation PublishShifts($ids: [String!]!) {
    publishShifts(ids: $ids)
  }
`;

const CREATE_SHIFT_TEMPLATE = gql`
  mutation CreateShiftTemplate(
    $name: String!
    $dayOfWeek: Int!
    $startTime: String!
    $endTime: String!
    $defaultRole: Role
    $areaId: String
    $description: String
  ) {
    createShiftTemplate(
      name: $name
      dayOfWeek: $dayOfWeek
      startTime: $startTime
      endTime: $endTime
      defaultRole: $defaultRole
      areaId: $areaId
      description: $description
    ) {
      id
      name
      dayOfWeek
      startTime
      endTime
      crossesMidnight
      defaultRole
      active
      areaId
      createdAt
    }
  }
`;

const DELETE_SHIFT_TEMPLATE = gql`
  mutation DeleteShiftTemplate($id: String!) {
    deleteShiftTemplate(id: $id) {
      id
    }
  }
`;

const TOGGLE_SHIFT_TEMPLATE_ACTIVE = gql`
  mutation ToggleShiftTemplateActive($id: String!) {
    toggleShiftTemplateActive(id: $id) {
      id
      active
      updatedAt
    }
  }
`;

const GENERATE_SHIFTS_FROM_TEMPLATE = gql`
  mutation GenerateShiftsFromTemplate(
    $templateId: String!
    $weekStart: DateTime!
    $userEmails: [String!]!
  ) {
    generateShiftsFromTemplate(
      templateId: $templateId
      weekStart: $weekStart
      userEmails: $userEmails
    )
  }
`;

/* ========================================================================= */
/* Types                                                                     */
/* ========================================================================= */

type ShiftNode = {
  id: string;
  startTime: string;
  endTime: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  note: string | null;
  shiftRole: string | null;
  userEmail: string;
  areaId: string | null;
  templateId?: string | null;
  user: { name: string | null; email: string | null; image: string | null };
  area: { name: string } | null;
  createdAt?: string;
};

type EmployeeNode = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  createdAt: string;
};

type AreaNode = {
  id: string;
  name: string;
};

type TemplateNode = {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
  defaultRole: string | null;
  active: boolean;
  areaId: string | null;
  area: { name: string } | null;
  createdAt: string;
  updatedAt: string;
};

/* ========================================================================= */
/* Helpers                                                                   */
/* ========================================================================= */

const STAFF_ROLES = ["ADMIN", "MANAGER", "WAITER", "DELIVERY"];
const ROLE_OPTIONS = STAFF_ROLES;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_NAMES_FULL = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TZ = "Asia/Jerusalem";

function toLocaleDateStr(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
  });
}

function toLocaleDateFull(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: TZ,
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleTimeString("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(d1: Date, d2: Date): boolean {
  const a = new Date(d1.toLocaleString("en-US", { timeZone: TZ }));
  const b = new Date(d2.toLocaleString("en-US", { timeZone: TZ }));
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function weekEndDate(weekStart: Date): Date {
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return end;
}

function toISODateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Build ISO datetime from a date string and time "HH:mm" */
function buildDateTime(dateStr: string, timeStr: string): string {
  return new Date(`${dateStr}T${timeStr}:00`).toISOString();
}

function roleColor(role: string | null): string {
  switch (role) {
    case "ADMIN":
      return "text-purple-700";
    case "MANAGER":
      return "text-blue-700";
    case "WAITER":
      return "text-emerald-700";
    case "DELIVERY":
      return "text-orange-700";
    default:
      return "text-gray-600";
  }
}

function shiftCellClasses(status: string): string {
  switch (status) {
    case "DRAFT":
      return "bg-gray-100 border-gray-300 hover:bg-gray-150";
    case "PUBLISHED":
      return "bg-emerald-50 border-emerald-300 hover:bg-emerald-100";
    case "CANCELLED":
      return "bg-red-50 border-red-300 opacity-60";
    default:
      return "bg-gray-50 border-gray-200";
  }
}

/* ========================================================================= */
/* Main Component                                                            */
/* ========================================================================= */

type SchedulingDashboardProps = {
  user: User;
};

export default function SchedulingDashboard({
  user,
}: SchedulingDashboardProps) {
  /* ---- Store ---- */
  const {
    currentWeekStart,
    navigateWeek,
    selectedAreaId,
    setSelectedAreaId,
    editingShiftId,
    setEditingShiftId,
  } = useEmployeeStore();

  // Hydrate persisted zustand store on mount
  useEffect(() => {
    useEmployeeStore.persist.rehydrate();
  }, []);

  /* ---- Local state ---- */
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftFormDefaults, setShiftFormDefaults] = useState<{
    employeeEmail?: string;
    date?: string;
  }>({});
  const [templatePanelOpen, setTemplatePanelOpen] = useState(false);

  const isAuthorized = user.role === "ADMIN" || user.role === "MANAGER";

  /* ---- Week dates ---- */
  const weekStart = useMemo(
    () => new Date(currentWeekStart),
    [currentWeekStart]
  );
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);
  const weekEnd = useMemo(() => {
    const e = new Date(weekStart);
    e.setDate(e.getDate() + 7);
    return e;
  }, [weekStart]);

  const weekLabel = `${toLocaleDateStr(weekStart)} - ${toLocaleDateFull(weekEndDate(weekStart))}`;

  /* ---- Queries ---- */
  const [{ data: scheduleData, fetching: scheduleFetching }, reexecuteSchedule] =
    useQuery({
      query: GET_SHIFTS,
      variables: {
        from: weekStart.toISOString(),
        to: weekEnd.toISOString(),
        areaId: selectedAreaId || undefined,
        first: 500,
      },
    });

  const [{ data: usersData }] = useQuery({ query: GET_USERS });
  const [{ data: areasData }] = useQuery({ query: GET_AREAS });

  /* ---- Derived data ---- */
  const allShifts: ShiftNode[] = useMemo(() => {
    const edges = scheduleData?.getShifts?.edges;
    if (!edges) return [];
    return edges.map((e: { node: ShiftNode }) => e.node);
  }, [scheduleData]);

  const employees: EmployeeNode[] = useMemo(() => {
    if (!usersData?.getUsers) return [];
    return (usersData.getUsers as EmployeeNode[]).filter((u) =>
      STAFF_ROLES.includes(u.role)
    );
  }, [usersData]);

  const areas: AreaNode[] = useMemo(() => {
    return (areasData?.getAreasNameDescription as AreaNode[]) ?? [];
  }, [areasData]);

  const draftShiftIds = useMemo(
    () => allShifts.filter((s) => s.status === "DRAFT").map((s) => s.id),
    [allShifts]
  );

  /* ---- Shift map: employeeEmail -> dayIndex -> ShiftNode[] ---- */
  const shiftMap = useMemo(() => {
    const map = new Map<string, Map<number, ShiftNode[]>>();
    for (const shift of allShifts) {
      const shiftDate = new Date(shift.startTime);
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        if (isSameDay(shiftDate, weekDays[dayIdx])) {
          if (!map.has(shift.userEmail)) map.set(shift.userEmail, new Map());
          const dayMap = map.get(shift.userEmail)!;
          if (!dayMap.has(dayIdx)) dayMap.set(dayIdx, []);
          dayMap.get(dayIdx)!.push(shift);
        }
      }
    }
    return map;
  }, [allShifts, weekDays]);

  /* ---- Handlers ---- */
  const openCreateShift = useCallback(
    (employeeEmail: string, date: string) => {
      setEditingShiftId(null);
      setShiftFormDefaults({ employeeEmail, date });
      setShiftModalOpen(true);
    },
    [setEditingShiftId]
  );

  const openEditShift = useCallback(
    (shiftId: string) => {
      setEditingShiftId(shiftId);
      setShiftFormDefaults({});
      setShiftModalOpen(true);
    },
    [setEditingShiftId]
  );

  const closeShiftModal = useCallback(() => {
    setShiftModalOpen(false);
    setEditingShiftId(null);
    setShiftFormDefaults({});
  }, [setEditingShiftId]);

  const handleShiftSaved = useCallback(() => {
    closeShiftModal();
    reexecuteSchedule({ requestPolicy: "network-only" });
  }, [closeShiftModal, reexecuteSchedule]);

  /* ---- Auth guard (after all hooks) ---- */
  if (!isAuthorized) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-lg font-medium text-red-600">
          Access denied. Only ADMIN or MANAGER roles can view the scheduling
          dashboard.
        </p>
      </div>
    );
  }

  /* ---- Render ---- */
  return (
    <div className="mx-auto w-full max-w-[1600px] px-2 py-4 sm:px-4 sm:py-6">
      {/* TOOLBAR */}
      <ScheduleToolbar
        weekLabel={weekLabel}
        onPrevWeek={() => navigateWeek(-1)}
        onNextWeek={() => navigateWeek(1)}
        areas={areas}
        selectedAreaId={selectedAreaId}
        onAreaChange={setSelectedAreaId}
        templatePanelOpen={templatePanelOpen}
        onToggleTemplatePanel={() => setTemplatePanelOpen((p) => !p)}
      />

      {/* TEMPLATE MANAGER (collapsible) */}
      {templatePanelOpen && (
        <TemplateManager
          areas={areas}
          employees={employees}
          weekStart={weekStart}
          onGenerated={() =>
            reexecuteSchedule({ requestPolicy: "network-only" })
          }
        />
      )}

      {/* WEEKLY GRID */}
      <WeeklyScheduleGrid
        weekDays={weekDays}
        employees={employees}
        shiftMap={shiftMap}
        fetching={scheduleFetching}
        onClickEmpty={openCreateShift}
        onClickShift={openEditShift}
      />

      {/* PUBLISH BAR */}
      {draftShiftIds.length > 0 && (
        <PublishBar
          draftCount={draftShiftIds.length}
          draftIds={draftShiftIds}
          onPublished={() =>
            reexecuteSchedule({ requestPolicy: "network-only" })
          }
        />
      )}

      {/* SHIFT FORM MODAL */}
      <ShiftFormModal
        isOpen={shiftModalOpen}
        onClose={closeShiftModal}
        editingShiftId={editingShiftId}
        employees={employees}
        areas={areas}
        defaults={shiftFormDefaults}
        existingShift={
          editingShiftId
            ? allShifts.find((s) => s.id === editingShiftId) ?? null
            : null
        }
        onSaved={handleShiftSaved}
      />
    </div>
  );
}

/* ========================================================================= */
/* ScheduleToolbar                                                           */
/* ========================================================================= */

type ScheduleToolbarProps = {
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  areas: AreaNode[];
  selectedAreaId: string | null;
  onAreaChange: (id: string | null) => void;
  templatePanelOpen: boolean;
  onToggleTemplatePanel: () => void;
};

function ScheduleToolbar({
  weekLabel,
  onPrevWeek,
  onNextWeek,
  areas,
  selectedAreaId,
  onAreaChange,
  templatePanelOpen,
  onToggleTemplatePanel,
}: ScheduleToolbarProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-lg bg-white p-3 shadow sm:flex-row sm:items-center sm:justify-between sm:p-4">
      {/* Left section: title + view badge */}
      <div className="flex items-center gap-2">
        <HiOutlineCalendarDays className="h-6 w-6 text-emerald-600" />
        <h1 className="text-lg font-semibold text-slate-800 sm:text-xl">
          Schedule
        </h1>
        <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
          Week
        </span>
      </div>

      {/* Center: week navigation */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={onPrevWeek}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Previous week"
        >
          <HiOutlineChevronLeft className="h-5 w-5" />
        </button>
        <span className="min-w-[200px] text-center text-sm font-medium text-slate-700 sm:text-base">
          {weekLabel}
        </span>
        <button
          onClick={onNextWeek}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Next week"
        >
          <HiOutlineChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Right: area filter + templates toggle */}
      <div className="flex items-center justify-center gap-2 sm:justify-end">
        <select
          value={selectedAreaId ?? ""}
          onChange={(e) => onAreaChange(e.target.value || null)}
          className="rounded-md border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
        >
          <option value="">All Areas</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <button
          onClick={onToggleTemplatePanel}
          className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
            templatePanelOpen
              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
              : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          Templates
        </button>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* WeeklyScheduleGrid                                                        */
/* ========================================================================= */

type WeeklyScheduleGridProps = {
  weekDays: Date[];
  employees: EmployeeNode[];
  shiftMap: Map<string, Map<number, ShiftNode[]>>;
  fetching: boolean;
  onClickEmpty: (employeeEmail: string, date: string) => void;
  onClickShift: (shiftId: string) => void;
};

function WeeklyScheduleGrid({
  weekDays,
  employees,
  shiftMap,
  fetching,
  onClickEmpty,
  onClickShift,
}: WeeklyScheduleGridProps) {
  if (fetching && employees.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-slate-500">No staff members found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg bg-white shadow">
      <div
        className="grid min-w-[900px]"
        style={{ gridTemplateColumns: "180px repeat(7, 1fr)" }}
      >
        {/* Header row */}
        <div className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 px-3 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Employee
          </span>
        </div>
        {weekDays.map((day, idx) => {
          const isToday = isSameDay(day, new Date());
          return (
            <div
              key={idx}
              className={`border-b border-slate-200 px-2 py-2.5 text-center ${
                isToday ? "bg-emerald-50" : "bg-slate-50"
              }`}
            >
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {DAY_NAMES[idx]}
              </div>
              <div
                className={`text-sm font-medium ${
                  isToday ? "text-emerald-700" : "text-slate-700"
                }`}
              >
                {toLocaleDateStr(day)}
              </div>
            </div>
          );
        })}

        {/* Employee rows */}
        {employees.map((employee) => (
          <Fragment key={employee.id}>
            {/* Employee name cell */}
            <div className="sticky left-0 z-10 flex items-center gap-2 border-b border-r border-slate-200 bg-white px-3 py-2">
              {employee.image ? (
                <Image
                  src={employee.image}
                  alt=""
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600">
                  {(employee.name ?? "?")[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-slate-800">
                  {employee.name ?? "Unnamed"}
                </div>
                <div className={`text-xs ${roleColor(employee.role)}`}>
                  {employee.role}
                </div>
              </div>
            </div>

            {/* Day cells */}
            {weekDays.map((day, dayIdx) => {
              const shifts =
                shiftMap.get(employee.email ?? "")?.get(dayIdx) ?? [];
              const dateStr = toISODateStr(day);

              return (
                <div
                  key={dayIdx}
                  className="relative min-h-[72px] border-b border-slate-200 p-1"
                >
                  {shifts.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {shifts.map((shift) => (
                        <ShiftCell
                          key={shift.id}
                          shift={shift}
                          onClick={() => onClickShift(shift.id)}
                        />
                      ))}
                    </div>
                  ) : null}

                  {/* Empty cell click target */}
                  <button
                    onClick={() =>
                      onClickEmpty(employee.email ?? "", dateStr)
                    }
                    className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity hover:opacity-100"
                    aria-label={`Add shift for ${employee.name} on ${DAY_NAMES[dayIdx]}`}
                  >
                    <span className="rounded-full bg-emerald-100 p-1.5 text-emerald-600">
                      <HiOutlinePlus className="h-4 w-4" />
                    </span>
                  </button>
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {fetching && (
        <div className="flex items-center justify-center py-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
          <span className="ml-2 text-xs text-slate-500">Refreshing...</span>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* ShiftCell                                                                 */
/* ========================================================================= */

type ShiftCellProps = {
  shift: ShiftNode;
  onClick: () => void;
};

function ShiftCell({ shift, onClick }: ShiftCellProps) {
  const timeRange = `${formatTime(shift.startTime)}-${formatTime(shift.endTime)}`;

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`group relative w-full rounded border px-1.5 py-1 text-left transition-all ${shiftCellClasses(shift.status)}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">{timeRange}</span>
        <HiOutlinePencil className="h-3 w-3 text-slate-400 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {shift.shiftRole && (
        <span className={`text-[10px] font-medium ${roleColor(shift.shiftRole)}`}>
          {shift.shiftRole}
        </span>
      )}
      {shift.status === "DRAFT" && (
        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full border border-white bg-amber-400" />
      )}
    </button>
  );
}

/* ========================================================================= */
/* ShiftFormModal                                                            */
/* ========================================================================= */

type ShiftFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  editingShiftId: string | null;
  employees: EmployeeNode[];
  areas: AreaNode[];
  defaults: { employeeEmail?: string; date?: string };
  existingShift: ShiftNode | null;
  onSaved: () => void;
};

function ShiftFormModal({
  isOpen,
  onClose,
  editingShiftId,
  employees,
  areas,
  defaults,
  existingShift,
  onSaved,
}: ShiftFormModalProps) {
  const isEdit = !!editingShiftId;

  /* ---- Form state ---- */
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [shiftRole, setShiftRole] = useState("");
  const [areaId, setAreaId] = useState("");
  const [note, setNote] = useState("");

  /* ---- Mutations ---- */
  const [{ fetching: creating }, createShift] = useMutation(CREATE_SHIFT);
  const [{ fetching: editing }, editShift] = useMutation(EDIT_SHIFT);
  const [{ fetching: cancelling }, cancelShift] = useMutation(CANCEL_SHIFT);

  /* ---- Populate form when modal opens ---- */
  useEffect(() => {
    if (!isOpen) return;

    if (isEdit && existingShift) {
      const sDate = new Date(existingShift.startTime);
      setEmployeeEmail(existingShift.userEmail);
      setDate(toISODateStr(sDate));
      setStartTime(formatTime(existingShift.startTime));
      setEndTime(formatTime(existingShift.endTime));
      setShiftRole(existingShift.shiftRole ?? "");
      setAreaId(existingShift.areaId ?? "");
      setNote(existingShift.note ?? "");
    } else {
      setEmployeeEmail(defaults.employeeEmail ?? "");
      setDate(defaults.date ?? toISODateStr(new Date()));
      setStartTime("09:00");
      setEndTime("17:00");
      setShiftRole("");
      setAreaId("");
      setNote("");
    }
  }, [isOpen, isEdit, existingShift, defaults]);

  /* ---- Submit ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeEmail || !date || !startTime || !endTime) {
      toast.error("Please fill in all required fields");
      return;
    }

    const startISO = buildDateTime(date, startTime);
    const endISO = buildDateTime(date, endTime);

    if (new Date(endISO) <= new Date(startISO)) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      if (isEdit && editingShiftId) {
        const { error } = await editShift({
          id: editingShiftId,
          startTime: startISO,
          endTime: endISO,
          shiftRole: shiftRole || undefined,
          areaId: areaId || undefined,
          note: note || undefined,
        });
        if (error) throw error;
        toast.success("Shift updated");
      } else {
        const { error } = await createShift({
          userEmail: employeeEmail,
          startTime: startISO,
          endTime: endISO,
          shiftRole: shiftRole || undefined,
          areaId: areaId || undefined,
          note: note || undefined,
        });
        if (error) throw error;
        toast.success("Shift created");
      }
      onSaved();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
    }
  };

  const handleCancel = async () => {
    if (!editingShiftId) return;
    try {
      const { error } = await cancelShift({ id: editingShiftId });
      if (error) throw error;
      toast.success("Shift cancelled");
      onSaved();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to cancel shift";
      toast.error(message);
    }
  };

  const busy = creating || editing || cancelling;

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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                  <Dialog.Title className="text-lg font-semibold text-slate-800">
                    {isEdit ? "Edit Shift" : "New Shift"}
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Close"
                  >
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
                  {/* Employee */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Employee *
                    </label>
                    <select
                      value={employeeEmail}
                      onChange={(e) => setEmployeeEmail(e.target.value)}
                      disabled={isEdit}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:bg-slate-50 disabled:text-slate-500"
                    >
                      <option value="">Select employee...</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.email ?? ""}>
                          {emp.name ?? emp.email} ({emp.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  {/* Time range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        Start Time *
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">
                        End Time *
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  {/* Role */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Role
                    </label>
                    <select
                      value={shiftRole}
                      onChange={(e) => setShiftRole(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    >
                      <option value="">No specific role</option>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Area */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Area
                    </label>
                    <select
                      value={areaId}
                      onChange={(e) => setAreaId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    >
                      <option value="">No area</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Note */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Note
                    </label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      placeholder="Optional note..."
                    />
                  </div>

                  {/* Status badge (edit mode) */}
                  {isEdit && existingShift && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Status:</span>
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          existingShift.status === "DRAFT"
                            ? "bg-amber-100 text-amber-800"
                            : existingShift.status === "PUBLISHED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {existingShift.status}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    {isEdit && existingShift?.status !== "CANCELLED" ? (
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={busy}
                        className="rounded-lg border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Cancel Shift
                      </button>
                    ) : (
                      <div />
                    )}

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={busy}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {busy
                          ? "Saving..."
                          : isEdit
                            ? "Update Shift"
                            : "Create Shift"}
                      </button>
                    </div>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

/* ========================================================================= */
/* PublishBar                                                                 */
/* ========================================================================= */

type PublishBarProps = {
  draftCount: number;
  draftIds: string[];
  onPublished: () => void;
};

function PublishBar({ draftCount, draftIds, onPublished }: PublishBarProps) {
  const [{ fetching: publishing }, publishShifts] =
    useMutation(PUBLISH_SHIFTS);

  const handlePublish = async () => {
    try {
      const { error } = await publishShifts({ ids: draftIds });
      if (error) throw error;
      toast.success(`Published ${draftCount} shift${draftCount > 1 ? "s" : ""}`);
      onPublished();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to publish shifts";
      toast.error(message);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-200 bg-amber-50 px-4 py-3 shadow-lg sm:px-6">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white">
            {draftCount}
          </span>
          <span className="text-sm font-medium text-amber-800">
            draft shift{draftCount > 1 ? "s" : ""} ready to publish
          </span>
        </div>
        <button
          onClick={handlePublish}
          disabled={publishing}
          className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
        >
          {publishing ? "Publishing..." : "Publish All"}
        </button>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* TemplateManager                                                           */
/* ========================================================================= */

type TemplateManagerProps = {
  areas: AreaNode[];
  employees: EmployeeNode[];
  weekStart: Date;
  onGenerated: () => void;
};

function TemplateManager({
  areas,
  employees,
  weekStart,
  onGenerated,
}: TemplateManagerProps) {
  /* ---- Queries ---- */
  const [{ data: templatesData, fetching: templatesFetching }, refetchTemplates] =
    useQuery({ query: GET_SHIFT_TEMPLATES, variables: {} });

  const templates: TemplateNode[] = useMemo(
    () => (templatesData?.getShiftTemplates as TemplateNode[]) ?? [],
    [templatesData]
  );

  /* ---- Mutations ---- */
  const [{ fetching: creatingTemplate }, createTemplate] =
    useMutation(CREATE_SHIFT_TEMPLATE);
  const [, deleteTemplate] = useMutation(DELETE_SHIFT_TEMPLATE);
  const [, toggleTemplateActive] = useMutation(TOGGLE_SHIFT_TEMPLATE_ACTIVE);
  const [{ fetching: generating }, generateShifts] = useMutation(
    GENERATE_SHIFTS_FROM_TEMPLATE
  );

  /* ---- Create template form state ---- */
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [tName, setTName] = useState("");
  const [tDayOfWeek, setTDayOfWeek] = useState(0);
  const [tStartTime, setTStartTime] = useState("09:00");
  const [tEndTime, setTEndTime] = useState("17:00");
  const [tRole, setTRole] = useState("");
  const [tAreaId, setTAreaId] = useState("");
  const [tDescription, setTDescription] = useState("");

  /* ---- Generate form state ---- */
  const [generateTemplateId, setGenerateTemplateId] = useState<string | null>(
    null
  );
  const [generateEmails, setGenerateEmails] = useState<string[]>([]);

  const resetCreateForm = () => {
    setTName("");
    setTDayOfWeek(0);
    setTStartTime("09:00");
    setTEndTime("17:00");
    setTRole("");
    setTAreaId("");
    setTDescription("");
    setShowCreateForm(false);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName || !tStartTime || !tEndTime) {
      toast.error("Name, start time, and end time are required");
      return;
    }
    try {
      const { error } = await createTemplate({
        name: tName,
        dayOfWeek: tDayOfWeek,
        startTime: tStartTime,
        endTime: tEndTime,
        defaultRole: tRole || undefined,
        areaId: tAreaId || undefined,
        description: tDescription || undefined,
      });
      if (error) throw error;
      toast.success("Template created");
      resetCreateForm();
      refetchTemplates({ requestPolicy: "network-only" });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create template"
      );
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      const { error } = await deleteTemplate({ id });
      if (error) throw error;
      toast.success("Template deleted");
      refetchTemplates({ requestPolicy: "network-only" });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete template"
      );
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      const { error } = await toggleTemplateActive({ id });
      if (error) throw error;
      refetchTemplates({ requestPolicy: "network-only" });
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to toggle template"
      );
    }
  };

  const handleGenerate = async () => {
    if (!generateTemplateId || generateEmails.length === 0) {
      toast.error("Select a template and at least one employee");
      return;
    }
    try {
      const { error } = await generateShifts({
        templateId: generateTemplateId,
        weekStart: weekStart.toISOString(),
        userEmails: generateEmails,
      });
      if (error) throw error;
      toast.success("Shifts generated from template");
      setGenerateTemplateId(null);
      setGenerateEmails([]);
      onGenerated();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to generate shifts"
      );
    }
  };

  const toggleEmail = (email: string) => {
    setGenerateEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  return (
    <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-700">
          Shift Templates
        </h3>
        <button
          onClick={() => setShowCreateForm((p) => !p)}
          className="flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
        >
          <HiOutlinePlus className="h-3.5 w-3.5" />
          New Template
        </button>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateTemplate}
          className="mb-4 rounded-lg border border-slate-200 bg-slate-50 p-3"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Name *
              </label>
              <input
                type="text"
                value={tName}
                onChange={(e) => setTName(e.target.value)}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder="Morning shift"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Day of Week *
              </label>
              <select
                value={tDayOfWeek}
                onChange={(e) => setTDayOfWeek(Number(e.target.value))}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                {DAY_NAMES_FULL.map((name, idx) => (
                  <option key={idx} value={idx}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Start *
                </label>
                <input
                  type="time"
                  value={tStartTime}
                  onChange={(e) => setTStartTime(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  End *
                </label>
                <input
                  type="time"
                  value={tEndTime}
                  onChange={(e) => setTEndTime(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Default Role
              </label>
              <select
                value={tRole}
                onChange={(e) => setTRole(e.target.value)}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">None</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Area
              </label>
              <select
                value={tAreaId}
                onChange={(e) => setTAreaId(e.target.value)}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              >
                <option value="">None</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Description
              </label>
              <input
                type="text"
                value={tDescription}
                onChange={(e) => setTDescription(e.target.value)}
                className="w-full rounded border border-slate-300 px-2.5 py-1.5 text-sm focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetCreateForm}
              className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingTemplate}
              className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {creatingTemplate ? "Creating..." : "Create Template"}
            </button>
          </div>
        </form>
      )}

      {/* Existing templates list */}
      {templatesFetching ? (
        <div className="flex items-center justify-center py-4">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
        </div>
      ) : templates.length === 0 ? (
        <p className="py-3 text-center text-sm text-slate-500">
          No templates yet. Create one to auto-generate shifts.
        </p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <div
              key={t.id}
              className={`flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between ${
                t.active
                  ? "border-emerald-200 bg-emerald-50/50"
                  : "border-slate-200 bg-slate-50 opacity-60"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">
                    {t.name}
                  </span>
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                    {DAY_NAMES_FULL[t.dayOfWeek] ?? `Day ${t.dayOfWeek}`}
                  </span>
                  <span className="text-xs text-slate-500">
                    {t.startTime}-{t.endTime}
                  </span>
                  {t.defaultRole && (
                    <span
                      className={`text-xs font-medium ${roleColor(t.defaultRole)}`}
                    >
                      {t.defaultRole}
                    </span>
                  )}
                  {t.area && (
                    <span className="text-xs text-slate-400">
                      {t.area.name}
                    </span>
                  )}
                </div>
                {t.description && (
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t.description}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  onClick={() => handleToggleActive(t.id)}
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    t.active
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {t.active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => {
                    setGenerateTemplateId(
                      generateTemplateId === t.id ? null : t.id
                    );
                    setGenerateEmails([]);
                  }}
                  disabled={!t.active}
                  className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Generate
                </button>
                <button
                  onClick={() => handleDeleteTemplate(t.id)}
                  className="rounded bg-red-100 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                >
                  Delete
                </button>
              </div>

              {/* Generate expansion */}
              {generateTemplateId === t.id && (
                <div className="w-full rounded border border-blue-200 bg-blue-50 p-3 sm:mt-0">
                  <p className="mb-2 text-xs font-medium text-blue-800">
                    Select employees to generate shifts for this week:
                  </p>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {employees.map((emp) => {
                      const email = emp.email ?? "";
                      const selected = generateEmails.includes(email);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => toggleEmail(email)}
                          className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                            selected
                              ? "bg-blue-600 text-white"
                              : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          {emp.name ?? email}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setGenerateTemplateId(null);
                        setGenerateEmails([]);
                      }}
                      className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={generating || generateEmails.length === 0}
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {generating
                        ? "Generating..."
                        : `Generate for ${generateEmails.length} employee${generateEmails.length !== 1 ? "s" : ""}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
