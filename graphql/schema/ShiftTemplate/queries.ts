import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { Role } from "../User/enum";

builder.prismaObject("ShiftTemplate", {
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    description: t.exposeString("description", { nullable: true }),
    dayOfWeek: t.exposeInt("dayOfWeek"),
    startTime: t.exposeString("startTime"),
    endTime: t.exposeString("endTime"),
    crossesMidnight: t.exposeBoolean("crossesMidnight"),
    defaultRole: t.expose("defaultRole", { type: Role, nullable: true }),
    active: t.exposeBoolean("active"),
    areaId: t.exposeString("areaId", { nullable: true }),
    area: t.relation("area", { nullable: true }),
    shifts: t.relation("shifts"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

builder.queryFields((t) => ({
  getShiftTemplates: t.prismaField({
    type: ["ShiftTemplate"],
    args: {
      active: t.arg.boolean({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      if (context.user.role !== "ADMIN" && context.user.role !== "MANAGER") {
        throw new GraphQLError("Not authorized");
      }
      return prisma.shiftTemplate.findMany({
        ...query,
        where: args.active !== null && args.active !== undefined
          ? { active: args.active }
          : undefined,
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    },
  }),

  getShiftTemplate: t.prismaField({
    type: "ShiftTemplate",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in");
      }
      if (context.user.role !== "ADMIN" && context.user.role !== "MANAGER") {
        throw new GraphQLError("Not authorized");
      }
      const template = await prisma.shiftTemplate.findUnique({
        ...query,
        where: { id: args.id },
      });
      if (!template) {
        throw new GraphQLError("Shift template not found");
      }
      return template;
    },
  }),
}));
