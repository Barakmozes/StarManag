"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useClient, useQuery } from "@urql/next";
import type { Menu, User } from "@prisma/client";

import MenuModal from "./MenuModal";
import DataLoading from "../Common/ClientLoaders";
import {
  GetMenusDocument,
  type GetMenusQuery,
  type GetMenusQueryVariables,
} from "@/graphql/generated";

/* ------------------------------ helpers ------------------------------ */

type MenuNode = NonNullable<
  NonNullable<GetMenusQuery["getMenus"]["edges"][number]>["node"]
>;

type PriceKey = "all" | "0-5" | "6-10" | "11-15" | "15+";

const PAGE_SIZE = 4;

/**
 * Filter-mode fetches in pages and stops as soon as we have enough matches.
 * These are safety/perf bounds.
 */
const FILTER_BATCH = 60; // moderate page size for fewer round trips
const MAX_SCAN = 10000; // max menus scanned in filter mode (safety)

const SKELETON_ITEMS = Array.from({ length: 10 });

function normalizeStr(x: unknown) {
  return (x ?? "").toString().toLowerCase().trim();
}

function parsePriceKey(v: string | null): PriceKey {
  if (v === "0-5" || v === "6-10" || v === "11-15" || v === "15+") return v;
  return "all";
}

function priceInRange(price: number, range: PriceKey) {
  if (range === "all") return true;
  if (range === "0-5") return price >= 0 && price <= 5;
  if (range === "6-10") return price >= 6 && price <= 10;
  if (range === "11-15") return price >= 11 && price <= 15;
  if (range === "15+") return price >= 15;
  return true;
}

function matchesMenu(node: MenuNode, qNorm: string, category: string, price: PriceKey) {
  const effectivePrice = (node.sellingPrice ?? node.price ?? 0) as number;

  const matchesCategory = category === "all" || node.category === category;
  if (!matchesCategory) return false;

  const matchesPrice = priceInRange(effectivePrice, price);
  if (!matchesPrice) return false;

  if (!qNorm) return true;

  return (
    normalizeStr(node.title).includes(qNorm) ||
    normalizeStr(node.category).includes(qNorm) ||
    normalizeStr(node.shortDescr).includes(qNorm) ||
    normalizeStr(node.longDescr ?? "").includes(qNorm)
  );
}

/* ------------------------------ shared skeleton (same UI) ------------------------------ */

const MenuSkeleton = React.memo(function MenuSkeleton() {
  return (
    <div className="flex flex-row items-center md:justify-center justify-between mt-12 md:gap-12 overflow-x-auto">
      <DataLoading />
      {SKELETON_ITEMS.map((_, idx) => (
        <div
          key={`cat-skel-${idx}`}
          className="flex flex-col rounded-full h-16 w-16 items-center justify-center p-3 shrink-0 overflow-hidden bg-transparent"
          aria-hidden="true"
        >
          <div className="h-56 w-56 rounded-full bg-slate-200 animate-pulse" />
          <div className="mt-1 h-3 w-12 rounded bg-slate-200 animate-pulse" />
        </div>
      ))}
      <DataLoading />
    </div>
  );
});

/* ------------------------------ paged (existing UI) ------------------------------ */

type FetchedMenuProps = {
  variables: GetMenusQueryVariables;
  isLastPage: boolean;
  onLoadMore: (after: string) => void;
  user: User;
  pause?: boolean;
};

const FetchedMenus = React.memo(function FetchedMenus({
  variables,
  isLastPage,
  onLoadMore,
  user,
  pause,
}: FetchedMenuProps) {
  const urqlClient = useClient();

  const [{ data, fetching, error }] = useQuery<GetMenusQuery, GetMenusQueryVariables>({
    query: GetMenusDocument,
    variables, // ✅ pass stable object to avoid unnecessary request re-creation
    pause,
    requestPolicy: "cache-first",
  });

  const menus = data?.getMenus?.edges ?? [];
  const endCursor = data?.getMenus?.pageInfo?.endCursor ?? null;
  const hasNextPage = !!data?.getMenus?.pageInfo?.hasNextPage;

  // ✅ prefetch next page in background so "LoadMore" feels instant
  const prefetchedCursorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isLastPage) return;
    if (!hasNextPage || !endCursor) return;
    if (prefetchedCursorRef.current === endCursor) return;

    prefetchedCursorRef.current = endCursor;

    const first = variables.first ?? PAGE_SIZE;

    urqlClient
      .query<GetMenusQuery, GetMenusQueryVariables>(
        GetMenusDocument,
        { first, after: endCursor },
        { requestPolicy: "cache-first" }
      )
      .toPromise()
      .catch(() => {
        // silent prefetch failure
      });
  }, [urqlClient, isLastPage, hasNextPage, endCursor, variables.first]);

  useEffect(() => {
    if (!error) return;
    toast.error("Failed to load menu.");
  }, [error]);

  return (
    <>
      {!menus || menus.length === 0 ? (
        <MenuSkeleton />
      ) : (
        <div className="mb-24 space-y-5">
          <div className=" mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  ">
            {menus.map((MenuEdge) => (
              <MenuModal
                key={MenuEdge?.node?.id}
                menu={MenuEdge?.node as unknown as Menu}
                user={user as User}
              />
            ))}
          </div>

          {isLastPage && hasNextPage && endCursor && (
            <button
              onClick={() => onLoadMore(endCursor)}
              className="bg-green-600 text-white text-center
      hover:bg-green-200  hover:text-green-700  p-3 rounded  focus:outline-none "
            >
              LoadMore
            </button>
          )}
        </div>
      )}

      {/* keep the same UI behavior while loading new pages */}
      {fetching && menus.length > 0 ? <DataLoading /> : null}
    </>
  );
});

