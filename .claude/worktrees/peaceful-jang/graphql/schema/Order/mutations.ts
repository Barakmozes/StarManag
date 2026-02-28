// graphql/schema/Order/mutations.ts

import { GraphQLError } from "graphql";
import prisma from "@/lib/prisma";
import { builder } from "@/graphql/builder";
import { OrderStatus } from "./enum";

function isAdminOrManager(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" || r === "MANAGER";
}

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

      // ✅ new optional fields
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

      // ✅ security: non-admin cannot create order for other email
      if (!isAdminOrManager(context.user.role) && context.user.email) {
        if (String(args.userEmail).toLowerCase() !== String(context.user.email).toLowerCase()) {
          throw new GraphQLError("You can't create an order for another user");
        }
      }

      const existingOrder = await prisma.order.findFirst({
        ...query,
        where: { orderNumber: args.orderNumber },
      });
      if (existingOrder) return existingOrder;

      const newOrder = await prisma.order.create({
        ...query,
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

      return newOrder;
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

      // ✅ admin/manager only (dashboard behavior)
      if (!isAdminOrManager(context.user.role)) {
        throw new GraphQLError("You don't have permission to perform this action");
      }

      return prisma.order.update({
        where: { id: args.id },
        data: {
          status: args.status as any,
          deliveryTime: (args.deliveryTime as any) ?? undefined,
        },
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

      // ✅ admin/manager OR owner
      const isOwner =
        context.user.email &&
        String(order.userEmail).toLowerCase() === String(context.user.email).toLowerCase();

      if (!isAdminOrManager(context.user.role) && !isOwner) {
        throw new GraphQLError("You don't have permission to perform this action");
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
