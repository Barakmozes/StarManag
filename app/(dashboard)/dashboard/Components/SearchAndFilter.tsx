"use client";

import React, {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useClient, useQuery, type OperationResult } from "@urql/next";;
import gql from "graphql-tag";
import { HiOutlineSearch, HiOutlineUpload } from "react-icons/hi";
import { HiChevronDown } from "react-icons/hi2";

import OrdersFilter from "../orders/OrdersFilter";
import AdminAddMenu from "../menu/AdminAddMenu";
import { categoriesData } from "@/data/categories-data";
import { useMenuFilterStore } from "@/lib/menuCategory";

import {
  GetMenusDocument,
  type GetMenusQuery,
  type GetMenusQueryVariables,
  GetOrdersDocument,
  type GetOrdersQuery,
  type GetOrdersQueryVariables,
  type Category as GqlCategory,
} from "@/graphql/generated";

/* ----------------------------- constants & types ---------------------------- */

const SEARCH_KEYS = ["q", "search", "query"] as const;
const CATEGORY_KEYS = ["category", "categoryId"] as const;
const PRICE_KEYS = ["price", "priceRange"] as const;
const STATUS_KEYS = ["status", "orderStatus"] as const;

// common pagination-ish params used across different tables
const PAGINATION_KEYS = [
  "after",
  "before",
  "cursor",
  "page",
  "offset",
  "skip",
  "take",
  "first",
  "last",
] as const;

const PRICE_RANGE_KEYS = ["all", "0-5", "6-10", "11-15", "15+"] as const;
type PriceKey = (typeof PRICE_RANGE_KEYS)[number];

type MenuNode = NonNullable<
  NonNullable<GetMenusQuery["getMenus"]["edges"][number]>["node"]
>;

type OrderNode = NonNullable<
  NonNullable<GetOrdersQuery["getOrders"]["edges"][number]>["node"]
>;

type UrlUpdates = {
  search?: string | null;
  category?: string | null;
  price?: PriceKey | string | null;
  status?: string | null;
};

/* ----------------------------- small utilities ---------------------------- */

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

function useOnClickOutside<T extends HTMLElement>(
  ref: React.RefObject<T>,
  handler: () => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref.current;
      if (!el) return;
      if (el.contains(event.target as Node)) return;
      handlerRef.current();
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref]);
}

