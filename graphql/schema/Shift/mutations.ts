import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { ShiftStatus } from "./enum";
import { Role } from "../User/enum";

function assertManagerOrAdmin(role?: string | null) {
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new GraphQLError("Not authorized — ADMIN or MANAGER required");
  }
}

builder.mutationFields((t) => ({
  createShift: t.prismaField({
    type: "Shift",
    args: {
      userEmail: t.arg.string({ required: true }),
      startTime: t.arg({ type: "DateTime", required: true }),
      endTime: t.arg({ type: "DateTime", required: true }),
      shiftRole: t.arg({ type: Role, required: false }),
      areaId: t.arg.string({ required: false }),
      note: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      assertManagerOrAdmin(context.user?.role);

      const startTime = new Date(args.startTime);
      const endTime = new Date(args.endTime);

      if (endTime <= startTime) {
        throw new GraphQLError("End time must be after start time");
      }

      // Overlap detection — same employee, same time window
      const overlap = await prisma.shift.findFirst({
        where: {
          userEmail: args.userEmail,
          status: { not: "CANCELLED" },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });
      if (overlap) {
        throw new GraphQLError("This employee already has a shift during this time");
      }

      return prisma.shift.create({
        ...query,
        data: {
          userEmail: args.userEmail,
          startTime,
          endTime,
          shiftRole: args.shiftRole as any ?? undefined,
          areaId: args.areaId ?? undefined,
          note: args.note ?? undefined,
          createdByEmail: context.user?.email ?? undefined,
        },
      });
    },
  }),

  editShift: t.prismaField({
    type: "Shift",
    args: {
      id: t.arg.string({ required: true }),
      startTime: t.arg({ type: "DateTime", required: false }),
      endTime: t.arg({ type: "DateTime", required: false }),
      status: t.arg({ type: ShiftStatus, required: false }),
      note: t.arg.string({ required: false }),
      shiftRole: t.arg({ type: Role, required: false }),
      areaId: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      assertManagerOrAdmin(context.user?.role);

      const existing = await prisma.shift.findUnique({ where: { id: args.id } });
      if (!existing) {
        throw new GraphQLError("Shift not found");
      }

      const newStart = args.startTime ? new Date(args.startTime) : existing.startTime;
      const newEnd = args.endTime ? new Date(args.endTime) : existing.endTime;

      if (newEnd <= newStart) {
        throw new GraphQLError("End time must be after start time");
      }

      // Overlap check if times changed
      if (args.startTime || args.endTime) {
        const overlap = await prisma.shift.findFirst({
          where: {
            id: { not: args.id },
            userEmail: existing.userEmail,
            status: { not: "CANCELLED" },
            startTime: { lt: newEnd },
            endTime: { gt: newStart },
          },
        });
        if (overlap) {
          throw new GraphQLError("This employee already has a shift during this time");
        }
      }

      return prisma.shift.update({
        ...query,
        where: { id: args.id },
        data: {
          startTime: args.startTime ? newStart : undefined,
          endTime: args.endTime ? newEnd : undefined,
          status: args.status as any ?? undefined,
          note: args.note ?? undefined,
          shiftRole: args.shiftRole as any ?? undefined,
          areaId: args.areaId ?? undefined,
        },
      });
    },
  }),

  cancelShift: t.prismaField({
    type: "Shift",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      assertManagerOrAdmin(context.user?.role);

      const existing = await prisma.shift.findUnique({ where: { id: args.id } });
      if (!existing) {
        throw new GraphQLError("Shift not found");
      }
      if (existing.status === "CANCELLED") {
        throw new GraphQLError("Shift is already cancelled");
      }

      return prisma.shift.update({
        where: { id: args.id },
        data: { status: "CANCELLED" },
      });
    },
  }),

  publishShifts: t.field({
    type: "Int",
    args: {
      ids: t.arg.stringList({ required: true }),
    },
    resolve: async (_parent, args, contextPromise) => {
      const context = await contextPromise;
      assertManagerOrAdmin(context.user?.role);

      const result = await prisma.shift.updateMany({
        where: {
          id: { in: args.ids },
          status: "DRAFT",
        },
        data: { status: "PUBLISHED" },
      });
      return result.count;
    },
  }),
}));
