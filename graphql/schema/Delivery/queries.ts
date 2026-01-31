// graphql/schema/Delivery/queries.ts
import prisma from "@/lib/prisma";
import { GraphQLError } from "graphql";
import { builder } from "@/graphql/builder";
import { Prisma, OrderStatus as PrismaOrderStatus } from "@prisma/client";
import { OrderStatus as OrderStatusEnum } from "../Order/enum";

/**
 * Delivery GraphQL Type
 * נדרש כדי שה-relation Order.delivery יעבוד (כמו שמוגדר ב-Order prismaObject)
 */
builder.prismaObject("Delivery", {
  fields: (t) => ({
    id: t.exposeString("id"),

    driverName: t.exposeString("driverName"),
    driverEmail: t.exposeString("driverEmail"),
    driverPhone: t.exposeString("driverPhone"),

    orderNum: t.exposeString("orderNum"),
    order: t.relation("order"),

    createdAt: t.expose("createdAt", { type: "DateTime" }),
    updatedAt: t.expose("updatedAt", { type: "DateTime" }),
  }),
});

function isDeliveryDashboardRole(role?: string | null) {
  const r = String(role ?? "").toUpperCase();
  return r === "ADMIN" || r === "MANAGER" || r === "DELIVERY" || r === "CHEF";
}

function normalizeSearch(raw: unknown) {
  return (raw ?? "").toString().trim();
}

function defaultDeliveryStatuses(): PrismaOrderStatus[] {
  return [
    PrismaOrderStatus.PREPARING,
    PrismaOrderStatus.UNASSIGNED,
    PrismaOrderStatus.COLLECTED,
    PrismaOrderStatus.DELIVERED,
  ];
}

function buildDeliveryOrdersWhere(args: {
  search?: string | null;
  statusIn?: PrismaOrderStatus[] | null;
}): Prisma.OrderWhereInput {
  const AND: Prisma.OrderWhereInput[] = [];

  // ✅ רק משלוחים (לא שולחנות)
  AND.push({ tableId: null });

  // ✅ ברירת מחדל: כל סטטוסי המשלוחים כולל PREPARING
  const statuses = args.statusIn?.length ? args.statusIn : defaultDeliveryStatuses();
  AND.push({ status: { in: statuses } });

  const q = normalizeSearch(args.search);
  if (q) {
    const OR: Prisma.OrderWhereInput[] = [];

    // fast paths
    OR.push({ orderNumber: { equals: q } });
    if (q.includes("@")) OR.push({ userEmail: { equals: q, mode: "insensitive" } });

    const digits = q.replace(/[^\d]/g, "");
    if (digits.length >= 6) OR.push({ userPhone: { contains: digits } });

    // fuzzy
    if (q.length >= 2) {
      OR.push({ orderNumber: { contains: q, mode: "insensitive" } });
      OR.push({ userName: { contains: q, mode: "insensitive" } });
      OR.push({ userEmail: { contains: q, mode: "insensitive" } });
      OR.push({ deliveryAddress: { contains: q, mode: "insensitive" } });

      // חיפוש גם לפי פרטי שליח (אם הוקצה)
      OR.push({
        delivery: {
          is: {
            driverName: { contains: q, mode: "insensitive" },
          },
        },
      });
      OR.push({
        delivery: {
          is: {
            driverEmail: { contains: q, mode: "insensitive" },
          },
        },
      });
      OR.push({
        delivery: {
          is: {
            driverPhone: { contains: q, mode: "insensitive" },
          },
        },
      });
    }

    AND.push({ OR });
  }

  return { AND };
}

builder.queryFields((t) => ({
  /**
   * getDeliveryOrders(search,statusIn)
   * ✅ מחזיר רק הזמנות משלוח (tableId null)
   * ✅ כולל PREPARING כברירת מחדל
   * ✅ ממויין מהחדש לישן
   */
  getDeliveryOrders: t.prismaConnection({
    type: "Order",
    cursor: "id",
    defaultSize: 20,
    maxSize: 50,

    args: {
      search: t.arg.string(),
      statusIn: t.arg({ type: [OrderStatusEnum] }),
    },

    resolve: async (query, _parent, args, contextPromise) => {
      const context = await contextPromise;

      if (!context.user) throw new GraphQLError("You must be logged in");
      if (!isDeliveryDashboardRole(context.user.role)) {
        throw new GraphQLError("You don't have permission to perform this action");
      }

      const where = buildDeliveryOrdersWhere({
        search: args.search ?? null,
        statusIn: (args.statusIn as unknown as PrismaOrderStatus[] | null) ?? null,
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
