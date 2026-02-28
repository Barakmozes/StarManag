"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { HiArrowSmDown, HiArrowSmUp } from "react-icons/hi";
import { HiOutlineCurrencyDollar, HiOutlineUserGroup } from "react-icons/hi2";
import { BiWalk } from "react-icons/bi";
import { VscLayoutMenubar } from "react-icons/vsc";

import toast from "react-hot-toast";
import {
  ReadonlyURLSearchParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { useQuery } from "@urql/next";

import {
  GetDashboardKpisCompareDocument,
  type GetDashboardKpisCompareQuery,
  type GetDashboardKpisCompareQueryVariables,
} from "@/graphql/generated";

type RangeKey = "7d" | "30d" | "90d" | "12m" | "custom";

// ✅ Create formatters once (faster renders)
const NF_ILS = new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS" });
const NF_INT = new Intl.NumberFormat("he-IL");

function fmtILS(n: number) {
  return NF_ILS.format(n);
}
function fmtInt(n: number) {
  return NF_INT.format(n);
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
function percentChange(current: number, prev: number) {
  if (prev === 0) return current === 0 ? 0 : 100;
  return ((current - prev) / prev) * 100;
}

function buildRangeFromParams(searchParams: ReadonlyURLSearchParams) {
  const range = (searchParams.get("range") as RangeKey | null) ?? "30d";
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

  return { range, from, to };
}

export default function TotalCards() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { range, from, to } = useMemo(
    () => buildRangeFromParams(searchParams),
    [searchParams]
  );

  const vars = useMemo<GetDashboardKpisCompareQueryVariables>(
    () => ({ from: from.toISOString(), to: to.toISOString() }),
    [from, to]
  );

  const [{ data, fetching, error }, reexecute] = useQuery<
    GetDashboardKpisCompareQuery,
    GetDashboardKpisCompareQueryVariables
  >({
    query: GetDashboardKpisCompareDocument,
    variables: vars,
    requestPolicy: "cache-first",
  });

  // ✅ Toast de-dupe
  const lastErrRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error) return;
    if (lastErrRef.current === error.message) return;
    lastErrRef.current = error.message;
    toast.error(error.message);
  }, [error]);

  function mutateUrlParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    for (const [key, value] of Object.entries(updates)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    router.refresh();
  }

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

  function onRefresh() {
    reexecute({ requestPolicy: "network-only" });
    router.refresh();
    toast.success("רענון בוצע");
  }

  const compare = data?.getDashboardKpisCompare;
  const k = compare?.current;
  const pk = compare?.previous;

  const prevFromSrv = toSafeDate(compare?.previousFrom);
  const prevToSrv = toSafeDate(compare?.previousTo);
  const prevRangeLabel =
    prevFromSrv && prevToSrv
      ? `${toLocalDateInputValue(prevFromSrv)} → ${toLocalDateInputValue(prevToSrv)}`
      : null;

  const showSkeleton = fetching && !k;

  const totals = useMemo(() => {
    const grossRevenue = k?.grossRevenue ?? 0;
    const ordersCount = k?.ordersCount ?? 0;
    const avgOrderValue = k?.avgOrderValue ?? 0;
    const uniqueCustomers = k?.uniqueCustomers ?? 0;

    const menusCount = k?.menusCount ?? 0;
    const usersCount = k?.usersCount ?? 0;

    const prevRevenue = pk?.grossRevenue ?? 0;
    const prevOrders = pk?.ordersCount ?? 0;
    const prevAvg = pk?.avgOrderValue ?? 0;
    const prevUnique = pk?.uniqueCustomers ?? 0;

    const deltaTitle = prevRangeLabel
      ? `השוואה לטווח קודם: ${prevRangeLabel}`
      : "השוואה לתקופה קודמת באותו אורך";

    return [
      {
        title: "Total Orders",
        total: fmtInt(ordersCount),
        percentage: percentChange(ordersCount, prevOrders),
        icon: BiWalk,
        deltaTitle,
      },
      {
        title: "Total Revenue",
        total: fmtILS(grossRevenue),
        percentage: percentChange(grossRevenue, prevRevenue),
        icon: HiOutlineCurrencyDollar,
        deltaTitle,
      },
      {
        title: "Avg Order Value",
        total: fmtILS(avgOrderValue),
        percentage: percentChange(avgOrderValue, prevAvg),
        icon: VscLayoutMenubar,
        deltaTitle,
      },
      {
        title: "Unique Customers",
        total: fmtInt(uniqueCustomers),
        percentage: percentChange(uniqueCustomers, prevUnique),
        icon: HiOutlineUserGroup,
        deltaTitle,
      },
      {
        title: "Menus",
        total: fmtInt(menusCount),
        percentage: 0,
        icon: VscLayoutMenubar,
        noDelta: true,
      },
      {
        title: "Registered Users",
        total: fmtInt(usersCount),
        percentage: 0,
        icon: HiOutlineUserGroup,
        noDelta: true,
      },
    ] as Array<{
      title: string;
      total: string;
      percentage: number;
      icon: any;
      noDelta?: boolean;
      deltaTitle?: string;
    }>;
  }, [k, pk, prevRangeLabel]);

  return (
    <section className="py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full items-center gap-2 overflow-x-auto pb-1 scrollbar-hide sm:flex-wrap sm:overflow-visible">
          <button
            type="button"
            onClick={() => applyPreset("7d")}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-xs ${
              range === "7d"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            7d
          </button>
          <button
            type="button"
            onClick={() => applyPreset("30d")}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-xs ${
              range === "30d"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            30d
          </button>
          <button
            type="button"
            onClick={() => applyPreset("90d")}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-xs ${
              range === "90d"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            90d
          </button>
          <button
            type="button"
            onClick={() => applyPreset("12m")}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-md border px-3 py-2 text-xs ${
              range === "12m"
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            12m
          </button>
          <button
            type="button"
            onClick={() => applyPreset("custom")}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-md border bg-white border-slate-200 px-3 py-2 text-xs text-slate-700"
          >
            Custom
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center whitespace-nowrap rounded-md border bg-white border-slate-200 px-3 py-2 text-xs text-slate-700"
          >
            {fetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="text-xs text-slate-500 sm:text-right">
          <div>
            Range:{" "}
            <span className="font-medium text-slate-700">
              {toLocalDateInputValue(from)} → {toLocalDateInputValue(to)}
            </span>
          </div>
          {prevRangeLabel ? (
            <div className="mt-1 text-slate-400">
              Compare: <span className="font-medium">{prevRangeLabel}</span>
            </div>
          ) : null}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {totals.map((t) => (
          <div className="rounded-md bg-white p-4 shadow-md" key={t.title}>
            <div
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-green-600"
              aria-hidden="true"
            >
              {React.createElement(t.icon, { size: 24 })}
            </div>

            <h2 className="py-2 text-2xl font-semibold">
              {showSkeleton ? (
                <span className="inline-block h-7 w-32 animate-pulse rounded bg-slate-100" />
              ) : (
                t.total
              )}
            </h2>

            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-slate-500">{t.title}</p>

              {t.noDelta ? (
                <p className="text-sm text-slate-400">—</p>
              ) : (
                <p className="flex shrink-0 items-center text-sm" title={t.deltaTitle}>
                  <span>{Math.abs(t.percentage).toFixed(1)}%</span>
                  {t.percentage >= 0 ? (
                    <HiArrowSmUp className="mb-1 text-green-500" size={22} />
                  ) : (
                    <HiArrowSmDown className="mb-1 text-red-500" size={22} />
                  )}
                </p>
              )}
            </div>
          </div>
        ))}
      </section>

      {/* Modal: custom range */}
      {isModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-4 sm:items-center">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-t-xl border border-slate-200 bg-white shadow-xl sm:rounded-xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Custom Range</h3>
                <p className="text-sm text-slate-500">בחר טווח תאריכים לקלפים</p>
              </div>
              <button
                type="button"
                className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-slate-200 px-3 text-sm"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="space-y-4 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">From</label>
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">To</label>
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyCustom}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
