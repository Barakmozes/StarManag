"use client";

/* eslint-disable @next/next/no-img-element */

import React, {
  Suspense,
  startTransition,
  useCallback,
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

function isPromo(menu: { onPromo: boolean; price: number; sellingPrice?: number | null }) {
  const hasValidDiscount =
    typeof menu.sellingPrice === "number" &&
    menu.sellingPrice > 0 &&
    menu.sellingPrice < menu.price;

  return menu.onPromo || hasValidDiscount;
}

function getPercentOff(price: number, sellingPrice?: number | null) {
  if (!sellingPrice || sellingPrice <= 0 || sellingPrice >= price) return null;
  return Math.round(((price - sellingPrice) / price) * 100);
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
};

/* ------------------------------ UI cards (keep design) ------------------------------ */
/**
 * ✅ We keep your design: <PromoCard promo={promo} />
 * We only map DB menu -> PromoShape.
 */
function menuToPromo(menu: MenuNode): PromoShape {
  const pct = getPercentOff(menu.price, menu.sellingPrice) ?? 0;

  const effectivePrice =
    typeof menu.sellingPrice === "number" && menu.sellingPrice < menu.price
      ? menu.sellingPrice
      : menu.price;

  return {
    id: menu.id,
    title: menu.title,
    img: menu.image,
    salesQ: 0,
    likesN: 0,
    PercentOff: pct,
    price: effectivePrice,
  };
}

/* ------------------------------ Inner with full functionality ------------------------------ */

function PromosInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const promoParam = searchParams.get(PROMO_PARAM);

  // URL-controlled modals
  const isBrowseAllOpen = promoParam === "all";
  const selectedPromoId = promoParam && promoParam !== "all" ? promoParam : null;

  const [search, setSearch] = useState("");

  const [variables, setVariables] = useState<GetMenusQueryVariables>({
    first: PAGE_SIZE,
    after: null,
  });

  const [{ data, fetching, error }, reexecuteQuery] = useQuery<
    GetMenusQuery,
    GetMenusQueryVariables
  >({
    query: GetMenusDocument,
    variables,
    requestPolicy: "cache-and-network",
  });

  // Accumulate pages into one list (browse-all can load more)
  const [allMenus, setAllMenus] = useState<MenuNode[]>([]);
  useEffect(() => {
    const nodes =
      data?.getMenus?.edges?.flatMap((e) => (e?.node ? [e.node] : [])) ?? [];

    if (!nodes.length) return;

    setAllMenus((prev) => {
      const map = new Map<string, MenuNode>();
      for (const m of prev) map.set(m.id, m);
      for (const m of nodes) map.set(m.id, m);
      return Array.from(map.values());
    });
  }, [data?.getMenus?.edges]);

  const pageInfo = data?.getMenus?.pageInfo;

  // toast error once
  const hasShownErrorToastRef = useRef(false);
  useEffect(() => {
    if (!error || hasShownErrorToastRef.current) return;
    hasShownErrorToastRef.current = true;
    toast.error("Failed to load promotions. Please try again.", { duration: 5000 });
  }, [error]);

  const promoMenus = useMemo(() => {
    const promos = allMenus.filter(isPromo);

    promos.sort((a, b) => {
      const aPct = getPercentOff(a.price, a.sellingPrice) ?? 0;
      const bPct = getPercentOff(b.price, b.sellingPrice) ?? 0;
      if (bPct !== aPct) return bPct - aPct;
      return a.title.localeCompare(b.title);
    });

    return promos;
  }, [allMenus]);

  // ✅ keep your original look: show only 3 promo cards in the row
  const promosForRow = useMemo(() => promoMenus.slice(0, 3), [promoMenus]);

  const selectedMenu = useMemo(() => {
    if (!selectedPromoId) return null;
    return allMenus.find((m) => m.id === selectedPromoId) ?? null;
  }, [allMenus, selectedPromoId]);

  const setPromoParam = useCallback(
    (value: string | null) => {
      const nextUrl = buildNextUrl(pathname, searchParams.toString(), (p) => {
        if (!value) p.delete(PROMO_PARAM);
        else p.set(PROMO_PARAM, value);
      });

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
        router.refresh();
      });
    },
    [pathname, router, searchParams]
  );

  const openBrowseAll = useCallback(() => {
    setPromoParam("all");
  }, [setPromoParam]);

  const openPromo = useCallback(
    (menu: MenuNode) => {
      setPromoParam(menu.id);
    },
    [setPromoParam]
  );

  const closeModals = useCallback(() => {
    setSearch("");
    setPromoParam(null);
  }, [setPromoParam]);

  const onLoadMore = useCallback(() => {
    if (!pageInfo?.hasNextPage || !pageInfo.endCursor) return;

    setVariables((prev) => ({
      ...prev,
      after: pageInfo.endCursor as string,
    }));
  }, [pageInfo?.endCursor, pageInfo?.hasNextPage]);

  const filteredPromos = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return promoMenus;

    return promoMenus.filter((m) => {
      const t = m.title.toLowerCase();
      const c = m.category.toLowerCase();
      return t.includes(q) || c.includes(q);
    });
  }, [promoMenus, search]);

  const refreshPromos = useCallback(() => {
    hasShownErrorToastRef.current = false;
    toast.success("Refreshing promotions…", { duration: 1200 });
    reexecuteQuery({ requestPolicy: "network-only" });
  }, [reexecuteQuery]);

  const showInMenuByCategory = useCallback(
    (category: string) => {
      const nextUrl = buildNextUrl(pathname, searchParams.toString(), (p) => {
        p.set(CATEGORY_PARAM, category);
        p.delete(PROMO_PARAM);
      });

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
        router.refresh();
      });

      setTimeout(() => {
        document.getElementById("menuSection")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 50);
    },
    [pathname, router, searchParams]
  );

  /* ------------------------------ RENDER (same design as your static) ------------------------------ */

  const promoCards = useMemo(() => promosForRow.map(menuToPromo), [promosForRow]);

  return (
    <>
      {/* ✅ keep your original design EXACTLY */}
      <div className="max-w-2xl mx-auto my-5 text-center">
        <ModernWaveHeading/>
      </div>

      <section
        className="flex flex-row items-center py-8 gap-4 md:justify-center 
    justify-between my-12 overflow-x-auto"
      >
        {fetching && promoCards.length === 0 ? (
          <DataLoading />
        ) : promoCards.length === 0 ? (
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
          promoCards.map((promo) => {
            const menu = promosForRow.find((m) => m.id === promo.id);
            return (
              <div
                key={promo.id}
                onClick={() => menu && openPromo(menu)}
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
              <p className="text-sm text-gray-500">Browse all deals currently available.</p>
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
                        className="h-20 w-20 rounded object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{m.title}</p>
                        <p className="text-xs text-gray-500">{m.category}</p>
                        <p className="mt-2 text-sm text-red-600 font-semibold">
                          {(() => {
                            const effective =
                              typeof m.sellingPrice === "number" && m.sellingPrice < m.price
                                ? m.sellingPrice
                                : m.price;
                            return money(effective);
                          })()}
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
            <h3 className="text-lg font-semibold text-gray-800">Promotion not found</h3>
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
                className="h-56 w-full object-cover rounded-t-lg"
              />
              <div className="absolute top-3 right-3 rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white">
                {(() => {
                  const pct = getPercentOff(selectedMenu.price, selectedMenu.sellingPrice);
                  return pct ? `${pct}% Off` : "Promo";
                })()}
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{selectedMenu.title}</h3>
                  <p className="text-sm text-gray-500">{selectedMenu.shortDescr}</p>
                </div>

                <div className="text-right">
                  {(() => {
                    const effective =
                      typeof selectedMenu.sellingPrice === "number" &&
                      selectedMenu.sellingPrice < selectedMenu.price
                        ? selectedMenu.sellingPrice
                        : selectedMenu.price;

                    return (
                      <>
                        <p className="text-red-600 font-semibold">{money(effective)}</p>
                        {typeof selectedMenu.sellingPrice === "number" &&
                          selectedMenu.sellingPrice < selectedMenu.price && (
                            <p className="text-xs text-gray-400 line-through">
                              {money(selectedMenu.price)}
                            </p>
                          )}
                      </>
                    );
                  })()}
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
