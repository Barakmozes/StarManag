import { builder } from "../../builder";
import prisma from "../../../lib/prisma";
import { OrderStatus, Prisma, Role } from "@prisma/client";
import { RevenueGroupByEnum } from "./enum";

/* ---------------------------------------------
 * Types (Output Shapes)
 * -------------------------------------------- */

type DashboardKpisShape = {
  grossRevenue: number;
  ordersCount: number;
  completedOrders: number;
  canceledOrders: number;
  avgOrderValue: number;

  menusCount: number;
  categoriesCount: number;
  tablesCount: number;
  usersCount: number;

  uniqueCustomers: number;
  newCustomers: number;
};

type DashboardKpisCompareShape = {
  currentFrom: Date;
  currentTo: Date;
  previousFrom: Date;
  previousTo: Date;
  current: DashboardKpisShape;
  previous: DashboardKpisShape;
};

type DashboardRevenuePointShape = {
  bucket: Date;
  revenue: number;
  orders: number;
};

type DashboardRevenueComparePointShape = {
  bucket: Date;
  revenue: number;
  orders: number;

  previousBucket: Date | null;
  previousRevenue: number;
  previousOrders: number;
};

type DashboardRevenueCompareShape = {
  currentFrom: Date;
  currentTo: Date;
  previousFrom: Date;
  previousTo: Date;
  points: DashboardRevenueComparePointShape[];
};

/* ---------------------------------------------
 * Helpers
 * -------------------------------------------- */

function asDate(v: unknown): Date {
  if (v instanceof Date) return v;
  const d = new Date(v as any);
  if (Number.isNaN(d.getTime())) throw new Error("Invalid DateTime argument");
  return d;
}

function assertDashboardRole(role?: Role | null) {
  if (role !== Role.ADMIN && role !== Role.MANAGER) {
    throw new Error("Not authorized");
  }
}

/* ---------------------------------------------
 * GraphQL Object Refs (Pothos)
 * -------------------------------------------- */

const DashboardKpisRef = builder.objectRef<DashboardKpisShape>("DashboardKpis").implement({
  fields: (t) => ({
    grossRevenue: t.float({ resolve: (p) => p.grossRevenue }),
    ordersCount: t.int({ resolve: (p) => p.ordersCount }),
    completedOrders: t.int({ resolve: (p) => p.completedOrders }),
    canceledOrders: t.int({ resolve: (p) => p.canceledOrders }),
    avgOrderValue: t.float({ resolve: (p) => p.avgOrderValue }),

    menusCount: t.int({ resolve: (p) => p.menusCount }),
    categoriesCount: t.int({ resolve: (p) => p.categoriesCount }),
    tablesCount: t.int({ resolve: (p) => p.tablesCount }),
    usersCount: t.int({ resolve: (p) => p.usersCount }),

    uniqueCustomers: t.int({ resolve: (p) => p.uniqueCustomers }),
    newCustomers: t.int({ resolve: (p) => p.newCustomers }),
  }),
});

const DashboardKpisCompareRef = builder
  .objectRef<DashboardKpisCompareShape>("DashboardKpisCompare")
  .implement({
    fields: (t) => ({
      currentFrom: t.field({ type: "DateTime", resolve: (p) => p.currentFrom }),
      currentTo: t.field({ type: "DateTime", resolve: (p) => p.currentTo }),
      previousFrom: t.field({ type: "DateTime", resolve: (p) => p.previousFrom }),
      previousTo: t.field({ type: "DateTime", resolve: (p) => p.previousTo }),
      current: t.field({ type: DashboardKpisRef, resolve: (p) => p.current }),
      previous: t.field({ type: DashboardKpisRef, resolve: (p) => p.previous }),
    }),
  });

const DashboardRevenuePointRef = builder
  .objectRef<DashboardRevenuePointShape>("DashboardRevenuePoint")
  .implement({
    fields: (t) => ({
      bucket: t.field({ type: "DateTime", resolve: (p) => p.bucket }),
      revenue: t.float({ resolve: (p) => p.revenue }),
      orders: t.int({ resolve: (p) => p.orders }),
    }),
  });

