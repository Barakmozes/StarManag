// graphql/schema/Order/mutations.ts

import { GraphQLError } from "graphql";
import prisma from "@/lib/prisma";
import { builder } from "@/graphql/builder";
import { OrderStatus } from "./enum";
import {
  DisplayStation as PrismaDisplayStation,
  TicketStatus as PrismaTicketStatus,
  OrderStatus as PrismaOrderStatus,
  Prisma,
} from "@prisma/client";

function isAdminOrManager(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" || r === "MANAGER";
}

// ---------------------------------------------------------------------------
// KDS helpers — create / cancel tickets alongside order lifecycle
// ---------------------------------------------------------------------------

export type TxClient = Omit<
  typeof prisma,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

/**
 * Create KDS tickets for a new order.
 * Groups cart items by station (KITCHEN / BAR) using categoryId → fallback title.
 */
export async function createTicketsForOrder(
  tx: TxClient,
  orderId: string,
  cart: any[]
) {
  // 1. Fetch all categories with station assignments
  const categories = await tx.category.findMany({
    select: { id: true, title: true, station: true },
  });
  const stationById = new Map(categories.map((c) => [c.id, c.station]));
  const stationByTitle = new Map(
    categories.map((c) => [c.title.toLowerCase(), c.station])
  );

  // 2. Group cart items by station
  const groups: Record<string, any[]> = { KITCHEN: [], BAR: [] };
  for (const item of cart) {
    let station: string = "KITCHEN";
    if (item.categoryId && stationById.has(item.categoryId)) {
      station = stationById.get(item.categoryId)!;
    } else if (
      item.category &&
      stationByTitle.has(String(item.category).toLowerCase())
    ) {
      station = stationByTitle.get(String(item.category).toLowerCase())!;
    }
    groups[station].push(item);
  }

  // 3. Create tickets per station (skip empty)
  let ticketCount = 0;
  for (const [station, items] of Object.entries(groups)) {
    if (items.length === 0) continue;
    await tx.kitchenTicket.create({
      data: {
        orderId,
        station: station as PrismaDisplayStation,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.id ?? null,
            menuTitle: item.title ?? "",
            quantity: item.quantity ?? 1,
            instructions: item.instructions ?? "",
            prepare: item.prepare ?? "",
            category: item.category ?? "",
          })),
        },
      },
    });
    ticketCount++;
  }

  // Hard error: if a non-empty cart produces zero tickets, something is wrong
  if (cart.length > 0 && ticketCount === 0) {
    throw new GraphQLError(
      "No KDS tickets were created — check that cart items have valid category/categoryId"
    );
  }

  return ticketCount;
}

/**
 * Cancel all active tickets for an order (when order is cancelled).
 */
export async function cancelTicketsForOrder(tx: TxClient, orderId: string) {
  await tx.kitchenTicket.updateMany({
    where: {
      orderId,
      status: {
        notIn: [PrismaTicketStatus.COMPLETED, PrismaTicketStatus.CANCELLED],
      },
    },
    data: { status: PrismaTicketStatus.CANCELLED },
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

builder.mutationFields((t) => ({
  addOrder: t.prismaField({
    type: "Order",
    args: {
      orderNumber: t.arg.string({ required: true }),
      cart: t.arg({ type: "JSON", required: true }),

      userName: t.arg.string({ required: true }),
      userEmail: t.arg.string({ required: true }),
      userPhone: t.arg.string({ required: true }),

      paymentToken: t.arg.string(),
      deliveryAddress: t.arg.string({ required: true }),
      deliveryFee: t.arg.float({ required: true }),
      serviceFee: t.arg.float({ required: true }),

      note: t.arg.string(),
      discount: t.arg.float(),
      total: t.arg.float({ required: true }),

      // optional fields
      items: t.arg({ type: "JSON" }),
      preOrder: t.arg.boolean(),
      pickupTime: t.arg({ type: "DateTime" }),
      specialNotes: t.arg.string(),
      tableId: t.arg.string(),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      if (!context.user) {
        throw new GraphQLError("You must be logged in to perform this action");
      }

      // security: non-admin cannot create order for other email
      if (!isAdminOrManager(context.user.role) && context.user.email) {
        if (
          String(args.userEmail).toLowerCase() !==
          String(context.user.email).toLowerCase()
        ) {
          throw new GraphQLError("You can't create an order for another user");
        }
      }

      // Atomic: order + ticket creation in single transaction
      return prisma.$transaction(async (tx) => {
        // Idempotency guard
        const existingOrder = await tx.order.findFirst({
          ...query,
          where: { orderNumber: args.orderNumber },
        });
        if (existingOrder) return existingOrder;

        const newOrder = await tx.order.create({
          data: {
            orderNumber: args.orderNumber,
            cart: args.cart as any,

            userName: args.userName,
            userEmail: args.userEmail,
            userPhone: args.userPhone,

            paymentToken: args.paymentToken ?? undefined,
            deliveryAddress: args.deliveryAddress,
            deliveryFee: args.deliveryFee,
            serviceFee: args.serviceFee,

            note: args.note ?? undefined,
            discount: args.discount ?? undefined,
            total: args.total,

            items: (args.items as any) ?? undefined,
            preOrder: args.preOrder ?? undefined,
            pickupTime: (args.pickupTime as any) ?? undefined,
            specialNotes: args.specialNotes ?? undefined,
            tableId: args.tableId ?? undefined,
          },
        });

        // Create KDS tickets from cart items
        const cartArray = Array.isArray(args.cart) ? args.cart : [];
        await createTicketsForOrder(tx, newOrder.id, cartArray as any[]);

        // Re-fetch with Pothos query (includes tickets relation if requested)
        return tx.order.findUniqueOrThrow({ ...query, where: { id: newOrder.id } });
      });
    },
  }),

  editOrder: t.prismaField({
    type: "Order",
    args: {
      id: t.arg.string({ required: true }),
      status: t.arg({ type: OrderStatus, required: true }),
      deliveryTime: t.arg({ type: "DateTime" }),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");

      // admin/manager only (dashboard behavior)
      if (!isAdminOrManager(context.user.role)) {
        throw new GraphQLError(
          "You don't have permission to perform this action"
        );
      }

      return prisma.$transaction(async (tx) => {
        const updatedOrder = await tx.order.update({
          where: { id: args.id },
          data: {
            status: args.status as any,
            deliveryTime: (args.deliveryTime as any) ?? undefined,
          },
        });

        // Cancel active tickets when order is cancelled
        if (args.status === "CANCELLED") {
          await cancelTicketsForOrder(tx, args.id);
        }

        return updatedOrder;
      });
    },
  }),

  editOrderOnPayment: t.prismaField({
    type: "Order",
    args: {
      id: t.arg.string({ required: true }),
      paymentToken: t.arg.string(),
    },
    resolve: async (_query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");

      const order = await prisma.order.findUnique({
        where: { id: args.id },
        select: { id: true, userEmail: true },
      });
      if (!order) throw new GraphQLError("Order not found");

      // admin/manager OR owner
      const isOwner =
        context.user.email &&
        String(order.userEmail).toLowerCase() ===
          String(context.user.email).toLowerCase();

      if (!isAdminOrManager(context.user.role) && !isOwner) {
        throw new GraphQLError(
          "You don't have permission to perform this action"
        );
      }

      return prisma.order.update({
        where: { id: args.id },
        data: {
          paymentToken: args.paymentToken ?? undefined,
          paid: true,
        },
      });
    },
  }),
}));
