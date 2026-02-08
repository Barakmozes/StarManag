"use client";

/* eslint-disable @next/next/no-img-element */

import React, {
  Suspense,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@urql/next";
import toast from "react-hot-toast";

import PromoCard from "./PromoCard";
import Modal from "../Common/Modal";
import DataLoading from "../Common/ClientLoaders";

import {
  GetMenusDocument,
  type GetMenusQuery,
  type GetMenusQueryVariables,
} from "@/graphql/generated";
import ModernWaveHeading from "./PromoHeading";

const PROMO_PARAM = "promo";
const CATEGORY_PARAM = "category";
const PAGE_SIZE = 24;
const PROMO_ROW_COUNT = 3;

/* ------------------------------ helpers ------------------------------ */

function buildNextUrl(
  pathname: string,
  currentQuery: string,
  patch: (p: URLSearchParams) => void
) {
  const params = new URLSearchParams(currentQuery);
  patch(params);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

function isPromo(menu: { onPromo?: boolean | null }) {
  return menu.onPromo === true;
}


function getPercentOff(price: number, sellingPrice?: number | null) {
  if (!sellingPrice || sellingPrice <= 0 || sellingPrice >= price) return null;
  return Math.round(((price - sellingPrice) / price) * 100);
}

function getEffectivePrice(price: number, sellingPrice?: number | null) {
  if (typeof sellingPrice === "number" && sellingPrice > 0 && sellingPrice < price) {
    return sellingPrice;
  }
  return price;
}

function money(n: number) {
  const fixed = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return `$${fixed}`;
}

type MenuNode = NonNullable<
  NonNullable<GetMenusQuery["getMenus"]["edges"][number]>["node"]
>;

type PromoShape = {
  id: string;
  title: string;
  img: string;
  salesQ: number;
  likesN: number;
  PercentOff: number;
  price: number;
  oldPrice?: number | null; // המחיר הישן (למחיקה)

};

type PromoMenu = MenuNode & {
  _effectivePrice: number;
  _percentOff: number;
  _lcTitle: string;
  _lcCategory: string;
};

/* ------------------------------ UI cards (keep design) ------------------------------ */
/**
 * ✅ Keep your design: <PromoCard promo={promo} />
 * We only map DB menu -> PromoShape.
 */
function menuToPromo(menu: PromoMenu): PromoShape {
  const hasDiscount =
    typeof menu.sellingPrice === "number" &&
    menu.sellingPrice > 0 &&
    menu.sellingPrice < menu.price;

  return {
    id: menu.id,
    title: menu.title,
    img: menu.image,
    salesQ: 0,
    likesN: 0,
    PercentOff: menu._percentOff,
    price: menu._effectivePrice,
    oldPrice: hasDiscount ? menu.price : null,
  };
}

/* ------------------------------ Inner with full functionality ------------------------------ */

function PromosInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Convert once per render (cheaper + stable deps for callbacks)
  const searchParamsString = searchParams.toString();

  const promoParam = searchParams.get(PROMO_PARAM);

  // URL-controlled modals
  const isBrowseAllOpen = promoParam === "all";
  const selectedPromoId =
    promoParam && promoParam !== "all" ? promoParam : null;

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const [variables, setVariables] = useState<GetMenusQueryVariables>({
    first: PAGE_SIZE,
    after: null,
  });

  /**
   * ⚡ Faster default:
   * - "cache-first" prevents unnecessary duplicate refetches if some other section already queried menus.
   * - Manual "Refresh" uses network-only.
   */
  const [{ data, fetching, error }, reexecuteQuery] = useQuery<
    GetMenusQuery,
    GetMenusQueryVariables
  >({
    query: GetMenusDocument,
    variables,
    requestPolicy: "cache-first",
  });

  const pageInfo = data?.getMenus?.pageInfo;

  /**
   * Accumulate pages efficiently:
   * - Use a Map ref so we don't rebuild a Map from prev state every time.
   * - Only update state (and trigger re-render) when something actually changes.
   */
  const menusByIdRef = useRef<Map<string, MenuNode>>(new Map());
  const [allMenus, setAllMenus] = useState<MenuNode[]>([]);

  useEffect(() => {
    const edges = data?.getMenus?.edges;
    if (!edges?.length) return;

    const map = menusByIdRef.current;
    let changed = false;

    for (const edge of edges) {
      const node = edge?.node;
      if (!node) continue;

      const prev = map.get(node.id);
      // Update if new ID or (rarely) changed reference
      if (!prev || prev !== node) {
        map.set(node.id, node);
        changed = true;
      }
    }

    if (changed) {
      // Preserve Map insertion order; build array once per meaningful update
      setAllMenus(Array.from(map.values()));
    }
  }, [data?.getMenus?.edges]);

  // toast error once
  const hasShownErrorToastRef = useRef(false);
  useEffect(() => {
    if (!error || hasShownErrorToastRef.current) return;
    hasShownErrorToastRef.current = true;
    toast.error("Failed to load promotions. Please try again.", {
      duration: 5000,
    });
  }, [error]);

  /**
   * Derived promo list:
   * - Precompute percent/effective price + lowercased fields once
   * - Sorting only once when menus change
   */
  const promoMenus = useMemo<PromoMenu[]>(() => {
    if (!allMenus.length) return [];

    const promos: PromoMenu[] = [];

    for (const m of allMenus) {
      if (!isPromo(m)) continue;

      const percentOff = getPercentOff(m.price, m.sellingPrice) ?? 0;
      const effectivePrice = getEffectivePrice(m.price, m.sellingPrice);

      promos.push({
        ...m,
        _percentOff: percentOff,
        _effectivePrice: effectivePrice,
        _lcTitle: m.title.toLowerCase(),
        _lcCategory: m.category.toLowerCase(),
      });
    }

    promos.sort((a, b) => {
      if (b._percentOff !== a._percentOff) return b._percentOff - a._percentOff;
      return a.title.localeCompare(b.title);
    });

    return promos;
  }, [allMenus]);

  // ✅ keep your original look: show only 3 promo cards in the row
  const promosForRow = useMemo(
    () => promoMenus.slice(0, PROMO_ROW_COUNT),
    [promoMenus]
  );

  // O(1) lookup via Map ref (recomputed when menus change)
  const selectedMenu = useMemo(() => {
    if (!selectedPromoId) return null;
    return menusByIdRef.current.get(selectedPromoId) ?? null;
  }, [allMenus, selectedPromoId]);

  const setPromoParam = useCallback(
    (value: string | null) => {
      const nextUrl = buildNextUrl(pathname, searchParamsString, (p) => {
        if (!value) p.delete(PROMO_PARAM);
        else p.set(PROMO_PARAM, value);
      });

      // Avoid unnecessary navigations
      const currentUrl = searchParamsString
        ? `${pathname}?${searchParamsString}`
        : pathname;
      if (nextUrl === currentUrl) return;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
        // ✅ Intentionally removed router.refresh() for speed:
        // promo param only controls client UI (modals), no server refresh needed.
      });
    },
    [pathname, router, searchParamsString]
  );

  const openBrowseAll = useCallback(() => {
    setPromoParam("all");
  }, [setPromoParam]);

  const openPromo = useCallback(
    (menu: Pick<MenuNode, "id">) => {
      setPromoParam(menu.id);
    },
    [setPromoParam]
  );

  const closeModals = useCallback(() => {
    setSearch("");
    setPromoParam(null);
  }, [setPromoParam]);

  const onLoadMore = useCallback(() => {
    if (fetching) return;
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) return;

    const nextCursor = pageInfo.endCursor as string;

    setVariables((prev) => {
      if (prev.after === nextCursor) return prev;
      return { ...prev, after: nextCursor };
    });
  }, [fetching, pageInfo?.endCursor, pageInfo?.hasNextPage]);

  const filteredPromos = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return promoMenus;

    return promoMenus.filter((m) => m._lcTitle.includes(q) || m._lcCategory.includes(q));
  }, [promoMenus, deferredSearch]);

  const refreshPromos = useCallback(() => {
    if (fetching) return;
    hasShownErrorToastRef.current = false;
    toast.success("Refreshing promotions…", { duration: 1200 });
    reexecuteQuery({ requestPolicy: "network-only" });
  }, [fetching, reexecuteQuery]);

  const showInMenuByCategory = useCallback(
    (category: string) => {
      const nextUrl = buildNextUrl(pathname, searchParamsString, (p) => {
        p.set(CATEGORY_PARAM, category);
        p.delete(PROMO_PARAM);
      });

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
        // ✅ No router.refresh() here for speed.
        // If you ever need a forced server re-render, add it back.
      });

      setTimeout(() => {
        document.getElementById("menuSection")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    },
    [pathname, router, searchParamsString]
  );

  const selectedPercentOff = useMemo(() => {
    if (!selectedMenu) return null;
    return getPercentOff(selectedMenu.price, selectedMenu.sellingPrice);
  }, [selectedMenu]);

  const selectedEffectivePrice = useMemo(() => {
    if (!selectedMenu) return 0;
    return getEffectivePrice(selectedMenu.price, selectedMenu.sellingPrice);
  }, [selectedMenu]);

  const selectedHasDiscount = useMemo(() => {
    if (!selectedMenu) return false;
    return (
      typeof selectedMenu.sellingPrice === "number" &&
      selectedMenu.sellingPrice > 0 &&
      selectedMenu.sellingPrice < selectedMenu.price
    );
  }, [selectedMenu]);

  /* ------------------------------ RENDER (same design as your static) ------------------------------ */

  return (
    <>
      {/* ✅ keep your original design EXACTLY */}
      <div className="max-w-2xl mx-auto my-5 text-center">
        <ModernWaveHeading />
      </div>

      <section
        className="flex flex-row items-center py-8 gap-4 md:justify-center 
    justify-between my-12 overflow-x-auto"
      >
        {fetching && promosForRow.length === 0 ? (
          <DataLoading />
        ) : promosForRow.length === 0 ? (
          // keep layout simple, no design shift
          <div className="w-full flex flex-col items-center justify-center gap-2 py-10">
            <p className="text-sm text-gray-500">
              No promotions are available right now.
            </p>
            <button
              type="button"
              onClick={refreshPromos}
              className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Retry
            </button>
          </div>
        ) : (
          promosForRow.map((menu) => {
            const promo = menuToPromo(menu);
            return (
              <div
                key={promo.id}
                onClick={() => openPromo(menu)}
                className="cursor-pointer"
              >
                <PromoCard promo={promo} />
              </div>
            );
          })
        )}
      </section>

      {/* ✅ MODALS exist, but they do not change the main design unless opened */}

      {/* Browse all promos modal */}
      <Modal isOpen={isBrowseAllOpen} closeModal={closeModals}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Promotions</h3>
              <p className="text-sm text-gray-500">
                Browse all deals currently available.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={refreshPromos}
                className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={closeModals}
                className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>

          <div className="mt-4">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search promos (title or category)…"
              className="w-full rounded border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fetching && filteredPromos.length === 0 ? (
              <>
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`promo-grid-skel-${idx}`}
                    className="h-40 rounded-lg bg-slate-200 animate-pulse"
                    aria-hidden="true"
                  />
                ))}
              </>
            ) : filteredPromos.length === 0 ? (
              <div className="col-span-full flex flex-col items-center gap-2 py-8">
                <p className="text-sm text-gray-500">No matches.</p>
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredPromos.map((m) => (
                <button
                  key={`grid-${m.id}`}
                  type="button"
                  onClick={() => openPromo(m)}
                  className="text-left"
                >
                  <div className="rounded-lg border border-gray-100 p-3 hover:bg-green-50 transition">
                    <div className="flex gap-3">
                      <Image
                        src={m.image}
                        width={88}
                        height={88}
                        alt={m.title}
                        sizes="80px"
                        className="h-20 w-20 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{m.title}</p>
                        <p className="text-xs text-gray-500">{m.category}</p>
                        <p className="mt-2 text-sm text-red-600 font-semibold">
                          {money(m._effectivePrice)}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {pageInfo?.hasNextPage && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={fetching}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
              >
                Load more
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Promo details modal */}
      <Modal isOpen={Boolean(selectedPromoId)} closeModal={closeModals}>
        {!selectedMenu ? (
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Promotion not found
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              This promotion may have expired or the link is incorrect.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={closeModals}
                className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={openBrowseAll}
                className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-500"
              >
                Browse all deals
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="relative">
              <Image
                src={selectedMenu.image}
                width={720}
                height={420}
                alt={selectedMenu.title}
                sizes="(max-width: 768px) 100vw, 720px"
                className="h-56 w-full object-cover rounded-t-lg"
              />
              <div className="absolute top-3 right-3 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                {selectedPercentOff ? `${selectedPercentOff}% Off` : "Promo"}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {selectedMenu.title}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedMenu.shortDescr}</p>
                </div>

                <div className="text-right">
                  <p className="text-red-600 font-semibold">
                    {money(selectedEffectivePrice)}
                  </p>
                  {selectedHasDiscount && (
                    <p className="text-xs text-gray-400 line-through">
                      {money(selectedMenu.price)}
                    </p>
                  )}
                </div>
              </div>

              {selectedMenu.longDescr && (
                <p className="text-sm text-gray-500">{selectedMenu.longDescr}</p>
              )}

              <div className="flex items-center gap-2">
                <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
                  {selectedMenu.category}
                </span>
                {selectedMenu.onPromo && (
                  <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                    On Promo
                  </span>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  className="form-button"
                  onClick={() => showInMenuByCategory(selectedMenu.category)}
                >
                  Order from Menu
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={openBrowseAll}
                    className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 w-full"
                  >
                    Browse all deals
                  </button>
                  <button
                    type="button"
                    onClick={refreshPromos}
                    className="rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 w-full"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default function Promos() {
  return (
    <Suspense fallback={<DataLoading />}>
      <PromosInner />
    </Suspense>
  );
}
