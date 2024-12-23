// graphql/schema/Table/queries.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";

/**
 * Pothos Prisma Object: Table
 *
 * Reflects the Prisma Table model:
 *  - id: String (cuid)
 *  - tableNumber: Int (unique)
 *  - diners: Int
 *  - reserved: Boolean (default: false)
 *  - specialRequests: String[] (default: [])
 *  - position: Json
 *  - areaId: String
 *  - area: Area (relation)
 *  - reservations: Reservation[] (relation)
 *  - orders: Order[] (relation)
 *  - usageStats: TableUsage? (relation)
 *  - createdAt: DateTime
 *  - updatedAt: DateTime
 *
 * We do not define the related objects (Area, Reservation, etc.) here.
 */
builder.prismaObject("Table", {
  fields: (t) => ({
    id: t.exposeID("id"),
    tableNumber: t.exposeInt("tableNumber"),
    diners: t.exposeInt("diners"),
    reserved: t.exposeBoolean("reserved"),
    specialRequests: t.exposeStringList("specialRequests"),
    position: t.expose("position", { type: "JSON" }),
    areaId: t.exposeString("areaId"),

    // Relations (not defining the objects themselves here)
    area: t.relation("area"),
    reservations: t.relation("reservations"),
    orders: t.relation("orders"),
    usageStats: t.relation("usageStats", { nullable: true }),

    // Timestamps
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

/**
 * Query Fields for Table
 */
builder.queryFields((t) => ({
  /**
   * getTable
   * Fetch a single table by ID. Throws an error if not found.
   */
  getTable: t.prismaField({
    type: "Table",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args) => {
      const table = await prisma.table.findUnique({
        ...query,
        where: { id: args.id },
      });
      if (!table) {
        throw new GraphQLError("Table not found");
      }
      return table;
    },
  }),

  /**
   * getTables
   * Fetch all tables. Optionally, you could add pagination or filters.
   */
  getTables: t.prismaField({
    type: ["Table"],
    resolve: async (query) => {
      return prisma.table.findMany({ ...query });
    },
  }),

  /**
   * getAvailableTables
   * Fetch all tables where 'reserved' = false.
   */
  getAvailableTables: t.prismaField({
    type: ["Table"],
    resolve: async (query) => {
      return prisma.table.findMany({
        ...query,
        where: { reserved: false },
      });
    },
  }),
}));
