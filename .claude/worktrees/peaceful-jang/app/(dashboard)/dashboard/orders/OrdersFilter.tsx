"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { HiChevronDown, HiXMark } from "react-icons/hi2";
import { OrderStatus } from "@/graphql/generated";

const STATUS_OPTIONS: { label: string; value: OrderStatus }[] = [
  { label: "Preparing", value: OrderStatus.Preparing },
  { label: "Pending", value: OrderStatus.Pending },
  { label: "Ready", value: OrderStatus.Ready },
  { label: "Collected", value: OrderStatus.Collected },
  { label: "Delivered", value: OrderStatus.Delivered },
  { label: "Served", value: OrderStatus.Served },
  { label: "Completed", value: OrderStatus.Completed },
  { label: "Cancelled", value: OrderStatus.Cancelled },
  { label: "Unassigned", value: OrderStatus.Unassigned },
];

function parseStatusList(raw: string | null): OrderStatus[] {
  if (!raw) return [];

  // canonical enum values are usually PascalCase (e.g. "Preparing"), not "PREPARING"
  const values = Object.values(OrderStatus) as string[];
  const byUpper = new Map(values.map((v) => [v.toUpperCase(), v]));

  const parts = raw
    .split(/[,\s]+/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const out: OrderStatus[] = [];
  for (const p of parts) {
    const canonical = byUpper.get(p.toUpperCase());
    if (!canonical) continue;
    const v = canonical as OrderStatus;
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

function parsePaid(raw: string | null): boolean | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes"].includes(v)) return true;
  if (["0", "false", "no"].includes(v)) return false;
  return null;
}

export default function OrdersFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  // ✅ derive values from URL (memoized) — depend on `sp` directly (fixes ESLint warnings)
  const qFromUrl = useMemo(() => (sp.get("q") ?? "").trim(), [sp]);

  const statusFromUrl = useMemo(() => {
    // supports both: ?status=a,b  AND  ?status=a&status=b
    const all = sp.getAll("status");
    const raw = all.length > 1 ? all.join(",") : sp.get("status");
    return parseStatusList(raw);
  }, [sp]);

  const paidFromUrl = useMemo(() => parsePaid(sp.get("paid")), [sp]);

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [q, setQ] = useState(qFromUrl);
  const [stagedStatus, setStagedStatus] = useState<OrderStatus[]>(statusFromUrl);
  const [stagedPaid, setStagedPaid] = useState<boolean | null>(paidFromUrl);

  // keep staged state in sync with URL changes (back/forward, link navigation, etc.)
  useEffect(() => setQ(qFromUrl), [qFromUrl]);
  useEffect(() => setStagedStatus(statusFromUrl), [statusFromUrl]);
  useEffect(() => setStagedPaid(paidFromUrl), [paidFromUrl]);

  // close dropdown on outside click
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (wrapperRef.current.contains(e.target as Node)) return;
      setIsOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const mutateUrlParams = useCallback(
    (updates: Record<string, string | null>, refresh = false) => {
      // clone current params
      const params = new URLSearchParams(Array.from(sp.entries()));

      // reset cursor paging when filters change
      params.delete("after");
      params.delete("before");

      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === undefined || v === "") params.delete(k);
        else params.set(k, v);
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      if (refresh) router.refresh();
    },
    [router, pathname, sp]
  );

  // debounce q changes
  useEffect(() => {
    const t = setTimeout(() => {
      const next = q.trim();
      mutateUrlParams({ q: next ? next : null }, false);
    }, 350);

    return () => clearTimeout(t);
  }, [q, mutateUrlParams]);

  const activeCount = useMemo(
    () => Number(Boolean(qFromUrl)) + Number(statusFromUrl.length > 0) + Number(paidFromUrl !== null),
    [qFromUrl, statusFromUrl.length, paidFromUrl]
  );

  const toggleStatus = useCallback((v: OrderStatus) => {
    setStagedStatus((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
  }, []);

  const applyFilters = useCallback(() => {
    mutateUrlParams(
      {
        status: stagedStatus.length ? stagedStatus.join(",") : null,
        paid: stagedPaid === null ? null : String(stagedPaid),
      },
      true
    );
    setIsOpen(false);
    toast.success("Filters applied");
  }, [mutateUrlParams, stagedStatus, stagedPaid]);

  const clearAll = useCallback(() => {
    setQ("");
    setStagedStatus([]);
    setStagedPaid(null);
    mutateUrlParams({ q: null, status: null, paid: null }, true);
    setIsOpen(false);
    toast.success("Filters cleared");
  }, [mutateUrlParams]);

  return (
    <div
      ref={wrapperRef}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      {/* Search */}
      <div className="relative w-full sm:w-[360px]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by order#, email, phone, address, token..."
          className="w-full min-h-11 rounded-md border border-slate-200 bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-slate-300"
        />

        {q ? (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-1 top-1/2 -translate-y-1/2 h-11 w-11 inline-flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            title="Clear search"
            aria-label="Clear search"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Filter dropdown */}
      <div className="relative w-full sm:w-auto inline-block">
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="w-full sm:w-auto min-h-11 flex items-center justify-center py-2 px-4 text-sm text-gray-900 focus:outline-none bg-white border-b-2 border-gray-400 hover:bg-gray-100 hover:text-green-700"
        >
          Filter{" "}
          {activeCount ? (
            <span className="ml-2 text-xs text-slate-500">({activeCount})</span>
          ) : null}
          <HiChevronDown className="ml-2 w-5 h-5" />
        </button>

        {isOpen ? (
          <div className="absolute mt-2 right-0 w-[92vw] max-w-[320px] sm:w-[320px] bg-white rounded-md shadow-lg z-20 border border-slate-100 overflow-hidden max-h-[80vh]">
            <div className="px-4 py-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-800">Filters</h3>
              <p className="text-xs text-slate-500 mt-1">Server-side filtering</p>
            </div>

            {/* Paid */}
            <div className="p-3 border-b border-slate-100">
              <p className="text-xs font-medium text-slate-600 mb-2">Paid</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStagedPaid(null)}
                  className={`min-h-11 px-3 py-2 rounded-md text-sm border ${
                    stagedPaid === null
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  All
                </button>

                <button
                  type="button"
                  onClick={() => setStagedPaid(true)}
                  className={`min-h-11 px-3 py-2 rounded-md text-sm border ${
                    stagedPaid === true
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  Paid
                </button>

                <button
                  type="button"
                  onClick={() => setStagedPaid(false)}
                  className={`min-h-11 px-3 py-2 rounded-md text-sm border ${
                    stagedPaid === false
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  Unpaid
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="p-3 max-h-64 overflow-auto space-y-2">
              <p className="text-xs font-medium text-slate-600 mb-1">Status</p>

              {STATUS_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex items-center gap-3 rounded-md px-2 py-2 min-h-11 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={stagedStatus.includes(opt.value)}
                    onChange={() => toggleStatus(opt.value)}
                    className="w-5 h-5 accent-green-600 bg-gray-100 border-gray-300 rounded"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 p-3 border-t border-slate-100">
              <button
                type="button"
                onClick={clearAll}
                className="min-h-11 w-full sm:w-auto text-sm px-4 py-2 rounded-md border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                Clear
              </button>

              <button
                type="button"
                onClick={applyFilters}
                className="min-h-11 w-full sm:w-auto text-sm px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                Apply
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
