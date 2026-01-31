"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useQuery } from "@urql/next";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

import {
  GetDashboardRevenueCompareDocument,
  RevenueGroupBy,
  type GetDashboardRevenueCompareQuery,
  type GetDashboardRevenueCompareQueryVariables,
} from "@/graphql/generated";

type RangeKey = "7d" | "30d" | "90d" | "12m" | "custom";

// ✅ formatters once
const NF_ILS = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" });
const NF_INT = new Intl.NumberFormat("he-IL");
const DF_DAY_MONTH = new Intl.DateTimeFormat("he-IL", { day: "2-digit", month: "2-digit" });
const DF_MONTH_YEAR = new Intl.DateTimeFormat("he-IL", { month: "short", year: "2-digit" });

function fmtILS(n: number) {
  return NF_ILS.format(n);
}
function fmtInt(n: number) {
  return NF_INT.format(n);
}
function percentChange(current: number, prev: number) {
  if (prev === 0) return current === 0 ? 0 : 100;
  return ((current - prev) / prev) * 100;
}

function toLocalDateInputValue(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function parseLocalDateInputValue(s: string) {
  return new Date(`${s}T00:00:00`);
}
function toSafeDate(v: unknown): Date | null {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildRangeFromParams(searchParams: ReadonlyURLSearchParams) {
  const range = (searchParams.get("range") as RangeKey | null) ?? "12m";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const now = new Date();
  let to = now;
  let from = new Date(now);

  if (range === "custom" && fromParam && toParam) {
    const fromLocal = parseLocalDateInputValue(fromParam);
    const toLocalEnd = new Date(`${toParam}T23:59:59.999`);
    if (!Number.isNaN(fromLocal.getTime()) && !Number.isNaN(toLocalEnd.getTime())) {
      from = fromLocal;
      to = toLocalEnd;
    }
  } else {
    if (range === "7d") from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === "30d") from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (range === "90d") from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    if (range === "12m") {
      from = new Date(now);
      from.setMonth(from.getMonth() - 12);
    }
  }

  const label =
    range === "7d"
      ? "7 ימים אחרונים"
      : range === "30d"
      ? "30 ימים אחרונים"
      : range === "90d"
      ? "90 ימים אחרונים"
      : range === "12m"
      ? "12 חודשים אחרונים"
      : "טווח מותאם";

  return { range, from, to, label };
}

function inferDefaultGroupBy(range: RangeKey): RevenueGroupBy {
  if (range === "12m") return RevenueGroupBy.Month;
  if (range === "90d") return RevenueGroupBy.Week;
  return RevenueGroupBy.Day;
}

// ✅ shape אמיתי של מה שאנחנו מציירים + משתמשים בטולטיפ
type ChartPoint = {
  label: string;
  revenue: number;
  orders: number;
  previousRevenue: number;
  previousOrders: number;
};

function CompareTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  const row = payload[0]?.payload as ChartPoint | undefined;
  if (!row) return null;

  const rev = row.revenue ?? 0;
  const ord = row.orders ?? 0;

  const prevRev = row.previousRevenue ?? 0;
  const prevOrd = row.previousOrders ?? 0;

  const revDelta = percentChange(rev, prevRev);
  const ordDelta = percentChange(ord, prevOrd);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-md text-xs">
      <div className="font-semibold text-slate-900">{label}</div>

      <div className="mt-2 space-y-1">
        <div className="flex items-center justify-between gap-8">
          <span className="text-slate-500">Revenue</span>
          <span className="font-medium text-slate-900">{fmtILS(rev)}</span>
        </div>
        <div className="flex items-center justify-between gap-8">
          <span className="text-slate-500">Prev revenue</span>
          <span className="text-slate-700">{fmtILS(prevRev)}</span>
        </div>
        <div className={`text-[11px] font-medium ${revDelta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
          Δ {Math.abs(revDelta).toFixed(1)}% {revDelta >= 0 ? "↑" : "↓"}
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
          <div className="flex items-center justify-between gap-8">
            <span className="text-slate-500">Orders</span>
            <span className="font-medium text-slate-900">{fmtInt(ord)}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-slate-500">Prev orders</span>
            <span className="text-slate-700">{fmtInt(prevOrd)}</span>
          </div>
          <div className={`text-[11px] font-medium ${ordDelta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
            Δ {Math.abs(ordDelta).toFixed(1)}% {ordDelta >= 0 ? "↑" : "↓"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SalesRevenueGraph() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { range, from, to, label } = useMemo(
    () => buildRangeFromParams(searchParams),
    [searchParams]
  );

  const groupBy = useMemo<RevenueGroupBy>(() => {
    const gb = searchParams.get("groupBy");
    if (gb === RevenueGroupBy.Day) return RevenueGroupBy.Day;
    if (gb === RevenueGroupBy.Week) return RevenueGroupBy.Week;
    if (gb === RevenueGroupBy.Month) return RevenueGroupBy.Month;
    return inferDefaultGroupBy(range);
  }, [searchParams, range]);

  const vars = useMemo<GetDashboardRevenueCompareQueryVariables>(
    () => ({
      from: from.toISOString(),
      to: to.toISOString(),
      groupBy,
    }),
    [from, to, groupBy]
  );

  const [{ data, fetching, error }, reexecute] = useQuery<
    GetDashboardRevenueCompareQuery,
    GetDashboardRevenueCompareQueryVariables
  >({
    query: GetDashboardRevenueCompareDocument,
    variables: vars,
    requestPolicy: "cache-first",
  });

  // ✅ toast de-dupe
  const lastErrRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error) return;
    if (lastErrRef.current === error.message) return;
    lastErrRef.current = error.message;
    toast.error(error.message);
  }, [error]);

  function mutateUrlParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    router.refresh(); // admin-style
  }

  // Custom range modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(() => toLocalDateInputValue(from));
  const [customTo, setCustomTo] = useState(() => toLocalDateInputValue(to));

  useEffect(() => {
    setCustomFrom(toLocalDateInputValue(from));
    setCustomTo(toLocalDateInputValue(to));
  }, [from, to]);

  function applyPreset(next: RangeKey) {
    if (next === "custom") return setIsModalOpen(true);
    mutateUrlParams({ range: next, from: null, to: null });
  }

  function applyCustom() {
    if (!customFrom || !customTo) return toast.error("בחר תאריך התחלה וסיום");
    if (customFrom > customTo) return toast.error("תאריך התחלה חייב להיות לפני תאריך הסיום");
    mutateUrlParams({ range: "custom", from: customFrom, to: customTo });
    setIsModalOpen(false);
    toast.success("טווח תאריכים עודכן");
  }

  function setGroupBy(next: RevenueGroupBy) {
    mutateUrlParams({ groupBy: String(next) });
  }

  function onRefresh() {
    reexecute({ requestPolicy: "network-only" });
    router.refresh();
    toast.success("רענון בוצע");
  }

  const compare = data?.getDashboardRevenueCompare;

  const prevFromSrv = toSafeDate(compare?.previousFrom);
  const prevToSrv = toSafeDate(compare?.previousTo);
  const prevRangeLabel =
    prevFromSrv && prevToSrv
      ? `${toLocalDateInputValue(prevFromSrv)} → ${toLocalDateInputValue(prevToSrv)}`
      : null;

  // ✅ no lint issue: points created inside useMemo
  const chartData = useMemo<ChartPoint[]>(() => {
    const points = compare?.points ?? [];
    const df = groupBy === RevenueGroupBy.Month ? DF_MONTH_YEAR : DF_DAY_MONTH;

    return points.map((p) => {
      const d = new Date(p.bucket as any);
      return {
        label: df.format(d),
        revenue: p.revenue ?? 0,
        orders: p.orders ?? 0,
        previousRevenue: p.previousRevenue ?? 0,
        previousOrders: p.previousOrders ?? 0,
      };
    });
  }, [compare, groupBy]);

  const totals = useMemo(() => {
    const totalRevenue = chartData.reduce((sum, x) => sum + (x.revenue || 0), 0);
    const totalOrders = chartData.reduce((sum, x) => sum + (x.orders || 0), 0);
    const avgPerBucket = chartData.length > 0 ? totalRevenue / chartData.length : 0;

    const prevTotalRevenue = chartData.reduce((sum, x) => sum + (x.previousRevenue || 0), 0);
    const prevTotalOrders = chartData.reduce((sum, x) => sum + (x.previousOrders || 0), 0);

    const revenueDelta = percentChange(totalRevenue, prevTotalRevenue);
    const ordersDelta = percentChange(totalOrders, prevTotalOrders);

    return {
      totalRevenue,
      totalOrders,
      avgPerBucket,
      prevTotalRevenue,
      prevTotalOrders,
      revenueDelta,
      ordersDelta,
    };
  }, [chartData]);

  const isEmpty = !fetching && chartData.length === 0;

  return (
    <div className="hidden lg:block bg-white shadow-md rounded-md">
      {/* Header */}
      <div className="flex flex-col justify-between md:flex-row items-center gap-3 py-5 px-6 md:px-12">
        <div className="flex flex-col">
          <div className="flex items-center gap-4">
            <p className="flex items-baseline">
              <span className="mt-1 mr-2 flex h-4 w-4 items-center justify-center rounded-full border border-green-500">
                <span className="block h-2 w-2 rounded-full bg-green-500"></span>
              </span>
              <span className="text-xs md:text-base">Revenue</span>
            </p>

            <p className="flex items-baseline">
              <span className="mt-1 mr-2 flex h-4 w-4 items-center justify-center rounded-full border border-indigo-500">
                <span className="block h-2 w-2 rounded-full bg-indigo-500"></span>
              </span>
              <span className="text-xs md:text-base">Prev Revenue</span>
            </p>

            <p className="flex items-baseline">
              <span className="mt-1 mr-2 flex h-4 w-4 items-center justify-center rounded-full border border-slate-500">
                <span className="block h-2 w-2 rounded-full bg-slate-500"></span>
              </span>
              <span className="text-xs md:text-base">Orders</span>
            </p>

            <p className="flex items-baseline">
              <span className="mt-1 mr-2 flex h-4 w-4 items-center justify-center rounded-full border border-slate-400">
                <span className="block h-2 w-2 rounded-full bg-slate-400"></span>
              </span>
              <span className="text-xs md:text-base">Prev Orders</span>
            </p>
          </div>

          <div className="mt-2 text-xs text-slate-500">
            טווח: <span className="font-medium text-slate-700">{label}</span>{" "}
            <span className="text-slate-400">•</span>{" "}
            <span className="text-slate-600">
              {toLocalDateInputValue(from)} → {toLocalDateInputValue(to)}
            </span>
            {prevRangeLabel ? (
              <>
                {" "}
                <span className="text-slate-400">•</span>{" "}
                <span className="text-slate-400">
                  השוואה: <span className="font-medium">{prevRangeLabel}</span>
                </span>
              </>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* GroupBy */}
          <div className="flex space-x-2 bg-slate-100 p-2 rounded-md text-xs">
            <button
              onClick={() => setGroupBy(RevenueGroupBy.Day)}
              className={
                groupBy === RevenueGroupBy.Day
                  ? "bg-white rounded-md py-1 px-3 shadow-sm"
                  : "py-1 px-3 text-slate-600 hover:text-slate-900"
              }
            >
              Day
            </button>
            <button
              onClick={() => setGroupBy(RevenueGroupBy.Week)}
              className={
                groupBy === RevenueGroupBy.Week
                  ? "bg-white rounded-md py-1 px-3 shadow-sm"
                  : "py-1 px-3 text-slate-600 hover:text-slate-900"
              }
            >
              Week
            </button>
            <button
              onClick={() => setGroupBy(RevenueGroupBy.Month)}
              className={
                groupBy === RevenueGroupBy.Month
                  ? "bg-white rounded-md py-1 px-3 shadow-sm"
                  : "py-1 px-3 text-slate-600 hover:text-slate-900"
              }
            >
              Month
            </button>
          </div>

          {/* Range Presets */}
          <div className="flex gap-2">
            <button
              onClick={() => applyPreset("7d")}
              className={`px-3 py-2 text-xs rounded-md border ${
                range === "7d"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              7d
            </button>
            <button
              onClick={() => applyPreset("30d")}
              className={`px-3 py-2 text-xs rounded-md border ${
                range === "30d"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              30d
            </button>
            <button
              onClick={() => applyPreset("90d")}
              className={`px-3 py-2 text-xs rounded-md border ${
                range === "90d"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              90d
            </button>
            <button
              onClick={() => applyPreset("12m")}
              className={`px-3 py-2 text-xs rounded-md border ${
                range === "12m"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white border-slate-200 text-slate-700"
              }`}
            >
              12m
            </button>
            <button
              onClick={() => applyPreset("custom")}
              className="px-3 py-2 text-xs rounded-md border bg-white border-slate-200 text-slate-700"
            >
              Custom
            </button>
            <button
              onClick={onRefresh}
              className="px-3 py-2 text-xs rounded-md border bg-white border-slate-200 text-slate-700"
            >
              {fetching ? "..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 md:px-12 pb-4 grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="text-slate-500">סה״כ הכנסות</div>
          <div className="mt-1 font-semibold text-slate-900">
            {fetching && !data ? "…" : fmtILS(totals.totalRevenue)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Prev: {fmtILS(totals.prevTotalRevenue)}{" "}
            <span className={`font-medium ${totals.revenueDelta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              (Δ {Math.abs(totals.revenueDelta).toFixed(1)}% {totals.revenueDelta >= 0 ? "↑" : "↓"})
            </span>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="text-slate-500">סה״כ הזמנות</div>
          <div className="mt-1 font-semibold text-slate-900">
            {fetching && !data ? "…" : fmtInt(totals.totalOrders)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Prev: {fmtInt(totals.prevTotalOrders)}{" "}
            <span className={`font-medium ${totals.ordersDelta >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
              (Δ {Math.abs(totals.ordersDelta).toFixed(1)}% {totals.ordersDelta >= 0 ? "↑" : "↓"})
            </span>
          </div>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="text-slate-500">ממוצע לכל נקודה</div>
          <div className="mt-1 font-semibold text-slate-900">
            {fetching && !data ? "…" : fmtILS(totals.avgPerBucket)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-96 px-2 pb-6">
        {isEmpty ? (
          <div className="h-full w-full flex flex-col items-center justify-center text-slate-500">
            <div className="text-sm font-medium">אין נתונים להצגה בטווח הזה.</div>
            <div className="text-xs mt-1">נסה טווח אחר או בדוק שיש הזמנות בתקופה.</div>
          </div>
        ) : (
          <ResponsiveContainer>
            <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="55%" stopColor="#22c55e" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prevRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="55%" stopColor="#6366f1" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="orders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="55%" stopColor="#94a3b8" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="prevOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="55%" stopColor="#64748b" stopOpacity={0.14} />
                  <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis dataKey="label" scale="band" />
              <YAxis />
              <Tooltip content={<CompareTooltip />} />
              <Legend />

              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#22c55e" fill="url(#revenue)" />
              <Area type="monotone" dataKey="previousRevenue" name="Prev Revenue" stroke="#6366f1" strokeDasharray="6 4" fill="url(#prevRevenue)" />
              <Area type="monotone" dataKey="orders" name="Orders" stroke="#94a3b8" fill="url(#orders)" />
              <Area type="monotone" dataKey="previousOrders" name="Prev Orders" stroke="#64748b" strokeDasharray="6 4" fill="url(#prevOrders)" />

              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Modal: custom range */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Custom Range</h3>
                <p className="text-sm text-slate-500">בחר טווח לגרף</p>
              </div>
              <button
                className="px-3 py-1 text-sm rounded-md border border-slate-200"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md px-4 py-2 text-sm border border-slate-200 bg-white text-slate-700"
                >
                  Cancel
                </button>
                <button
                  onClick={applyCustom}
                  className="rounded-md px-4 py-2 text-sm bg-slate-900 text-white"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
