import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { TimeEntryStatus } from "./enum";

// Prisma object definition
builder.prismaObject("TimeEntry", {
  fields: (t) => ({
    id: t.exposeID("id"),
    clockIn: t.expose("clockIn", { type: "DateTime" }),
    clockOut: t.expose("clockOut", { type: "DateTime", nullable: true }),
    hoursWorked: t.exposeFloat("hoursWorked", { nullable: true }),
    status: t.expose("status", { type: TimeEntryStatus }),
    note: t.exposeString("note", { nullable: true }),
    userEmail: t.exposeString("userEmail"),
    shiftId: t.exposeString("shiftId", { nullable: true }),
    editedByEmail: t.exposeString("editedByEmail", { nullable: true }),
    user: t.relation("user"),
    shift: t.relation("shift", { nullable: true }),
    editedByUser: t.relation("editedByUser", { nullable: true }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// Attendance summary computed type (follows Dashboard KPI pattern with objectRef)
type AttendanceSummaryShape = {
  totalHours: number;
  shiftCount: number;
  avgHoursPerShift: number;
  overtimeHours: number;
  attendanceRate: number;
  lateCount: number;
  missedCount: number;
};

const AttendanceSummaryRef = builder
  .objectRef<AttendanceSummaryShape>("AttendanceSummary")
  .implement({
    fields: (t) => ({
      totalHours: t.float({ resolve: (p) => p.totalHours }),
      shiftCount: t.int({ resolve: (p) => p.shiftCount }),
      avgHoursPerShift: t.float({ resolve: (p) => p.avgHoursPerShift }),
      overtimeHours: t.float({ resolve: (p) => p.overtimeHours }),
      attendanceRate: t.float({ resolve: (p) => p.attendanceRate }),
      lateCount: t.int({ resolve: (p) => p.lateCount }),
      missedCount: t.int({ resolve: (p) => p.missedCount }),
    }),
  });

// Query fields
builder.queryFields((t) => ({
  getTimeEntry: t.prismaField({
    type: "TimeEntry",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      const entry = await prisma.timeEntry.findUnique({
        ...query,
        where: { id: args.id },
      });
      if (!entry) {
        throw new GraphQLError("Time entry not found");
      }
      const isAdminOrManager = context.user.role === "ADMIN" || context.user.role === "MANAGER";
      if (!isAdminOrManager && entry.userEmail !== context.user.email) {
        throw new GraphQLError("Not authorized");
      }
      return entry;
    },
  }),

  getTimeEntries: t.prismaConnection({
    type: "TimeEntry",
    cursor: "id",
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
      userEmail: t.arg.string({ required: false }),
      status: t.arg({ type: TimeEntryStatus, required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      const isAdminOrManager = context.user.role === "ADMIN" || context.user.role === "MANAGER";
      const emailFilter = isAdminOrManager
        ? (args.userEmail ?? undefined)
        : context.user.email!;

      return prisma.timeEntry.findMany({
        ...query,
        where: {
          clockIn: { gte: new Date(args.from) },
          ...(args.status ? { status: args.status as any } : {}),
          ...(emailFilter ? { userEmail: emailFilter } : {}),
          OR: [
            { clockOut: { lte: new Date(args.to) } },
            { clockOut: null },
          ],
        },
        orderBy: { clockIn: "desc" },
      });
    },
  }),

  getMyTimeEntries: t.prismaConnection({
    type: "TimeEntry",
    cursor: "id",
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user?.email) {
        throw new GraphQLError("You must be logged in");
      }
      return prisma.timeEntry.findMany({
        ...query,
        where: {
          userEmail: context.user.email,
          clockIn: { gte: new Date(args.from) },
          OR: [
            { clockOut: { lte: new Date(args.to) } },
            { clockOut: null },
          ],
        },
        orderBy: { clockIn: "desc" },
      });
    },
  }),

  getActiveClockIn: t.prismaField({
    type: "TimeEntry",
    nullable: true,
    args: {
      userEmail: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      const isAdminOrManager = context.user.role === "ADMIN" || context.user.role === "MANAGER";
      const targetEmail = isAdminOrManager && args.userEmail
        ? args.userEmail
        : context.user.email!;

      return prisma.timeEntry.findFirst({
        ...query,
        where: {
          userEmail: targetEmail,
          status: "ACTIVE",
        },
      });
    },
  }),

  getAttendanceSummary: t.field({
    type: AttendanceSummaryRef,
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
      userEmail: t.arg.string({ required: false }),
    },
    resolve: async (_parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      const isAdminOrManager = context.user.role === "ADMIN" || context.user.role === "MANAGER";
      const emailFilter = isAdminOrManager
        ? (args.userEmail ?? undefined)
        : context.user.email!;

      const from = new Date(args.from);
      const to = new Date(args.to);

      // Get completed time entries
      const timeEntries = await prisma.timeEntry.findMany({
        where: {
          clockIn: { gte: from },
          status: { in: ["COMPLETED", "AUTO_CLOSED", "EDITED"] },
          ...(emailFilter ? { userEmail: emailFilter } : {}),
          OR: [
            { clockOut: { lte: to } },
            { clockOut: null },
          ],
        },
        select: { hoursWorked: true, clockIn: true, shiftId: true },
      });

      const totalHours = timeEntries.reduce((sum, e) => sum + (e.hoursWorked ?? 0), 0);
      const shiftCount = timeEntries.length;
      const avgHoursPerShift = shiftCount > 0 ? totalHours / shiftCount : 0;

      // Overtime: hours over 8 per entry
      const overtimeHours = timeEntries.reduce((sum, e) => {
        const hours = e.hoursWorked ?? 0;
        return sum + Math.max(0, hours - 8);
      }, 0);

      // Get published shifts in the range
      const publishedShifts = await prisma.shift.findMany({
        where: {
          status: "PUBLISHED",
          startTime: { gte: from },
          endTime: { lte: to },
          ...(emailFilter ? { userEmail: emailFilter } : {}),
        },
        select: { id: true, startTime: true },
      });

      const totalPublished = publishedShifts.length;

      // Count shifts that have a matching time entry
      const coveredShiftIds = new Set(
        timeEntries.filter((e) => e.shiftId).map((e) => e.shiftId)
      );
      const coveredCount = publishedShifts.filter((s) => coveredShiftIds.has(s.id)).length;

      const attendanceRate = totalPublished > 0 ? (coveredCount / totalPublished) * 100 : 100;
      const missedCount = totalPublished - coveredCount;

      // Late clock-ins: clockIn > shift.startTime + 10 minutes
      let lateCount = 0;
      for (const entry of timeEntries) {
        if (!entry.shiftId) continue;
        const shift = publishedShifts.find((s) => s.id === entry.shiftId);
        if (!shift) continue;
        const diff = entry.clockIn.getTime() - shift.startTime.getTime();
        if (diff > 10 * 60 * 1000) {
          lateCount++;
        }
      }

      return {
        totalHours: Math.round(totalHours * 100) / 100,
        shiftCount,
        avgHoursPerShift: Math.round(avgHoursPerShift * 100) / 100,
        overtimeHours: Math.round(overtimeHours * 100) / 100,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        lateCount,
        missedCount,
      };
    },
  }),
}));