/* ------------------------------ filtered (same UI, faster loading) ------------------------------ */

type FilteredMenusProps = {
  user: User;
  filterKey: string;
  q: string;
  category: string;
  price: PriceKey;
};

type FilterCacheEntry = {
  items: MenuNode[];
  cursor: string | null;
  hasNextPage: boolean;
  scanned: number;
};

const FILTER_CACHE_LIMIT = 10;

const FilteredMenus = React.memo(function FilteredMenus({
  user,
  filterKey,
  q,
  category,
  price,
}: FilteredMenusProps) {
  const urqlClient = useClient();

  const qNorm = useMemo(() => normalizeStr(q), [q]);

  const [fetching, setFetching] = useState(true);
  const [items, setItems] = useState<MenuNode[]>([]);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // cancellation token
  const cancelRef = useRef(0);

  // streaming state refs (so we don't re-render on every internal step)
  const itemsRef = useRef<MenuNode[]>([]);
  const cursorRef = useRef<string | null>(null);
  const hasNextPageRef = useRef<boolean>(true);
  const scannedRef = useRef<number>(0);

  // demand-driven fetching: keep "desiredMin" (visible + 1) so we can decide if "LoadMore" should show
  const desiredMinRef = useRef<number>(PAGE_SIZE + 1);

  // allow only one active fetch loop per token (prevents overlap/races)
  const activeTokenRef = useRef<number | null>(null);

  // small LRU-ish cache for quick back-and-forth between filters
  const cacheRef = useRef<Map<string, FilterCacheEntry>>(new Map());

  const getCache = useCallback((key: string) => {
    const map = cacheRef.current;
    const hit = map.get(key);
    if (!hit) return null;
    // bump recency
    map.delete(key);
    map.set(key, hit);
    return hit;
  }, []);

  const setCache = useCallback((key: string, value: FilterCacheEntry) => {
    const map = cacheRef.current;

    if (map.has(key)) map.delete(key);
    map.set(key, value);

    while (map.size > FILTER_CACHE_LIMIT) {
      const oldestKey = map.keys().next().value as string | undefined;
      if (!oldestKey) break;
      map.delete(oldestKey);
    }
  }, []);

  const fetchUntilBuffered = useCallback(
    async (token: number, cacheKey: string) => {
      // loop until we have enough to render `visible` AND know if "LoadMore" should show (need +1)
      for (let guard = 0; guard < 200; guard++) {
        if (cancelRef.current !== token) return;

        const desiredMin = desiredMinRef.current;
        const needsMore =
          itemsRef.current.length < desiredMin &&
          hasNextPageRef.current &&
          scannedRef.current < MAX_SCAN;

        if (!needsMore) return;

        const res = await urqlClient
          .query<GetMenusQuery, GetMenusQueryVariables>(
            GetMenusDocument,
            { first: FILTER_BATCH, after: cursorRef.current },
            { requestPolicy: "cache-first" }
          )
          .toPromise();

        if (cancelRef.current !== token) return;

        if (res.error) {
          throw new Error(res.error.message);
        }

        const edges = res.data?.getMenus?.edges ?? [];
        const prevLen = itemsRef.current.length;

        scannedRef.current += edges.length;

        for (const e of edges) {
          const node = e?.node as MenuNode | null | undefined;
          if (!node) continue;
          if (matchesMenu(node, qNorm, category, price)) {
            itemsRef.current.push(node);
          }
        }

        const info = res.data?.getMenus?.pageInfo;
        hasNextPageRef.current = !!info?.hasNextPage;
        cursorRef.current = info?.endCursor ?? null;

        // if cursor is missing, treat as end (safety)
        if (!cursorRef.current) {
          hasNextPageRef.current = false;
        }

        // Update state only if something actually changed OR we're done.
        const hasNewMatches = itemsRef.current.length !== prevLen;
        const finishedNow = !hasNextPageRef.current || scannedRef.current >= MAX_SCAN;

        if (hasNewMatches || finishedNow) {
          setItems([...itemsRef.current]);
        }

        setCache(cacheKey, {
          items: itemsRef.current,
          cursor: cursorRef.current,
          hasNextPage: hasNextPageRef.current,
          scanned: scannedRef.current,
        });
      }
    },
    [urqlClient, qNorm, category, price, setCache]
  );

  const requestMore = useCallback(
    (minCount: number, token: number, cacheKey: string) => {
      desiredMinRef.current = Math.max(desiredMinRef.current, minCount);

      // already running for this token → just raise desiredMinRef, loop will continue
      if (activeTokenRef.current === token) return;

      // start (or restart) loop for this token
      activeTokenRef.current = token;
      setFetching(true);

      (async () => {
        try {
          await fetchUntilBuffered(token, cacheKey);
        } catch (e: any) {
          if (cancelRef.current !== token) return;
          toast.error(e?.message || "Failed to apply filters");
          itemsRef.current = [];
          cursorRef.current = null;
          hasNextPageRef.current = false;
          scannedRef.current = 0;
          setItems([]);
        } finally {
          if (cancelRef.current === token) setFetching(false);
          if (activeTokenRef.current === token) activeTokenRef.current = null;
        }
      })();
    },
    [fetchUntilBuffered]
  );

  // reset on filter change (same behavior as original)
  useEffect(() => {
    const token = ++cancelRef.current;

    setFetching(true);
    setItems([]);
    setVisible(PAGE_SIZE);

    desiredMinRef.current = PAGE_SIZE + 1;

    const cached = getCache(filterKey);

    if (cached) {
      itemsRef.current = cached.items ?? [];
      cursorRef.current = cached.cursor ?? null;
      hasNextPageRef.current = !!cached.hasNextPage;
      scannedRef.current = cached.scanned ?? 0;

      setItems([...itemsRef.current]);
      // fetching may still be needed to ensure buffer (especially if cache was partial)
    } else {
      itemsRef.current = [];
      cursorRef.current = null;
      hasNextPageRef.current = true;
      scannedRef.current = 0;
    }

    // Ensure we can render first page and know if "LoadMore" should show
    requestMore(PAGE_SIZE + 1, token, filterKey);
  }, [filterKey, getCache, requestMore]);

  // when user clicks LoadMore, increase visible and ensure we have enough buffered
  useEffect(() => {
    const token = cancelRef.current;
    requestMore(visible + 1, token, filterKey);
  }, [visible, filterKey, requestMore]);

  const slice = items.slice(0, visible);
  const hasMore = visible < items.length;

  return (
    <>
      {!slice || slice.length === 0 ? (
        <MenuSkeleton />
      ) : (
        <div className="mb-24 space-y-5">
          <div className=" mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  ">
            {slice.map((node) => (
              <MenuModal
                key={node.id}
                menu={node as unknown as Menu}
                user={user as User}
              />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              className="bg-green-600 text-white text-center
      hover:bg-green-200  hover:text-green-700  p-3 rounded  focus:outline-none "
            >
              LoadMore
            </button>
          )}
        </div>
      )}

      {fetching ? <DataLoading /> : null}
    </>
  );
});

/* ------------------------------ main section (same UI) ------------------------------ */

type MenuSectionProps = {
  user: User;
};

// ✅ put useSearchParams inside a component that's actually wrapped by Suspense
const MenuSectionContent = ({ user }: MenuSectionProps) => {
  const searchParams = useSearchParams();

  // ✅ URL is source-of-truth (Categories writes ?category=)
  const q = (searchParams.get("q") ?? "").trim();
  const category = (searchParams.get("category") ?? "all").trim() || "all";
  const price = parsePriceKey(searchParams.get("price"));

  const filtersActive = !!q || category !== "all" || price !== "all";
  const filterKey = useMemo(() => `${q}__${category}__${price}`, [q, category, price]);

  // pagination state (existing)
  const [pageVariables, setPageVariables] = useState<GetMenusQueryVariables[]>(() => [
    { first: PAGE_SIZE, after: null },
  ]);

  // ✅ critical: reset pagination whenever filters change
  useEffect(() => {
    setPageVariables([{ first: PAGE_SIZE, after: null }]);
  }, [filterKey]);

  const onLoadMore = useCallback((after: string) => {
    setPageVariables((prev) => [...prev, { after, first: PAGE_SIZE }]);
  }, []);

  return (
    <section className="mb-24 flex flex-col items-center md:justify-center">
      <div className="text-center">
        <h2 className="text-3xl  leading-tight tracking-tight text-gray-600 sm:text-4xl ">
          Menu
        </h2>

        {filtersActive ? (
          <FilteredMenus
            user={user as User}
            filterKey={filterKey}
            q={q}
            category={category}
            price={price}
          />
        ) : (
          pageVariables.map((variables, i) => (
            <FetchedMenus
              user={user as User}
              key={"" + variables.after}
              variables={variables}
              isLastPage={i === pageVariables.length - 1}
              onLoadMore={onLoadMore}
              pause={false}
            />
          ))
        )}
      </div>
    </section>
  );
};

export default function MenuSection({ user }: MenuSectionProps) {
  return (
    <Suspense fallback={<DataLoading />}>
      <MenuSectionContent user={user} />
    </Suspense>
  );
}