function csvEscape(value: unknown) {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function downloadTextFile(contents: string, filename: string, mime: string) {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function normalizeStr(x: unknown) {
  return (x ?? "").toString().toLowerCase().trim();
}

function isPriceKey(v: string | null): v is PriceKey {
  return !!v && (PRICE_RANGE_KEYS as readonly string[]).includes(v);
}

function parsePriceKey(v: string | null): PriceKey {
  return isPriceKey(v) ? v : "all";
}

function priceInRange(price: number, range: PriceKey) {
  if (range === "all") return true;
  if (range === "0-5") return price >= 0 && price <= 5;
  if (range === "6-10") return price >= 6 && price <= 10;
  if (range === "11-15") return price >= 11 && price <= 15;
  if (range === "15+") return price >= 15;
  return true;
}

function firstPresent(
  searchParams: ReadonlyURLSearchParams,
  keys: readonly string[]
) {
  for (const k of keys) {
    const v = searchParams.get(k);
    if (v !== null) return v;
  }
  return null;
}

function pickWriteKey(params: URLSearchParams, keys: readonly string[]) {
  for (const k of keys) if (params.has(k)) return k;
  return keys[0]!;
}

/* ----------------------------- categories query ---------------------------- */

const GetCategoriesForDashboardFilterDocument = gql`
  query GetCategoriesForDashboardFilter {
    getCategories {
      id
      title
    }
  }
`;

type GetCategoriesForDashboardFilterQuery = {
  getCategories: Array<Pick<GqlCategory, "id" | "title">>;
};

/* ------------------------------ main component ---------------------------- */

const SearchAndFilter = () => {
  const pathname = usePathname() || "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const urqlClient = useClient();

  const isMenuPage = pathname.startsWith("/dashboard/menu");
  const isOrdersPage = pathname.startsWith("/dashboard/orders");

  // URL (source-of-truth)
  const qParam = (firstPresent(searchParams, SEARCH_KEYS) ?? "").trim();

  const categoryParamRaw = firstPresent(searchParams, CATEGORY_KEYS) ?? "all";
  const categoryValue = (categoryParamRaw || "all").trim() || "all";

  const priceValue = parsePriceKey(firstPresent(searchParams, PRICE_KEYS));

  const statusParamRaw = firstPresent(searchParams, STATUS_KEYS) ?? "";
  const statusValue = statusParamRaw.trim();

  // Search input state (debounced into URL)
  const [searchValue, setSearchValue] = useState(qParam);
  useEffect(() => setSearchValue(qParam), [qParam]);

  const debouncedSearch = useDebouncedValue(searchValue, 350);

  // Dropdown states
  const [priceOpen, setPriceOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const priceRef = useRef<HTMLDivElement>(null);
  const catRef = useRef<HTMLDivElement>(null);

  useOnClickOutside(priceRef, () => setPriceOpen(false));
  useOnClickOutside(catRef, () => setCatOpen(false));

  /* --------------------------- smart URL mutation -------------------------- */
  /**
   * IMPORTANT FIX:
   * We base updates on window.location.search (latest) to avoid stale param merges
   * when the user clicks multiple filters quickly.
   */
  const updateUrlParams = useCallback(
    (updates: UrlUpdates, opts?: { resetPagination?: boolean }) => {
      const base =
        typeof window !== "undefined"
          ? window.location.search
          : `?${searchParams.toString()}`;

      const params = new URLSearchParams(base);

      const resetPagination = opts?.resetPagination ?? true;
      if (resetPagination) {
        for (const k of PAGINATION_KEYS) params.delete(k);
      }

      // search: keep compatible keys everywhere
      if (updates.search !== undefined) {
        const v = (updates.search ?? "").trim();
        for (const k of SEARCH_KEYS) {
          if (!v) params.delete(k);
          else params.set(k, v);
        }
      }

      // category: prefer existing key (categoryId vs category) but don't force both
      if (updates.category !== undefined) {
        const v = (updates.category ?? "").trim();
        const writeKey = pickWriteKey(params, CATEGORY_KEYS);
        for (const k of CATEGORY_KEYS) params.delete(k);
        if (v && v !== "all") params.set(writeKey, v);
      }

      // price: prefer existing key (priceRange vs price)
      if (updates.price !== undefined) {
        const v = String(updates.price ?? "").trim();
        const writeKey = pickWriteKey(params, PRICE_KEYS);
        for (const k of PRICE_KEYS) params.delete(k);
        if (v && v !== "all") params.set(writeKey, v);
      }

      // status: keep compatible keys (status/orderStatus)
      if (updates.status !== undefined) {
        const v = (updates.status ?? "").trim();
        for (const k of STATUS_KEYS) {
          if (!v || v === "all") params.delete(k);
          else params.set(k, v);
        }
      }

      const qs = params.toString();
      const next = qs ? `${pathname}?${qs}` : pathname;

      startTransition(() => {
        router.replace(next, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Push debounced search into URL (and reset pagination)
  useEffect(() => {
    const v = debouncedSearch.trim();
    if (v === qParam) return;
    updateUrlParams({ search: v }, { resetPagination: true });
  }, [debouncedSearch, qParam, updateUrlParams]);

  /* ------------------------------ menu store sync ------------------------------ */

  const rehydrateMenuFilter = useMenuFilterStore((s) => s.rehydrate);
  const setCategoryStore = useMenuFilterStore((s) => s.setCategory);
  const clearCategoryStore = useMenuFilterStore((s) => s.clearCategory);

  useEffect(() => {
    if (!isMenuPage) return;
    rehydrateMenuFilter();
  }, [isMenuPage, rehydrateMenuFilter]);

  useEffect(() => {
    if (!isMenuPage) return;
    if (!categoryValue || categoryValue === "all") clearCategoryStore();
    else setCategoryStore(categoryValue);
  }, [isMenuPage, categoryValue, clearCategoryStore, setCategoryStore]);

  /* ------------------------------ categories options ------------------------------ */

  const [{ data: catsData }] = useQuery<GetCategoriesForDashboardFilterQuery>({
    query: GetCategoriesForDashboardFilterDocument,
    pause: !isMenuPage,
    requestPolicy: "cache-first",
  });

  const categoryOptions: string[] = useMemo(() => {
    const hasTitle = (t: unknown): t is string =>
      typeof t === "string" && t.trim().length > 0;

    const dbTitles = (catsData?.getCategories ?? [])
      .map((c) => c.title)
      .filter(hasTitle);

    const staticTitles = categoriesData.map((c) => c.title).filter(hasTitle);

    const titles = dbTitles.length ? dbTitles : staticTitles;

    const uniqueTitles = Array.from(new Set(titles));
    uniqueTitles.sort((a, b) => a.localeCompare(b));

    return ["all", ...uniqueTitles];
  }, [catsData?.getCategories]);

  const priceOptions: Array<{ key: PriceKey; label: string }> = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "0-5", label: "$0 - $5" },
      { key: "6-10", label: "$6 - $10" },
      { key: "11-15", label: "$11 - $15" },
      { key: "15+", label: "$15+" },
    ],
    []
  );

  const searchPlaceholder = useMemo(() => {
    if (isMenuPage) return "Search menu (title, category, description)…";
    if (isOrdersPage) return "Search orders (number, name, email, phone)…";
    return "Search…";
  }, [isMenuPage, isOrdersPage]);

  const hasActiveFilters = useMemo(() => {
    const hasQ = !!searchValue.trim();
    const hasMenuFilters = isMenuPage && (categoryValue !== "all" || priceValue !== "all");
    const hasOrderFilters = isOrdersPage && !!statusValue;
    return hasQ || hasMenuFilters || hasOrderFilters;
  }, [searchValue, isMenuPage, categoryValue, priceValue, isOrdersPage, statusValue]);

  const clearAll = useCallback(() => {
    setSearchValue("");
    setPriceOpen(false);
    setCatOpen(false);
    updateUrlParams(
      { search: "", category: "all", price: "all", status: "" },
      { resetPagination: true }
    );
  }, [updateUrlParams]);

  /* ------------------------------ optional broadcast ------------------------------ */
  useEffect(() => {
    const detail: any = { pathname, q: qParam };

    if (isMenuPage) {
      detail.category = categoryValue;
      detail.price = priceValue;
    }
    if (isOrdersPage) {
      detail.status = statusValue;
    }

    window.dispatchEvent(new CustomEvent("dashboard:filters", { detail }));
  }, [pathname, qParam, isMenuPage, categoryValue, priceValue, isOrdersPage, statusValue]);

  /* --------------------------------- export -------------------------------- */

  const [exporting, setExporting] = useState(false);

  const fetchAllMenus = useCallback(async () => {
    const pageSize = 200;
    let after: string | null = null;
    const out: MenuNode[] = [];

    for (let page = 0; page < 100; page++) {
      const result: OperationResult<GetMenusQuery, GetMenusQueryVariables> =
        await urqlClient
          .query<GetMenusQuery, GetMenusQueryVariables>(GetMenusDocument, {
            first: pageSize,
            after,
          })
          .toPromise();

      if (result.error) throw new Error(result.error.message);

      const edges = result.data?.getMenus?.edges ?? [];
      for (const edge of edges) {
        if (edge?.node) out.push(edge.node as MenuNode);
      }

      const pageInfo = result.data?.getMenus?.pageInfo;
      if (!pageInfo?.hasNextPage) break;

      after = pageInfo.endCursor ?? null;
      if (!after) break;

      if (out.length >= 10000) break;
    }

    return out;
  }, [urqlClient]);

  const fetchAllOrders = useCallback(async () => {
    const pageSize = 200;
    let after: string | null = null;
    const out: OrderNode[] = [];

    for (let page = 0; page < 100; page++) {
      const result: OperationResult<GetOrdersQuery, GetOrdersQueryVariables> =
        await urqlClient
          .query<GetOrdersQuery, GetOrdersQueryVariables>(GetOrdersDocument, {
            first: pageSize,
            after,
          })
          .toPromise();

      if (result.error) throw new Error(result.error.message);

      const edges = result.data?.getOrders?.edges ?? [];
      for (const edge of edges) {
        if (edge?.node) out.push(edge.node as OrderNode);
      }

      const pageInfo = result.data?.getOrders?.pageInfo;
      if (!pageInfo?.hasNextPage) break;

      after = pageInfo.endCursor ?? null;
      if (!after) break;

      if (out.length >= 20000) break;
    }

    return out;
  }, [urqlClient]);

  const exportMenusCsv = useCallback(async () => {
    const q = normalizeStr(searchValue);
    const selectedCategory = categoryValue;
    const selectedPrice = priceValue;

    const toastId = toast.loading("Preparing menu export…");
    setExporting(true);

    try {
      const all = await fetchAllMenus();

      const filtered = all.filter((m) => {
        const price = (m.sellingPrice ?? m.price ?? 0) as number;

        const matchesQ =
          !q ||
          [m.title, m.category, m.shortDescr, m.longDescr ?? ""].some((x) =>
            normalizeStr(x).includes(q)
          );

        const matchesCategory =
          selectedCategory === "all" || m.category === selectedCategory;

        const matchesPrice = priceInRange(price, selectedPrice);

        return matchesQ && matchesCategory && matchesPrice;
      });

      const headers = [
        "id",
        "title",
        "category",
        "price",
        "sellingPrice",
        "onPromo",
        "shortDescr",
        "longDescr",
        "prepType",
        "image",
      ];

      const rows = filtered.map((m) => [
        m.id,
        m.title,
        m.category,
        m.price,
        m.sellingPrice ?? "",
        m.onPromo,
        m.shortDescr,
        m.longDescr ?? "",
        Array.isArray(m.prepType) ? m.prepType.join(" | ") : "",
        m.image,
      ]);

      const csv =
        "\uFEFF" +
        [headers, ...rows]
          .map((line) => line.map(csvEscape).join(","))
          .join("\n");

      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(csv, `menus_${stamp}.csv`, "text/csv;charset=utf-8;");
      toast.success(`Exported ${filtered.length} menus`, { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Export failed", { id: toastId });
    } finally {
      setExporting(false);
    }
  }, [categoryValue, priceValue, fetchAllMenus, searchValue]);

  const exportOrdersCsv = useCallback(async () => {
    const q = normalizeStr(searchValue);
    const status = statusValue ? statusValue.toUpperCase() : "";

    const toastId = toast.loading("Preparing orders export…");
    setExporting(true);

    try {
      const all = await fetchAllOrders();

      const filtered = all.filter((o) => {
        const matchesQ =
          !q ||
          [
            o.orderNumber,
            o.userName,
            o.userEmail,
            o.userPhone,
            o.deliveryAddress,
            o.id,
          ].some((x) => normalizeStr(x).includes(q));

        const matchesStatus =
          !status || String(o.status ?? "").toUpperCase() === status;

        return matchesQ && matchesStatus;
      });

      const headers = [
        "id",
        "orderNumber",
        "orderDate",
        "status",
        "paid",
        "total",
        "userName",
        "userEmail",
        "userPhone",
        "deliveryAddress",
        "deliveryFee",
        "serviceFee",
        "discount",
        "note",
        "deliveryTime",
        "paymentToken",
        "cart",
      ];

      const rows = filtered.map((o) => [
        o.id,
        o.orderNumber,
        o.orderDate,
        o.status,
        o.paid,
        o.total,
        o.userName,
        o.userEmail,
        o.userPhone,
        o.deliveryAddress,
        o.deliveryFee,
        o.serviceFee,
        o.discount ?? "",
        o.note ?? "",
        o.deliveryTime ?? "",
        o.paymentToken ?? "",
        JSON.stringify(o.cart ?? ""),
      ]);

      const csv =
        "\uFEFF" +
        [headers, ...rows]
          .map((line) => line.map(csvEscape).join(","))
          .join("\n");

      const stamp = new Date().toISOString().slice(0, 10);
      downloadTextFile(csv, `orders_${stamp}.csv`, "text/csv;charset=utf-8;");
      toast.success(`Exported ${filtered.length} orders`, { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || "Export failed", { id: toastId });
    } finally {
      setExporting(false);
    }
  }, [fetchAllOrders, searchValue, statusValue]);

  const handleExport = async () => {
    if (exporting) return;
    if (isMenuPage) return exportMenusCsv();
    if (isOrdersPage) return exportOrdersCsv();
    toast("Nothing to export on this page", { duration: 1500 });
  };

  /* ---------------------------------- render ---------------------------------- */

  return (
    <div className="flex flex-col md:flex-row z-10 items-center justify-between space-y-3 md:space-y-0 md:space-x-4 p-4">
      {/* Search */}
      <div className="w-full md:w-1/2">
        <form
          className="flex items-center"
          onSubmit={(e) => {
            e.preventDefault();
            // flush immediately on Enter
            updateUrlParams({ search: searchValue }, { resetPagination: true });
          }}
        >
          <label htmlFor="dashboard-search" className="sr-only">
            Search
          </label>

          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <HiOutlineSearch aria-hidden="true" className="w-5 h-5 text-gray-500" />
            </div>

            <input
              id="dashboard-search"
              type="text"
              autoComplete="off"
              className="bg-gray-50 border border-gray-300 text-gray-600 text-sm rounded-lg block w-full pl-10 pr-10 p-2"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />

            {searchValue.trim() ? (
              <button
                type="button"
                aria-label="Clear search"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700"
                onClick={() => {
                  setSearchValue("");
                  updateUrlParams({ search: "" }, { resetPagination: true });
                }}
              >
                ✕
              </button>
            ) : null}
          </div>
        </form>
      </div>

      {/* Actions */}
      <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center md:space-x-3 flex-shrink-0">
        {isMenuPage && (
          <>
            <div className="flex items-center space-x-3 w-full md:w-auto">
              <AdminAddMenu />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              <button
                type="button"
                onClick={handleExport}
                disabled={exporting}
                className="text-white inline-flex items-center whitespace-nowrap bg-green-600 hover:bg-green-700
                focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center
                disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <HiOutlineUpload className="mr-1 -ml-1 w-4 h-4" />
                {exporting ? "Exporting…" : "Export"}
              </button>
            </div>

            {/* Price dropdown */}
            <div ref={priceRef} className="relative inline-block bg-white cursor-pointer">
              <button
                type="button"
                onClick={() => setPriceOpen((v) => !v)}
                className="md:w-auto flex items-center justify-center py-2 px-4 text-sm text-gray-900
                focus:outline-none bg-white border-b-2 border-gray-400 hover:bg-gray-100 hover:text-green-700"
                aria-expanded={priceOpen}
              >
                Price
                <HiChevronDown className="ml-1 mr-1.5 w-5 h-5" />
              </button>

              {priceOpen && (
                <div className="absolute mt-2 -mr-1 w-56 bg-white rounded-md shadow-lg z-10">
                  <div className="text-center py-3">
                    <h3>Filter by Price</h3>
                  </div>

                  <ul className="space-y-2 text-sm p-3">
                    {priceOptions.map((opt) => (
                      <li key={opt.key} className="flex items-center">
                        <input
                          type="radio"
                          name="price-filter"
                          checked={priceValue === opt.key}
                          onChange={() => {
                            updateUrlParams({ price: opt.key }, { resetPagination: true });
                            setPriceOpen(false);
                          }}
                          className="w-4 h-4 accent-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        />

                        <label className="ml-2 text-sm font-medium text-gray-600">
                          {opt.label}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Category dropdown */}
            <div ref={catRef} className="relative inline-block bg-white cursor-pointer">
              <button
                type="button"
                onClick={() => setCatOpen((v) => !v)}
                className="md:w-auto flex items-center justify-center py-2 px-4 text-sm text-gray-900
                focus:outline-none bg-white border-b-2 border-gray-400 hover:bg-gray-100 hover:text-green-700"
                aria-expanded={catOpen}
              >
                Category
                <HiChevronDown className="ml-1 mr-1.5 w-5 h-5" />
              </button>

              {catOpen && (
                <div className="absolute mt-2 -mr-1 w-56 bg-white rounded-md shadow-lg z-10">
                  <div className="text-center py-3">
                    <h3>Filter by Category</h3>
                  </div>

                  <ul className="space-y-2 text-sm p-3 max-h-64 overflow-auto">
                    {categoryOptions.map((c) => (
                      <li key={c} className="flex items-center">
                        <input
                          type="radio"
                          name="category-filter"
                          checked={categoryValue === c}
                          onChange={() => {
                            updateUrlParams({ category: c }, { resetPagination: true });
                            setCatOpen(false);
                          }}
                          className="w-4 h-4 accent-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                        />

                        <label className="ml-2 text-sm font-medium text-gray-600">
                          {c === "all" ? "All" : c}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </>
        )}

        {isOrdersPage && (
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="text-white inline-flex items-center whitespace-nowrap bg-green-600 hover:bg-green-700
              focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center
              disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <HiOutlineUpload className="mr-1 -ml-1 w-4 h-4" />
              {exporting ? "Exporting…" : "Export"}
            </button>
          </div>
        )}

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            className="text-gray-700 inline-flex items-center whitespace-nowrap bg-gray-100 hover:bg-gray-200
            focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-4 py-2.5 text-center"
          >
            Clear
          </button>
        )}
      </div>

      {/* Right-side filters */}
      <div className="w-full md:w-auto flex flex-col md:flex-row space-y-2 md:space-y-0 items-stretch md:items-center justify-end md:space-x-3 flex-shrink-0">
        {isOrdersPage && (
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <OrdersFilter />
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchAndFilter;