const DashboardRevenueComparePointRef = builder
  .objectRef<DashboardRevenueComparePointShape>("DashboardRevenueComparePoint")
  .implement({
    fields: (t) => ({
      bucket: t.field({ type: "DateTime", resolve: (p) => p.bucket }),
      revenue: t.float({ resolve: (p) => p.revenue }),
      orders: t.int({ resolve: (p) => p.orders }),

      previousBucket: t.field({
        type: "DateTime",
        nullable: true,
        resolve: (p) => p.previousBucket,
      }),
      previousRevenue: t.float({ resolve: (p) => p.previousRevenue }),
      previousOrders: t.int({ resolve: (p) => p.previousOrders }),
    }),
  });

const DashboardRevenueCompareRef = builder
  .objectRef<DashboardRevenueCompareShape>("DashboardRevenueCompare")
  .implement({
    fields: (t) => ({
      currentFrom: t.field({ type: "DateTime", resolve: (p) => p.currentFrom }),
      currentTo: t.field({ type: "DateTime", resolve: (p) => p.currentTo }),
      previousFrom: t.field({ type: "DateTime", resolve: (p) => p.previousFrom }),
      previousTo: t.field({ type: "DateTime", resolve: (p) => p.previousTo }),
      points: t.field({
        type: [DashboardRevenueComparePointRef],
        resolve: (p) => p.points,
      }),
    }),
  });

/* ---------------------------------------------
 * SQL #1: KPIs (Current + Previous) in ONE query
 * -------------------------------------------- */

type OrdersAggRow = {
  current_revenue: number;
  current_orders: number;
  current_cancelled: number;
  current_completed: number;
  current_unique_customers: number;
  current_new_customers: number;

  previous_revenue: number;
  previous_orders: number;
  previous_cancelled: number;
  previous_completed: number;
  previous_unique_customers: number;
  previous_new_customers: number;
};

async function fetchOrdersKpisCompareFast(args: {
  currentFrom: Date;
  currentTo: Date;
  previousFrom: Date;
  previousTo: Date;
}): Promise<OrdersAggRow> {
  const { currentFrom, currentTo, previousFrom, previousTo } = args;

  const rows = await prisma.$queryRaw<OrdersAggRow[]>(Prisma.sql`
    WITH
      orders_scoped AS (
        SELECT "orderDate", "status", "total", "userEmail"
        FROM "Order"
        WHERE "orderDate" >= ${previousFrom}
          AND "orderDate" <= ${currentTo}
      ),
      first_orders AS (
        SELECT "userEmail", MIN("orderDate") AS first_order_date
        FROM "Order"
        WHERE "status" <> 'CANCELLED'::"OrderStatus"
          AND "orderDate" <= ${currentTo}
        GROUP BY "userEmail"
      )
    SELECT
      /* CURRENT */
      COALESCE(SUM(
        CASE
          WHEN o."orderDate" >= ${currentFrom}
           AND o."orderDate" <= ${currentTo}
           AND o."status" <> 'CANCELLED'::"OrderStatus"
          THEN o."total" ELSE 0
        END
      ), 0)::float8 AS current_revenue,

      COUNT(*) FILTER (
        WHERE o."orderDate" >= ${currentFrom}
          AND o."orderDate" <= ${currentTo}
          AND o."status" <> 'CANCELLED'::"OrderStatus"
      )::int AS current_orders,

      COUNT(*) FILTER (
        WHERE o."orderDate" >= ${currentFrom}
          AND o."orderDate" <= ${currentTo}
          AND o."status" = 'CANCELLED'::"OrderStatus"
      )::int AS current_cancelled,

      COUNT(*) FILTER (
        WHERE o."orderDate" >= ${currentFrom}
          AND o."orderDate" <= ${currentTo}
          AND o."status" IN (
            'COMPLETED'::"OrderStatus",
            'DELIVERED'::"OrderStatus",
            'SERVED'::"OrderStatus"
          )
      )::int AS current_completed,

      COUNT(DISTINCT o."userEmail") FILTER (
        WHERE o."orderDate" >= ${currentFrom}
          AND o."orderDate" <= ${currentTo}
          AND o."status" <> 'CANCELLED'::"OrderStatus"
      )::int AS current_unique_customers,

      (
        SELECT COUNT(*)::int
        FROM first_orders fo
        WHERE fo.first_order_date >= ${currentFrom}
          AND fo.first_order_date <= ${currentTo}
      ) AS current_new_customers,

      /* PREVIOUS */
      COALESCE(SUM(
        CASE
          WHEN o."orderDate" >= ${previousFrom}
           AND o."orderDate" <= ${previousTo}
           AND o."status" <> 'CANCELLED'::"OrderStatus"
          THEN o."total" ELSE 0
        END
      ), 0)::float8 AS previous_revenue,

      COUNT(*) FILTER (
        WHERE o."orderDate" >= ${previousFrom}
          AND o."orderDate" <= ${previousTo}
          AND o."status" <> 'CANCELLED'::"OrderStatus"
      )::int AS previous_orders,

      COUNT(*) FILTER (
        WHERE o."orderDate" >= ${previousFrom}
          AND o."orderDate" <= ${previousTo}
          AND o."status" = 'CANCELLED'::"OrderStatus"
      )::int AS previous_cancelled,

      COUNT(*) FILTER (
        WHERE o."orderDate" >= ${previousFrom}
          AND o."orderDate" <= ${previousTo}
          AND o."status" IN (
            'COMPLETED'::"OrderStatus",
            'DELIVERED'::"OrderStatus",
            'SERVED'::"OrderStatus"
          )
      )::int AS previous_completed,

      COUNT(DISTINCT o."userEmail") FILTER (
        WHERE o."orderDate" >= ${previousFrom}
          AND o."orderDate" <= ${previousTo}
          AND o."status" <> 'CANCELLED'::"OrderStatus"
      )::int AS previous_unique_customers,

      (
        SELECT COUNT(*)::int
        FROM first_orders fo
        WHERE fo.first_order_date >= ${previousFrom}
          AND fo.first_order_date <= ${previousTo}
      ) AS previous_new_customers

    FROM orders_scoped o;
  `);

  return (
    rows[0] ?? {
      current_revenue: 0,
      current_orders: 0,
      current_cancelled: 0,
      current_completed: 0,
      current_unique_customers: 0,
      current_new_customers: 0,
      previous_revenue: 0,
      previous_orders: 0,
      previous_cancelled: 0,
      previous_completed: 0,
      previous_unique_customers: 0,
      previous_new_customers: 0,
    }
  );
}

