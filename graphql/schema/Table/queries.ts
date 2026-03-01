// graphql/schema/Table/queries.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { OrderStatus } from "@prisma/client";

const RESERVATION_DURATION_MINUTES =
  parseInt(process.env.RESERVATION_DURATION_MINUTES || "") || 120;

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday",
  "Thursday", "Friday", "Saturday",
];

type OpenDay = { day: string; open: string; close: string; closed: boolean };

function validateOpeningHours(openTimes: unknown, requestedTime: Date): void {
  if (!openTimes || !Array.isArray(openTimes)) return;
  const dayName = DAY_NAMES[requestedTime.getDay()];
  const dayEntry = (openTimes as OpenDay[]).find((d) => d.day === dayName);
  if (!dayEntry) return;
  if (dayEntry.closed) {
    throw new GraphQLError("The restaurant is closed on this day");
  }
  const hh = String(requestedTime.getHours()).padStart(2, "0");
  const mm = String(requestedTime.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;
  if (timeStr < dayEntry.open || timeStr >= dayEntry.close) {
    throw new GraphQLError("The restaurant is closed at the requested time");
  }
}

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

    unpaidOrdersCount: t.int({
      description: "Number of unpaid (not paid) orders for this table",
      resolve: async (table, _args, ctx) => {
        return ctx.prisma.order.count({
          where: {
            tableId: table.id,
            paid: false,
            status: { not: "CANCELLED" }, // optional but recommended
          },
        });
      },
    }),


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



  /**
   * getTableOrder
   * Returns a list of "active" orders for the specified table,
   * along with all order details. 
   * 
   * "Active" typically excludes COMPLETED and CANCELLED orders,
   * but includes PENDING, PREPARING, etc.
   */
/**
   * getTableOrder
   */
  getTableOrder: t.prismaField({
    type: ["Order"],
    args: {
      tableId: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args) => {
      const orders = await prisma.order.findMany({
        ...query,
        where: {
          tableId: args.tableId,
          paid: false,
          status: {
            notIn: [OrderStatus.CANCELLED, OrderStatus.COMPLETED],
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return orders;
    },
  }),
  /**
   * getTableReservations
   * Returns reservations for a specific table that fall on the given *calendar date*.
   * Expects a date string like "2024-06-01". The code calculates start/end of that day.
   */
  getTableReservations: t.prismaField({
    type: ["Reservation"], // Return a list of Reservation objects
    args: {
      tableId: t.arg.string({ required: true }),
      date: t.arg.string({ required: true }), // or use a Date scalar if available
    },
    resolve: async (query, _parent, args) => {
      // Convert the date argument to a JS Date (midnight on that date)
      const startOfDay = new Date(args.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(args.date);
      endOfDay.setHours(23, 59, 59, 999);

      // Fetch reservations where reservationTime is within [startOfDay, endOfDay]
      const reservations = await prisma.reservation.findMany({
        ...query,
        where: {
          tableId: args.tableId,
          reservationTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          reservationTime: "asc",
        },
      });

      return reservations;
    },
  }),

  getAvailableTablesForReservation: t.prismaField({
    type: ["Table"],
    args: {
      date: t.arg.string({ required: true }),
      time: t.arg.string({ required: true }),
      numOfDiners: t.arg.int({ required: true }),
      areaId: t.arg.string({ required: false }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) {
        throw new GraphQLError("You must be logged in to check availability");
      }

      const requestedTime = new Date(`${args.date}T${args.time}:00`);
      if (isNaN(requestedTime.getTime())) {
        throw new GraphQLError("Invalid date or time format");
      }

      const restaurant = await prisma.restaurant.findFirst();
      if (restaurant) {
        validateOpeningHours(restaurant.openTimes, requestedTime);
      }

      const durationMs = RESERVATION_DURATION_MINUTES * 60 * 1000;
      const windowEnd = new Date(requestedTime.getTime() + durationMs);

      const overlapping = await prisma.reservation.findMany({
        where: {
          status: { in: ["PENDING", "CONFIRMED"] },
          reservationTime: {
            gt: new Date(requestedTime.getTime() - durationMs),
            lt: windowEnd,
          },
        },
        select: { tableId: true },
      });

      const blockedIds = Array.from(new Set(overlapping.map((r) => r.tableId)));

      return prisma.table.findMany({
        ...query,
        where: {
          diners: { gte: args.numOfDiners },
          ...(args.areaId ? { areaId: args.areaId } : {}),
          ...(blockedIds.length > 0 ? { id: { notIn: blockedIds } } : {}),
        },
        orderBy: { diners: "asc" },
      });
    },
  }),

}));

