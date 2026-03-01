import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";

const STAFF_ROLES = ["ADMIN", "MANAGER", "WAITER", "DELIVERY", "CHEF", "BARTENDER"];
const AUTO_CLOSE_HOURS = 14;

builder.mutationFields((t) => ({
  clockIn: t.prismaField({
    type: "TimeEntry",
    args: {
      note: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user?.email) {
        throw new GraphQLError("You must be logged in");
      }
      if (!STAFF_ROLES.includes(context.user.role ?? "")) {
        throw new GraphQLError("Only staff members can clock in");
      }

      const userEmail = context.user.email;

      // Use transaction to prevent race conditions
      return prisma.$transaction(async (tx) => {
        // Check for existing active entry
        const existing = await tx.timeEntry.findFirst({
          where: { userEmail, status: "ACTIVE" },
        });

        if (existing) {
          // Auto-close if older than 14 hours
          const hoursElapsed = (Date.now() - existing.clockIn.getTime()) / (1000 * 60 * 60);
          if (hoursElapsed > AUTO_CLOSE_HOURS) {
            const clockOut = new Date(existing.clockIn.getTime() + AUTO_CLOSE_HOURS * 60 * 60 * 1000);
            await tx.timeEntry.update({
              where: { id: existing.id },
              data: {
                clockOut,
                hoursWorked: AUTO_CLOSE_HOURS,
                status: "AUTO_CLOSED",
                note: (existing.note ? existing.note + " | " : "") + "Auto-closed after 14h",
              },
            });
          } else {
            throw new GraphQLError("You are already clocked in. Please clock out first.");
          }
        }

        // Find matching shift for today
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const matchingShift = await tx.shift.findFirst({
          where: {
            userEmail,
            status: "PUBLISHED",
            startTime: { gte: todayStart },
            endTime: { lte: todayEnd },
          },
          orderBy: { startTime: "asc" },
        });

        return tx.timeEntry.create({
          ...query,
          data: {
            userEmail,
            clockIn: now,
            status: "ACTIVE",
            note: args.note ?? undefined,
            shiftId: matchingShift?.id ?? undefined,
          },
        });
      });
    },
  }),

  clockOut: t.prismaField({
    type: "TimeEntry",
    args: {
      timeEntryId: t.arg.string({ required: false }),
      note: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user?.email) {
        throw new GraphQLError("You must be logged in");
      }

      // Find active entry
      const entry = args.timeEntryId
        ? await prisma.timeEntry.findUnique({ where: { id: args.timeEntryId } })
        : await prisma.timeEntry.findFirst({
            where: { userEmail: context.user.email, status: "ACTIVE" },
          });

      if (!entry) {
        throw new GraphQLError("No active clock-in found");
      }

      // Verify ownership (unless admin/manager)
      const isAdminOrManager = context.user.role === "ADMIN" || context.user.role === "MANAGER";
      if (!isAdminOrManager && entry.userEmail !== context.user.email) {
        throw new GraphQLError("Not authorized");
      }

      if (entry.status !== "ACTIVE") {
        throw new GraphQLError("This time entry is not active");
      }

      const clockOut = new Date();
      const hoursWorked = (clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);

      // Auto-close if over 14 hours
      const finalStatus = hoursWorked > AUTO_CLOSE_HOURS ? "AUTO_CLOSED" : "COMPLETED";
      const finalHours = Math.min(hoursWorked, AUTO_CLOSE_HOURS);

      const noteAppend = args.note
        ? (entry.note ? entry.note + " | " : "") + args.note
        : entry.note;

      return prisma.timeEntry.update({
        ...query,
        where: { id: entry.id },
        data: {
          clockOut,
          hoursWorked: Math.round(finalHours * 100) / 100,
          status: finalStatus,
          note: noteAppend ?? undefined,
        },
      });
    },
  }),

  editTimeEntry: t.prismaField({
    type: "TimeEntry",
    args: {
      id: t.arg.string({ required: true }),
      clockIn: t.arg({ type: "DateTime", required: false }),
      clockOut: t.arg({ type: "DateTime", required: false }),
      note: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      if (context.user.role !== "ADMIN" && context.user.role !== "MANAGER") {
        throw new GraphQLError("Not authorized — ADMIN or MANAGER required");
      }

      const existing = await prisma.timeEntry.findUnique({ where: { id: args.id } });
      if (!existing) {
        throw new GraphQLError("Time entry not found");
      }

      const newClockIn = args.clockIn ? new Date(args.clockIn) : existing.clockIn;
      const newClockOut = args.clockOut ? new Date(args.clockOut) : existing.clockOut;

      let hoursWorked = existing.hoursWorked;
      if (newClockOut) {
        hoursWorked = Math.round(
          ((newClockOut.getTime() - newClockIn.getTime()) / (1000 * 60 * 60)) * 100
        ) / 100;
      }

      return prisma.timeEntry.update({
        ...query,
        where: { id: args.id },
        data: {
          clockIn: args.clockIn ? newClockIn : undefined,
          clockOut: args.clockOut ? newClockOut : undefined,
          hoursWorked,
          status: "EDITED",
          editedByEmail: context.user.email,
          note: args.note ?? undefined,
        },
      });
    },
  }),

  deleteTimeEntry: t.prismaField({
    type: "TimeEntry",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      if (context.user.role !== "ADMIN") {
        throw new GraphQLError("Not authorized — ADMIN only");
      }

      const entry = await prisma.timeEntry.findUnique({ where: { id: args.id } });
      if (!entry) {
        throw new GraphQLError("Time entry not found");
      }

      return prisma.timeEntry.delete({ where: { id: args.id } });
    },
  }),
}));