/* ---------------------------------------------
 * SQL #2: Revenue chart + compare in ONE query
 *  - generate_series for full buckets (zeros included)
 *  - aligns previous by idx
 * -------------------------------------------- */

type RevenueCompareRow = {
  idx: number;
  bucket: Date;
  revenue: number;
  orders: number;
  previous_bucket: Date | null;
  previous_revenue: number;
  previous_orders: number;
};

async function fetchRevenueCompareSeriesOneSQL(args: {
  currentFrom: Date;
  currentTo: Date;
  previousFrom: Date;
  previousTo: Date;
  groupBy: "DAY" | "WEEK" | "MONTH";
}): Promise<DashboardRevenueComparePointShape[]> {
  const { currentFrom, currentTo, previousFrom, previousTo, groupBy } = args;

  const truncUnit = groupBy === "DAY" ? "day" : groupBy === "WEEK" ? "week" : "month";
  const step = groupBy === "DAY" ? "1 day" : groupBy === "WEEK" ? "1 week" : "1 month";

  const rows = await prisma.$queryRaw<RevenueCompareRow[]>(Prisma.sql`
    WITH
      cur_bounds AS (
        SELECT
          date_trunc(${truncUnit}, ${currentFrom}::timestamp) AS start_bucket,
          date_trunc(${truncUnit}, ${currentTo}::timestamp) AS end_bucket
      ),
      prev_bounds AS (
        SELECT
          date_trunc(${truncUnit}, ${previousFrom}::timestamp) AS start_bucket,
          date_trunc(${truncUnit}, ${previousTo}::timestamp) AS end_bucket
      ),

      cur_buckets AS (
        SELECT generate_series(
          (SELECT start_bucket FROM cur_bounds),
          (SELECT end_bucket FROM cur_bounds),
          ${step}::interval
        ) AS bucket
      ),
      prev_buckets AS (
        SELECT generate_series(
          (SELECT start_bucket FROM prev_bounds),
          (SELECT end_bucket FROM prev_bounds),
          ${step}::interval
        ) AS bucket
      ),

      cur_agg AS (
        SELECT
          date_trunc(${truncUnit}, "orderDate") AS bucket,
          COALESCE(SUM("total"), 0)::float8 AS revenue,
          COUNT(*)::int AS orders
        FROM "Order"
        WHERE "orderDate" >= ${currentFrom}
          AND "orderDate" <= ${currentTo}
          AND "status" <> 'CANCELLED'::"OrderStatus"
        GROUP BY 1
      ),
      prev_agg AS (
        SELECT
          date_trunc(${truncUnit}, "orderDate") AS bucket,
          COALESCE(SUM("total"), 0)::float8 AS revenue,
          COUNT(*)::int AS orders
        FROM "Order"
        WHERE "orderDate" >= ${previousFrom}
          AND "orderDate" <= ${previousTo}
          AND "status" <> 'CANCELLED'::"OrderStatus"
        GROUP BY 1
      ),

      cur_series AS (
        SELECT
          row_number() OVER (ORDER BY b.bucket)::int AS idx,
          b.bucket AS bucket,
          COALESCE(a.revenue, 0)::float8 AS revenue,
          COALESCE(a.orders, 0)::int AS orders
        FROM cur_buckets b
        LEFT JOIN cur_agg a ON a.bucket = b.bucket
      ),
      prev_series AS (
        SELECT
          row_number() OVER (ORDER BY b.bucket)::int AS idx,
          b.bucket AS bucket,
          COALESCE(a.revenue, 0)::float8 AS revenue,
          COALESCE(a.orders, 0)::int AS orders
        FROM prev_buckets b
        LEFT JOIN prev_agg a ON a.bucket = b.bucket
      )

    SELECT
      c.idx,
      c.bucket,
      c.revenue,
      c.orders,
      p.bucket AS previous_bucket,
      COALESCE(p.revenue, 0)::float8 AS previous_revenue,
      COALESCE(p.orders, 0)::int AS previous_orders
    FROM cur_series c
    LEFT JOIN prev_series p ON p.idx = c.idx
    ORDER BY c.idx;
  `);

  return rows.map((r) => ({
    bucket: r.bucket,
    revenue: Number(r.revenue ?? 0),
    orders: Number(r.orders ?? 0),
    previousBucket: r.previous_bucket ?? null,
    previousRevenue: Number(r.previous_revenue ?? 0),
    previousOrders: Number(r.previous_orders ?? 0),
  }));
}

