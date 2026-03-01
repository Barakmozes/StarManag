// graphql/schema/KitchenTicket/mutations.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { TicketStatus, TicketItemStatus } from "./enum";
import {
  TicketStatus as PrismaTicketStatus,
  TicketItemStatus as PrismaTicketItemStatus,
  OrderStatus as PrismaOrderStatus,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function isKitchenStaff(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  return ["ADMIN", "MANAGER", "CHEF", "BARTENDER"].includes(r);
}

function isAdminOrManager(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" || r === "MANAGER";
}

// ---------------------------------------------------------------------------
// Mutation fields
// ---------------------------------------------------------------------------

builder.mutationFields((t) => ({
  /**
   * updateTicketItemStatus
   * Marks an individual item's status. Uses serializable transaction to prevent races.
   * Auto-completes ticket when all non-cancelled items are DONE.
   * Auto-advances order to READY when all tickets are COMPLETED.
   */
  updateTicketItemStatus: t.prismaField({
    type: "KitchenTicketItem",
    args: {
      itemId: t.arg.string({ required: true }),
      status: t.arg({ type: TicketItemStatus, required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isKitchenStaff(context.user.role)) {
        throw new GraphQLError("You don't have permission to update ticket items");
      }

      return prisma.$transaction(
        async (tx) => {
          // 1. Update the item
          const item = await tx.kitchenTicketItem.update({
            ...query,
            where: { id: args.itemId },
            data: { status: args.status as PrismaTicketItemStatus },
          });

          // 2. Check if all non-cancelled items in ticket are DONE
          const ticketItems = await tx.kitchenTicketItem.findMany({
            where: {
              ticketId: item.ticketId,
              status: { not: PrismaTicketItemStatus.CANCELLED },
            },
            select: { status: true },
          });

          const allDone =
            ticketItems.length > 0 &&
            ticketItems.every((i) => i.status === PrismaTicketItemStatus.DONE);

          if (allDone) {
            const ticket = await tx.kitchenTicket.update({
              where: { id: item.ticketId },
              data: { status: PrismaTicketStatus.COMPLETED },
              select: { orderId: true },
            });

            // 3. Check if ALL non-cancelled tickets for this order are COMPLETED
            const orderTickets = await tx.kitchenTicket.findMany({
              where: {
                orderId: ticket.orderId,
                status: { not: PrismaTicketStatus.CANCELLED },
              },
              select: { status: true },
            });

            const allTicketsCompleted =
              orderTickets.length > 0 &&
              orderTickets.every(
                (t) => t.status === PrismaTicketStatus.COMPLETED
              );

            if (allTicketsCompleted) {
              await tx.order.update({
                where: { id: ticket.orderId },
                data: { status: PrismaOrderStatus.READY },
              });
            }
          }

          return item;
        },
        { isolationLevel: "Serializable" }
      );
    },
  }),

  /**
   * bumpTicketStatus
   * Manually advance whole ticket status (NEW → IN_PROGRESS → COMPLETED).
   * When bumping to COMPLETED: bulk-update all PENDING/IN_PROGRESS items to DONE.
   * Auto-advances order to READY when all tickets are COMPLETED.
   */
  bumpTicketStatus: t.prismaField({
    type: "KitchenTicket",
    args: {
      ticketId: t.arg.string({ required: true }),
      status: t.arg({ type: TicketStatus, required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isKitchenStaff(context.user.role)) {
        throw new GraphQLError("You don't have permission to update tickets");
      }

      return prisma.$transaction(
        async (tx) => {
          // 1. Update ticket status
          const ticket = await tx.kitchenTicket.update({
            ...query,
            where: { id: args.ticketId },
            data: { status: args.status as PrismaTicketStatus },
          });

          // 2. If bumping to COMPLETED, mark all active items as DONE
          if (args.status === "COMPLETED") {
            await tx.kitchenTicketItem.updateMany({
              where: {
                ticketId: args.ticketId,
                status: {
                  in: [
                    PrismaTicketItemStatus.PENDING,
                    PrismaTicketItemStatus.IN_PROGRESS,
                  ],
                },
              },
              data: { status: PrismaTicketItemStatus.DONE },
            });

            // 3. Check if ALL non-cancelled tickets for this order are COMPLETED
            const orderTickets = await tx.kitchenTicket.findMany({
              where: {
                orderId: ticket.orderId,
                status: { not: PrismaTicketStatus.CANCELLED },
              },
              select: { status: true },
            });

            const allTicketsCompleted =
              orderTickets.length > 0 &&
              orderTickets.every(
                (t) => t.status === PrismaTicketStatus.COMPLETED
              );

            if (allTicketsCompleted) {
              await tx.order.update({
                where: { id: ticket.orderId },
                data: { status: PrismaOrderStatus.READY },
              });
            }
          }

          return ticket;
        },
        { isolationLevel: "Serializable" }
      );
    },
  }),

  /**
   * recallTicket
   * Set ticket back to IN_PROGRESS (for corrections after COMPLETED).
   * Reverts Order status from READY back to PREPARING if needed.
   */
  recallTicket: t.prismaField({
    type: "KitchenTicket",
    args: {
      ticketId: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isKitchenStaff(context.user.role)) {
        throw new GraphQLError("You don't have permission to recall tickets");
      }

      return prisma.$transaction(async (tx) => {
        // 1. Set ticket back to IN_PROGRESS
        const ticket = await tx.kitchenTicket.update({
          ...query,
          where: { id: args.ticketId },
          data: { status: PrismaTicketStatus.IN_PROGRESS },
        });

        // 2. If order was auto-advanced to READY, revert to PREPARING
        const order = await tx.order.findUnique({
          where: { id: ticket.orderId },
          select: { status: true },
        });

        if (order?.status === PrismaOrderStatus.READY) {
          await tx.order.update({
            where: { id: ticket.orderId },
            data: { status: PrismaOrderStatus.PREPARING },
          });
        }

        return ticket;
      });
    },
  }),

  /**
   * setTicketPriority
   * Set priority (0=normal, 1=rush). ADMIN/MANAGER only.
   */
  setTicketPriority: t.prismaField({
    type: "KitchenTicket",
    args: {
      ticketId: t.arg.string({ required: true }),
      priority: t.arg.int({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isAdminOrManager(context.user.role)) {
        throw new GraphQLError("Only ADMIN/MANAGER can set ticket priority");
      }

      return prisma.kitchenTicket.update({
        ...query,
        where: { id: args.ticketId },
        data: { priority: args.priority },
      });
    },
  }),
}));
