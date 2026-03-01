// graphql/schema/KitchenTicket/queries.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import {
  DisplayStation,
  TicketStatus,
  TicketItemStatus,
} from "./enum";
import {
  TicketStatus as PrismaTicketStatus,
  DisplayStation as PrismaDisplayStation,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

function isKitchenStaff(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  return ["ADMIN", "MANAGER", "CHEF", "BARTENDER"].includes(r);
}

// ---------------------------------------------------------------------------
// Pothos object: KitchenTicketItem
// ---------------------------------------------------------------------------

builder.prismaObject("KitchenTicketItem", {
  fields: (t) => ({
    id: t.exposeString("id"),
    menuItemId: t.exposeString("menuItemId", { nullable: true }),
    menuTitle: t.exposeString("menuTitle"),
    quantity: t.exposeInt("quantity"),
    instructions: t.exposeString("instructions"),
    prepare: t.exposeString("prepare"),
    category: t.exposeString("category"),
    status: t.expose("status", { type: TicketItemStatus }),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

// ---------------------------------------------------------------------------
// Pothos object: KitchenTicket
// ---------------------------------------------------------------------------

builder.prismaObject("KitchenTicket", {
  fields: (t) => ({
    id: t.exposeString("id"),
    orderId: t.exposeString("orderId"),
    station: t.expose("station", { type: DisplayStation }),
    status: t.expose("status", { type: TicketStatus }),
    priority: t.exposeInt("priority"),
    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),

    // Items relation
    items: t.relation("items"),

    // Order relation (for nested queries)
    order: t.relation("order"),

    // ---------- Computed fields from Order ----------

    orderNumber: t.string({
      resolve: async (ticket) => {
        const order = await prisma.order.findUnique({
          where: { id: ticket.orderId },
          select: { orderNumber: true },
        });
        return order?.orderNumber ?? "";
      },
    }),

    tableId: t.string({
      nullable: true,
      resolve: async (ticket) => {
        const order = await prisma.order.findUnique({
          where: { id: ticket.orderId },
          select: { tableId: true },
        });
        return order?.tableId ?? null;
      },
    }),

    tableNumber: t.int({
      nullable: true,
      resolve: async (ticket) => {
        const order = await prisma.order.findUnique({
          where: { id: ticket.orderId },
          select: { table: { select: { tableNumber: true } } },
        });
        return order?.table?.tableNumber ?? null;
      },
    }),

    orderNote: t.string({
      nullable: true,
      resolve: async (ticket) => {
        const order = await prisma.order.findUnique({
          where: { id: ticket.orderId },
          select: { note: true },
        });
        return order?.note ?? null;
      },
    }),

    specialNotes: t.string({
      nullable: true,
      resolve: async (ticket) => {
        const order = await prisma.order.findUnique({
          where: { id: ticket.orderId },
          select: { specialNotes: true },
        });
        return order?.specialNotes ?? null;
      },
    }),

    orderDate: t.field({
      type: "DateTime",
      resolve: async (ticket) => {
        const order = await prisma.order.findUnique({
          where: { id: ticket.orderId },
          select: { orderDate: true },
        });
        return order?.orderDate ?? new Date();
      },
    }),

    userName: t.string({
      resolve: async (ticket) => {
        const order = await prisma.order.findUnique({
          where: { id: ticket.orderId },
          select: { userName: true },
        });
        return order?.userName ?? "";
      },
    }),

    // Computed: DINE_IN | DELIVERY | TAKEAWAY
    orderType: t.string({
      resolve: async (ticket) => {
        const order = await prisma.order.findUnique({
          where: { id: ticket.orderId },
          select: { tableId: true, deliveryAddress: true },
        });
        if (!order) return "TAKEAWAY";
        if (order.tableId) return "DINE_IN";
        if (order.deliveryAddress && order.deliveryAddress.trim() !== "") return "DELIVERY";
        return "TAKEAWAY";
      },
    }),

    // Computed: sibling station's ticket status
    siblingTicketStatus: t.string({
      nullable: true,
      resolve: async (ticket) => {
        const siblingStation =
          ticket.station === PrismaDisplayStation.KITCHEN
            ? PrismaDisplayStation.BAR
            : PrismaDisplayStation.KITCHEN;

        const sibling = await prisma.kitchenTicket.findUnique({
          where: {
            orderId_station: {
              orderId: ticket.orderId,
              station: siblingStation,
            },
          },
          select: { status: true },
        });
        return sibling?.status ?? null;
      },
    }),
  }),
});

// ---------------------------------------------------------------------------
// Query fields
// ---------------------------------------------------------------------------

builder.queryFields((t) => ({
  /**
   * getKitchenTickets
   * Main query for KDS/BDS displays. Supports delta polling via updatedAfter.
   * Auto-filters stale COMPLETED (>2h) and CANCELLED (>5min) tickets.
   * Orders by: priority DESC, createdAt ASC (rush first, then FIFO).
   */
  getKitchenTickets: t.prismaField({
    type: ["KitchenTicket"],
    args: {
      station: t.arg({ type: DisplayStation, required: true }),
      statusIn: t.arg({ type: [TicketStatus] }),
      limit: t.arg.int(),
      updatedAfter: t.arg({ type: "DateTime" }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isKitchenStaff(context.user.role)) {
        throw new GraphQLError("You don't have permission to view tickets");
      }

      const now = new Date();
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      // Build where clause
      const where: any = {
        station: args.station as PrismaDisplayStation,
        AND: [
          // Exclude stale COMPLETED tickets (older than 2 hours)
          {
            NOT: {
              status: PrismaTicketStatus.COMPLETED,
              updatedAt: { lt: twoHoursAgo },
            },
          },
          // Exclude stale CANCELLED tickets (older than 5 minutes)
          {
            NOT: {
              status: PrismaTicketStatus.CANCELLED,
              updatedAt: { lt: fiveMinutesAgo },
            },
          },
        ],
      };

      // Status filter
      if (args.statusIn?.length) {
        where.status = { in: args.statusIn as PrismaTicketStatus[] };
      }

      // Delta polling
      if (args.updatedAfter) {
        where.updatedAt = { gt: args.updatedAfter };
      }

      return prisma.kitchenTicket.findMany({
        ...query,
        where,
        orderBy: [
          { priority: "desc" },
          { createdAt: "asc" },
        ],
        take: args.limit ?? 100,
      });
    },
  }),

  /**
   * getKitchenTicket
   * Single ticket with full details.
   */
  getKitchenTicket: t.prismaField({
    type: "KitchenTicket",
    args: {
      id: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isKitchenStaff(context.user.role)) {
        throw new GraphQLError("You don't have permission to view tickets");
      }

      const ticket = await prisma.kitchenTicket.findUnique({
        ...query,
        where: { id: args.id },
      });

      if (!ticket) throw new GraphQLError("Ticket not found");
      return ticket;
    },
  }),
}));
