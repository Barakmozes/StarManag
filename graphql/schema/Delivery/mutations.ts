// graphql/schema/Delivery/mutations.ts
import { builder } from "@/graphql/builder";
import prisma from "@/lib/prisma";
import { OrderStatus as PrismaOrderStatus } from "@prisma/client";
import { GraphQLError } from "graphql";

function isAdminOrManagerOrDelivery(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" || r === "MANAGER" || r === "DELIVERY";
}

function isAdminOrManagerOrChef(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" || r === "MANAGER" || r === "CHEF";
}

function normalizeOrderNumber(raw: unknown) {
  return (raw ?? "").toString().trim();
}

builder.mutationFields((t) => ({
  /**
   * PREPARING -> UNASSIGNED
   * (הזמנה “מוכנה לשילוח”)
   */
  markDeliveryReady: t.prismaField({
    type: "Order",
    args: {
      orderNumber: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isAdminOrManagerOrChef(context.user.role)) {
        throw new GraphQLError("You don't have permission to perform this action");
      }

      const orderNumber = normalizeOrderNumber(args.orderNumber);
      if (!orderNumber) throw new GraphQLError("Invalid order number");

      return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { orderNumber },
          select: { status: true, tableId: true },
        });

        if (!order) throw new GraphQLError("Order not found");
        if (order.tableId) throw new GraphQLError("This is not a delivery order");

        if (order.status !== PrismaOrderStatus.PREPARING) {
          throw new GraphQLError("Only PREPARING orders can be marked as ready");
        }

        return tx.order.update({
          ...query,
          where: { orderNumber },
          data: { status: PrismaOrderStatus.UNASSIGNED },
        });
      });
    },
  }),

  /**
   * UNASSIGNED -> create/upsert Delivery + COLLECTED
   * (בפרויקט שלך COLLECTED משמש כ-“בדרך / נאסף ע״י שליח” אחרי שיבוץ)
   */
  assignDriverToOrder: t.prismaField({
    type: "Delivery",
    args: {
      orderNumber: t.arg.string({ required: true }),
      driverName: t.arg.string({ required: true }),
      driverEmail: t.arg.string({ required: true }),
      driverPhone: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isAdminOrManagerOrDelivery(context.user.role)) {
        throw new GraphQLError("You don't have permission to perform this action");
      }

      const orderNumber = normalizeOrderNumber(args.orderNumber);
      if (!orderNumber) throw new GraphQLError("Invalid order number");

      return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { orderNumber },
          select: { status: true, tableId: true },
        });

        if (!order) throw new GraphQLError("Order not found");
        if (order.tableId) throw new GraphQLError("This is not a delivery order");

        if (order.status !== PrismaOrderStatus.UNASSIGNED) {
          throw new GraphQLError("Order must be UNASSIGNED to assign a driver");
        }

        const delivery = await tx.delivery.upsert({
          ...query,
          where: { orderNum: orderNumber },
          create: {
            orderNum: orderNumber,
            driverName: args.driverName.trim(),
            driverEmail: args.driverEmail.trim(),
            driverPhone: args.driverPhone.trim(),
          },
          update: {
            driverName: args.driverName.trim(),
            driverEmail: args.driverEmail.trim(),
            driverPhone: args.driverPhone.trim(),
          },
        });

        await tx.order.update({
          where: { orderNumber },
          data: { status: PrismaOrderStatus.COLLECTED },
        });

        return delivery;
      });
    },
  }),

  /**
   * COLLECTED -> DELIVERED (+ deliveryTime=now)
   */
  markDeliveryDelivered: t.prismaField({
    type: "Order",
    args: {
      orderNumber: t.arg.string({ required: true }),
    },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isAdminOrManagerOrDelivery(context.user.role)) {
        throw new GraphQLError("You don't have permission to perform this action");
      }

      const orderNumber = normalizeOrderNumber(args.orderNumber);
      if (!orderNumber) throw new GraphQLError("Invalid order number");

      return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { orderNumber },
          select: { status: true, tableId: true },
        });

        if (!order) throw new GraphQLError("Order not found");
        if (order.tableId) throw new GraphQLError("This is not a delivery order");

        if (order.status !== PrismaOrderStatus.COLLECTED) {
          throw new GraphQLError("Only COLLECTED orders can be marked as delivered");
        }

        return tx.order.update({
          ...query,
          where: { orderNumber },
          data: {
            status: PrismaOrderStatus.DELIVERED,
            deliveryTime: new Date(),
          },
        });
      });
    },
  }),

  /**
   * ביטול שיבוץ שליח:
   * delete Delivery + status -> UNASSIGNED
   */
  removeDriverFromOrder: t.field({
    type: "Boolean",
    args: {
      orderNumber: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isAdminOrManagerOrDelivery(context.user.role)) {
        throw new GraphQLError("You don't have permission to perform this action");
      }

      const orderNumber = normalizeOrderNumber(args.orderNumber);
      if (!orderNumber) throw new GraphQLError("Invalid order number");

      return prisma.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { orderNumber },
          select: { status: true, tableId: true },
        });

        if (!order) throw new GraphQLError("Order not found");
        if (order.tableId) throw new GraphQLError("This is not a delivery order");

      const canUnassign =
  order.status === PrismaOrderStatus.UNASSIGNED ||
  order.status === PrismaOrderStatus.COLLECTED;

if (!canUnassign) {
  throw new GraphQLError("You can unassign only UNASSIGNED/COLLECTED orders");
}

        await tx.delivery.deleteMany({ where: { orderNum: orderNumber } });

        // אם היה COLLECTED — מחזירים ל-UNASSIGNED
        await tx.order.update({
          where: { orderNumber },
          data: { status: PrismaOrderStatus.UNASSIGNED },
        });

        return true;
      });
    },
  }),
}));
