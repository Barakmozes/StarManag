import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { Role } from "../User/enum";

function assertManagerOrAdmin(role?: string | null) {
  if (role !== "ADMIN" && role !== "MANAGER") {
    throw new GraphQLError("Not authorized — ADMIN or MANAGER required");
  }
}

builder.mutationFields((t) => ({
  createShiftTemplate: t.prismaField({
    type: "ShiftTemplate",
    args: {
      name: t.arg.string({ required: true }),
      dayOfWeek: t.arg.int({ required: true }),
      startTime: t.arg.string({ required: true }),
      endTime: t.arg.string({ required: true }),
      defaultRole: t.arg({ type: Role, required: false }),
      areaId: t.arg.string({ required: false }),
      description: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      assertManagerOrAdmin(context.user?.role);

      if (args.dayOfWeek < 0 || args.dayOfWeek > 6) {
        throw new GraphQLError("dayOfWeek must be between 0 (Sunday) and 6 (Saturday)");
      }

      // Validate HH:MM format
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(args.startTime) || !timeRegex.test(args.endTime)) {
        throw new GraphQLError("Time must be in HH:MM format (00:00-23:59)");
      }

      const crossesMidnight = args.endTime < args.startTime;

      return prisma.shiftTemplate.create({
        ...query,
        data: {
          name: args.name,
          dayOfWeek: args.dayOfWeek,
          startTime: args.startTime,
          endTime: args.endTime,
          crossesMidnight,
          defaultRole: args.defaultRole as any ?? undefined,
          areaId: args.areaId ?? undefined,
          description: args.description ?? undefined,
        },
      });
    },
  }),

  editShiftTemplate: t.prismaField({
    type: "ShiftTemplate",
    args: {
      id: t.arg.string({ required: true }),
      name: t.arg.string({ required: false }),
      dayOfWeek: t.arg.int({ required: false }),
      startTime: t.arg.string({ required: false }),
      endTime: t.arg.string({ required: false }),
      defaultRole: t.arg({ type: Role, required: false }),
      areaId: t.arg.string({ required: false }),
      description: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      assertManagerOrAdmin(context.user?.role);

      const existing = await prisma.shiftTemplate.findUnique({ where: { id: args.id } });
      if (!existing) {
        throw new GraphQLError("Shift template not found");
      }

      if (args.dayOfWeek !== null && args.dayOfWeek !== undefined) {
        if (args.dayOfWeek < 0 || args.dayOfWeek > 6) {
          throw new GraphQLError("dayOfWeek must be between 0 and 6");
        }
      }

      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (args.startTime && !timeRegex.test(args.startTime)) {
        throw new GraphQLError("startTime must be in HH:MM format");
      }
      if (args.endTime && !timeRegex.test(args.endTime)) {
        throw new GraphQLError("endTime must be in HH:MM format");
      }

      const finalStart = args.startTime ?? existing.startTime;
      const finalEnd = args.endTime ?? existing.endTime;
      const crossesMidnight = finalEnd < finalStart;

      return prisma.shiftTemplate.update({
        ...query,
        where: { id: args.id },
        data: {
          name: args.name ?? undefined,
          dayOfWeek: args.dayOfWeek ?? undefined,
          startTime: args.startTime ?? undefined,
          endTime: args.endTime ?? undefined,
          crossesMidnight,
          defaultRole: args.defaultRole as any ?? undefined,
          areaId: args.areaId ?? undefined,
          description: args.description ?? undefined,
        },
      });
    },
  }),

  deleteShiftTemplate: t.prismaField({
    type: "ShiftTemplate",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user || context.user.role !== "ADMIN") {
        throw new GraphQLError("Not authorized — ADMIN only");
      }
      const existing = await prisma.shiftTemplate.findUnique({ where: { id: args.id } });
      if (!existing) {
        throw new GraphQLError("Shift template not found");
      }
      return prisma.shiftTemplate.delete({ where: { id: args.id } });
    },
  }),

  toggleShiftTemplateActive: t.prismaField({
    type: "ShiftTemplate",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      assertManagerOrAdmin(context.user?.role);

      const existing = await prisma.shiftTemplate.findUnique({ where: { id: args.id } });
      if (!existing) {
        throw new GraphQLError("Shift template not found");
      }
      return prisma.shiftTemplate.update({
        ...query,
        where: { id: args.id },
        data: { active: !existing.active },
      });
    },
  }),

  generateShiftsFromTemplate: t.field({
    type: "Int",
    description: "Generate Shift records for a week from a template. Returns count of shifts created.",
    args: {
      templateId: t.arg.string({ required: true }),
      weekStart: t.arg({ type: "DateTime", required: true }),
      userEmails: t.arg.stringList({ required: true }),
    },
    resolve: async (_parent, args, contextPromise) => {
      const context = await contextPromise;
      assertManagerOrAdmin(context.user?.role);

      const template = await prisma.shiftTemplate.findUnique({ where: { id: args.templateId } });
      if (!template) {
        throw new GraphQLError("Shift template not found");
      }
      if (!template.active) {
        throw new GraphQLError("Shift template is not active");
      }

      const weekStart = new Date(args.weekStart);
      weekStart.setHours(0, 0, 0, 0);

      // Find the target day within this week
      const targetDate = new Date(weekStart);
      const currentDay = targetDate.getDay(); // 0=Sun
      const daysToAdd = (template.dayOfWeek - currentDay + 7) % 7;
      targetDate.setDate(targetDate.getDate() + daysToAdd);

      // Parse template times
      const [startH, startM] = template.startTime.split(":").map(Number);
      const [endH, endM] = template.endTime.split(":").map(Number);

      const shiftStart = new Date(targetDate);
      shiftStart.setHours(startH, startM, 0, 0);

      const shiftEnd = new Date(targetDate);
      shiftEnd.setHours(endH, endM, 0, 0);

      // Handle cross-midnight: add 1 day to end time
      if (template.crossesMidnight) {
        shiftEnd.setDate(shiftEnd.getDate() + 1);
      }

      let createdCount = 0;

      for (const email of args.userEmails) {
        // Check for overlapping shift
        const overlap = await prisma.shift.findFirst({
          where: {
            userEmail: email,
            status: { not: "CANCELLED" },
            startTime: { lt: shiftEnd },
            endTime: { gt: shiftStart },
          },
        });

        if (overlap) continue; // Skip if conflict exists

        await prisma.shift.create({
          data: {
            userEmail: email,
            startTime: shiftStart,
            endTime: shiftEnd,
            status: "DRAFT",
            shiftRole: template.defaultRole ?? undefined,
            areaId: template.areaId ?? undefined,
            templateId: template.id,
            createdByEmail: context.user?.email ?? undefined,
          },
        });
        createdCount++;
      }

      return createdCount;
    },
  }),
}));
