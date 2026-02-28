import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { ShiftStatus } from "./enum";
import { Role } from "../User/enum";

// Prisma object definition
builder.prismaObject("Shift", {
  fields: (t) => ({
    id: t.exposeID("id"),
    startTime: t.expose("startTime", { type: "DateTime" }),
    endTime: t.expose("endTime", { type: "DateTime" }),
    status: t.expose("status", { type: ShiftStatus }),
    note: t.exposeString("note", { nullable: true }),
    shiftRole: t.expose("shiftRole", { type: Role, nullable: true }),
    userEmail: t.exposeString("userEmail"),
    createdByEmail: t.exposeString("createdByEmail", { nullable: true }),
    templateId: t.exposeString("templateId", { nullable: true }),
    areaId: t.exposeString("areaId", { nullable: true }),
    user: t.relation("user"),
    createdByUser: t.relation("createdByUser", { nullable: true }),
    area: t.relation("area", { nullable: true }),
    template: t.relation("template", { nullable: true }),
    timeEntries: t.relation("timeEntries"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// Query fields
builder.queryFields((t) => ({
  getShift: t.prismaField({
    type: "Shift",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      const shift = await prisma.shift.findUnique({
        ...query,
        where: { id: args.id },
      });
      if (!shift) {
        throw new GraphQLError("Shift not found");
      }
      // Staff can only see their own shifts unless admin/manager
      const isAdminOrManager = context.user.role === "ADMIN" || context.user.role === "MANAGER";
      if (!isAdminOrManager && shift.userEmail !== context.user.email) {
        throw new GraphQLError("Not authorized");
      }
      return shift;
    },
  }),

  getShifts: t.prismaConnection({
    type: "Shift",
    cursor: "id",
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
      status: t.arg({ type: ShiftStatus, required: false }),
      userEmail: t.arg.string({ required: false }),
      areaId: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      const isAdminOrManager = context.user.role === "ADMIN" || context.user.role === "MANAGER";
      // Non-admin/manager can only see their own shifts
      const emailFilter = isAdminOrManager
        ? (args.userEmail ?? undefined)
        : context.user.email!;

      return prisma.shift.findMany({
        ...query,
        where: {
          startTime: { gte: new Date(args.from) },
          endTime: { lte: new Date(args.to) },
          ...(args.status ? { status: args.status as any } : {}),
          ...(emailFilter ? { userEmail: emailFilter } : {}),
          ...(args.areaId ? { areaId: args.areaId } : {}),
        },
        orderBy: { startTime: "asc" },
      });
    },
  }),

  getMyShifts: t.prismaConnection({
    type: "Shift",
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
      return prisma.shift.findMany({
        ...query,
        where: {
          userEmail: context.user.email,
          startTime: { gte: new Date(args.from) },
          endTime: { lte: new Date(args.to) },
        },
        orderBy: { startTime: "asc" },
      });
    },
  }),

  getWeeklySchedule: t.prismaField({
    type: ["Shift"],
    args: {
      weekStart: t.arg({ type: "DateTime", required: true }),
      areaId: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      const isAdminOrManager = context.user.role === "ADMIN" || context.user.role === "MANAGER";
      if (!isAdminOrManager) {
        throw new GraphQLError("Not authorized");
      }
      const weekStart = new Date(args.weekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      return prisma.shift.findMany({
        ...query,
        where: {
          status: "PUBLISHED",
          startTime: { gte: weekStart },
          endTime: { lte: weekEnd },
          ...(args.areaId ? { areaId: args.areaId } : {}),
        },
        orderBy: { startTime: "asc" },
      });
    },
  }),
}));