/* ---------------------------------------------
 * Query Fields
 * -------------------------------------------- */

builder.queryFields((t) => ({
  // KPI for a single range (returns current window KPIs)
  getDashboardKpis: t.field({
    type: DashboardKpisRef,
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const ctxVal = await ctx;
      assertDashboardRole(ctxVal?.user?.role);

      const currentFrom = asDate(args.from);
      const currentTo = asDate(args.to);

      // derive a previous range (needed by our compare SQL helper)
      const durationMs = currentTo.getTime() - currentFrom.getTime();
      const previousTo = new Date(currentFrom.getTime() - 1);
      const previousFrom = new Date(previousTo.getTime() - durationMs);

      const [menusCount, categoriesCount, tablesCount, usersCount, agg] = await Promise.all([
        prisma.menu.count(),
        prisma.category.count(),
        prisma.table.count(),
        prisma.user.count(),
        fetchOrdersKpisCompareFast({ currentFrom, currentTo, previousFrom, previousTo }),
      ]);

      const grossRevenue = agg.current_revenue ?? 0;
      const ordersCount = agg.current_orders ?? 0;

      return {
        grossRevenue,
        ordersCount,
        completedOrders: agg.current_completed ?? 0,
        canceledOrders: agg.current_cancelled ?? 0,
        avgOrderValue: ordersCount > 0 ? grossRevenue / ordersCount : 0,

        uniqueCustomers: agg.current_unique_customers ?? 0,
        newCustomers: agg.current_new_customers ?? 0,

        menusCount,
        categoriesCount,
        tablesCount,
        usersCount,
      };
    },
  }),

  // KPI Compare (current + previous) — fastest (SQL one-shot)
  getDashboardKpisCompare: t.field({
    type: DashboardKpisCompareRef,
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const ctxVal = await ctx;
      assertDashboardRole(ctxVal?.user?.role);

      const currentFrom = asDate(args.from);
      const currentTo = asDate(args.to);

      const durationMs = currentTo.getTime() - currentFrom.getTime();
      const previousTo = new Date(currentFrom.getTime() - 1);
      const previousFrom = new Date(previousTo.getTime() - durationMs);

      const [menusCount, categoriesCount, tablesCount, usersCount, agg] = await Promise.all([
        prisma.menu.count(),
        prisma.category.count(),
        prisma.table.count(),
        prisma.user.count(),
        fetchOrdersKpisCompareFast({ currentFrom, currentTo, previousFrom, previousTo }),
      ]);

      const currentRevenue = agg.current_revenue ?? 0;
      const currentOrders = agg.current_orders ?? 0;

      const previousRevenue = agg.previous_revenue ?? 0;
      const previousOrders = agg.previous_orders ?? 0;

      const current: DashboardKpisShape = {
        grossRevenue: currentRevenue,
        ordersCount: currentOrders,
        completedOrders: agg.current_completed ?? 0,
        canceledOrders: agg.current_cancelled ?? 0,
        avgOrderValue: currentOrders > 0 ? currentRevenue / currentOrders : 0,

        uniqueCustomers: agg.current_unique_customers ?? 0,
        newCustomers: agg.current_new_customers ?? 0,

        menusCount,
        categoriesCount,
        tablesCount,
        usersCount,
      };

      const previous: DashboardKpisShape = {
        grossRevenue: previousRevenue,
        ordersCount: previousOrders,
        completedOrders: agg.previous_completed ?? 0,
        canceledOrders: agg.previous_cancelled ?? 0,
        avgOrderValue: previousOrders > 0 ? previousRevenue / previousOrders : 0,

        uniqueCustomers: agg.previous_unique_customers ?? 0,
        newCustomers: agg.previous_new_customers ?? 0,

        menusCount,
        categoriesCount,
        tablesCount,
        usersCount,
      };

      return {
        currentFrom,
        currentTo,
        previousFrom,
        previousTo,
        current,
        previous,
      };
    },
  }),

  // Revenue chart (current only)
  getDashboardRevenue: t.field({
    type: [DashboardRevenuePointRef],
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
      groupBy: t.arg({ type: RevenueGroupByEnum, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const ctxVal = await ctx;
      assertDashboardRole(ctxVal?.user?.role);

      const from = asDate(args.from);
      const to = asDate(args.to);

      const unit = args.groupBy === "DAY" ? "day" : args.groupBy === "WEEK" ? "week" : "month";

      const rows = await prisma.$queryRaw<Array<{ bucket: Date; revenue: number; orders: number }>>(
        Prisma.sql`
          SELECT
            date_trunc(${unit}, "orderDate") AS bucket,
            COALESCE(SUM("total"), 0)::float8 AS revenue,
            COUNT(*)::int AS orders
          FROM "Order"
          WHERE "orderDate" >= ${from}
            AND "orderDate" <= ${to}
            AND "status" <> 'CANCELLED'::"OrderStatus"
          GROUP BY 1
          ORDER BY 1
        `
      );

      return rows.map((r) => ({
        bucket: r.bucket,
        revenue: Number(r.revenue ?? 0),
        orders: Number(r.orders ?? 0),
      }));
    },
  }),

  // Revenue chart + compare (current + previous) — ONE SQL query
  getDashboardRevenueCompare: t.field({
    type: DashboardRevenueCompareRef,
    args: {
      from: t.arg({ type: "DateTime", required: true }),
      to: t.arg({ type: "DateTime", required: true }),
      groupBy: t.arg({ type: RevenueGroupByEnum, required: true }),
    },
    resolve: async (_root, args, ctx) => {
      const ctxVal = await ctx;
      assertDashboardRole(ctxVal?.user?.role);

      const currentFrom = asDate(args.from);
      const currentTo = asDate(args.to);

      const durationMs = currentTo.getTime() - currentFrom.getTime();
      const previousTo = new Date(currentFrom.getTime() - 1);
      const previousFrom = new Date(previousTo.getTime() - durationMs);

      const points = await fetchRevenueCompareSeriesOneSQL({
        currentFrom,
        currentTo,
        previousFrom,
        previousTo,
        groupBy: args.groupBy as "DAY" | "WEEK" | "MONTH",
      });

      return {
        currentFrom,
        currentTo,
        previousFrom,
        previousTo,
        points,
      };
    },
  }),
}));
