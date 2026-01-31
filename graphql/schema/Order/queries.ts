// graphql/schema/Order/queries.ts

import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { Prisma, OrderStatus as PrismaOrderStatus } from "@prisma/client";
import { OrderStatus as OrderStatusEnum } from "./enum";

builder.prismaObject("Order", {
  fields: (t) => ({
    id: t.exposeString("id"),
    orderNumber: t.exposeString("orderNumber"),
    cart: t.expose("cart", { type: "JSON" }),
    items: t.expose("items", { type: "JSON", nullable: true }),

    orderDate: t.expose("orderDate", { type: "DateTime" }),
    deliveryTime: t.expose("deliveryTime", { type: "DateTime", nullable: true }),
    pickupTime: t.expose("pickupTime", { type: "DateTime", nullable: true }),

    userName: t.exposeString("userName"),
    userEmail: t.exposeString("userEmail"),
    userPhone: t.exposeString("userPhone"),
    user: t.relation("user"),

    paymentToken: t.exposeString("paymentToken", { nullable: true }),
    paid: t.exposeBoolean("paid"),

    deliveryAddress: t.exposeString("deliveryAddress"),
    deliveryFee: t.exposeFloat("deliveryFee"),
    serviceFee: t.exposeFloat("serviceFee"),

    status: t.expose("status", { type: OrderStatusEnum }),

    note: t.exposeString("note", { nullable: true }),
    specialNotes: t.exposeString("specialNotes", { nullable: true }),
    discount: t.exposeFloat("discount", { nullable: true }),
    total: t.exposeFloat("total"),

    preOrder: t.exposeBoolean("preOrder"),

    tableId: t.exposeString("tableId", { nullable: true }),
    table: t.relation("table", { nullable: true }),

    delivery: t.relation("delivery", { nullable: true }),

    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

function isAdminOrManager(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" || r === "MANAGER";
}

function normalizeSearch(raw: unknown) {
  return (raw ?? "").toString().trim();
}

function buildOrdersWhere(args: {
  search?: string | null;
  statusIn?: PrismaOrderStatus[] | null;
  paid?: boolean | null;

  // optional but aligned to your schema/indexes:
  from?: Date | null;
  to?: Date | null;
  preOrder?: boolean | null;
  tableId?: string | null;
}): Prisma.OrderWhereInput {
  const AND: Prisma.OrderWhereInput[] = [];

  if (typeof args.paid === "boolean") AND.push({ paid: args.paid });

  if (args.statusIn?.length) AND.push({ status: { in: args.statusIn } });

  // uses @@index([orderDate, status]) / @@index([status, orderDate])
  if (args.from || args.to) {
    AND.push({
      orderDate: {
        ...(args.from ? { gte: args.from } : {}),
        ...(args.to ? { lte: args.to } : {}),
      },
    });
  }

  if (typeof args.preOrder === "boolean") AND.push({ preOrder: args.preOrder });

  // uses @@index([tableId])
  if (args.tableId) AND.push({ tableId: args.tableId });

  // Search (fast-path equals for indexed fields)
  const q = normalizeSearch(args.search);
  if (q) {
    const OR: Prisma.OrderWhereInput[] = [];

    // ✅ FAST PATHS (use indexes)
    OR.push({ orderNumber: { equals: q } }); // unique
    if (q.includes("@")) OR.push({ userEmail: { equals: q, mode: "insensitive" } });

    const digits = q.replace(/[^\d]/g, "");
    if (digits.length >= 6) OR.push({ userPhone: { contains: digits } });

    // ✅ FUZZY (contains) – optionally accelerate with pg_trgm later
    if (q.length >= 2) {
      OR.push({ orderNumber: { contains: q, mode: "insensitive" } });
      OR.push({ userName: { contains: q, mode: "insensitive" } });
      OR.push({ userEmail: { contains: q, mode: "insensitive" } });
      OR.push({ deliveryAddress: { contains: q, mode: "insensitive" } });
      OR.push({ paymentToken: { contains: q, mode: "insensitive" } });
      OR.push({ note: { contains: q, mode: "insensitive" } });
      OR.push({ specialNotes: { contains: q, mode: "insensitive" } });
    }

    AND.push({ OR });
  }

  return AND.length ? { AND } : {};
}

builder.queryFields((t) => ({
  getOrder: t.prismaField({
    type: "Order",
    args: { id: t.arg.string({ required: true }) },
    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;
      if (!context.user) throw new GraphQLError("You must be logged in");

      // fetch minimal for auth
      const minimal = await prisma.order.findUnique({
        where: { id: args.id },
        select: { id: true, userEmail: true },
      });
      if (!minimal) throw new GraphQLError("Order not found");

      const role = context.user.role as any;
      const email = context.user.email ?? "";

      if (!isAdminOrManager(role) && minimal.userEmail.toLowerCase() !== String(email).toLowerCase()) {
        throw new GraphQLError("You don't have permission to view this order");
      }

      // fetch with GraphQL selection
      const order = await prisma.order.findUnique({
        ...query,
        where: { id: args.id },
      });

      if (!order) throw new GraphQLError("Order not found");
      return order;
    },
  }),

  /**
   * getOrders(search,statusIn,paid)
   * ✅ ALWAYS newest first:
   *   orderBy: [{ orderDate: 'desc' }, { id: 'desc' }]
   * ✅ Cursor pagination is now perfect from page 1
   */
  getOrders: t.prismaConnection({
    type: "Order",
    cursor: "id",
    defaultSize: 8,
    maxSize: 50,

    args: {
      search: t.arg.string(),
      statusIn: t.arg({ type: [OrderStatusEnum] }),
      paid: t.arg.boolean(),

      // optional (ready for future usage, matches your schema)
      from: t.arg({ type: "DateTime" }),
      to: t.arg({ type: "DateTime" }),
      preOrder: t.arg.boolean(),
      tableId: t.arg.string(),
    },

    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      if (!isAdminOrManager(context.user?.role)) {
        throw new GraphQLError("You don't have permission to perform this action");
      }

      const where = buildOrdersWhere({
        search: args.search ?? null,
        statusIn: (args.statusIn as unknown as PrismaOrderStatus[] | null) ?? null,
        paid: typeof args.paid === "boolean" ? args.paid : null,
        from: (args.from as unknown as Date | null) ?? null,
        to: (args.to as unknown as Date | null) ?? null,
        preOrder: typeof args.preOrder === "boolean" ? args.preOrder : null,
        tableId: (args.tableId as string | null) ?? null,
      });

      const orderBy: Prisma.OrderOrderByWithRelationInput[] = [
        { orderDate: "desc" },
        { id: "desc" },
      ];

      return prisma.order.findMany({
        ...query,
        where,
        orderBy,
      });
    },
  }),
}));
