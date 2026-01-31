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
import { useClient, type OperationResult } from "@urql/next";;
import { useQuery } from "@urql/next";
import { Menu, User } from "@prisma/client";

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

const MAX_FETCH = 10000;

/* ------------------------------ paged (existing UI) ------------------------------ */

type FetchedMenuProps = {
  variables: GetMenusQueryVariables;
  isLastPage: boolean;
  onLoadMore: (after: string) => void;
  user: User;
  /** When filters are active we pause this query */
  pause?: boolean;
};

const FetchedMenus = ({
  variables,
  isLastPage,
  onLoadMore,
  user,
  pause,
}: FetchedMenuProps) => {
  const { first, after } = variables;

  const [{ data, fetching, error }] = useQuery<GetMenusQuery, GetMenusQueryVariables>(
    { query: GetMenusDocument, variables: { first, after }, pause }
  );

  const menus = data?.getMenus?.edges ?? [];
  const endCursor = data?.getMenus?.pageInfo?.endCursor ?? null;
  const hasNextPage = !!data?.getMenus?.pageInfo?.hasNextPage;

  useEffect(() => {
    if (!error) return;
    toast.error("Failed to load menu.");
  }, [error]);

  return (
    <>
      {!menus || menus.length === 0 ? (
        <div className="flex flex-row items-center md:justify-center justify-between mt-12 md:gap-12 overflow-x-auto">
          <DataLoading />
          {Array.from({ length: 10 }).map((_, idx) => (
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
      ) : (
        <div className="mb-24 space-y-5">
          <div className=" mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  ">
            {menus.map((MenuEdge) => (
              <MenuModal
                key={MenuEdge?.node?.id}
                menu={MenuEdge?.node as Menu}
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
};

/* ------------------------------ filtered (same UI) ------------------------------ */

type FilteredMenusProps = {
  user: User;
  filterKey: string;
  q: string;
  category: string;
  price: PriceKey;
};

const FilteredMenus = ({ user, filterKey, q, category, price }: FilteredMenusProps) => {
  const urqlClient = useClient();

  const [fetching, setFetching] = useState(true);
  const [items, setItems] = useState<MenuNode[]>([]);
  const [visible, setVisible] = useState(4); // same "first: 4" feel
  const cancelRef = useRef(0);

  const fetchAllMenus = useCallback(async () => {
    const out: MenuNode[] = [];
    const batch = 200;
    let cursor: string | null = null;

    for (let i = 0; i < 100; i++) {
      const res: OperationResult<GetMenusQuery, GetMenusQueryVariables> =
        await urqlClient
          .query<GetMenusQuery, GetMenusQueryVariables>(GetMenusDocument, {
            first: batch,
            after: cursor,
          })
          .toPromise();

      if (res.error) throw new Error(res.error.message);

      const edges = res.data?.getMenus?.edges ?? [];
      for (const e of edges) if (e?.node) out.push(e.node as MenuNode);

      const info = res.data?.getMenus?.pageInfo;
      if (!info?.hasNextPage) break;

      cursor = info.endCursor ?? null;
      if (!cursor) break;

      if (out.length >= MAX_FETCH) break;
    }

    return out;
  }, [urqlClient]);

  useEffect(() => {
    // reset quickly on every filter change
    setFetching(true);
    setItems([]);
    setVisible(4);

    const token = ++cancelRef.current;

    (async () => {
      try {
        const all = await fetchAllMenus();
        if (cancelRef.current !== token) return;

        const qNorm = normalizeStr(q);
        const next = all.filter((m) => {
          const effectivePrice = (m.sellingPrice ?? m.price ?? 0) as number;

          const matchesQ =
            !qNorm ||
            [m.title, m.category, m.shortDescr, m.longDescr ?? ""].some((x) =>
              normalizeStr(x).includes(qNorm)
            );

          const matchesCategory = category === "all" || m.category === category;
          const matchesPrice = priceInRange(effectivePrice, price);

          return matchesQ && matchesCategory && matchesPrice;
        });

        if (cancelRef.current !== token) return;
        setItems(next);
      } catch (e: any) {
        if (cancelRef.current !== token) return;
        toast.error(e?.message || "Failed to apply filters");
        setItems([]);
      } finally {
        if (cancelRef.current === token) setFetching(false);
      }
    })();
  }, [filterKey, fetchAllMenus, q, category, price]);

  const slice = items.slice(0, visible);
  const hasMore = visible < items.length;

  return (
    <>
      {!slice || slice.length === 0 ? (
        <div className="flex flex-row items-center md:justify-center justify-between mt-12 md:gap-12 overflow-x-auto">
          <DataLoading />
          {Array.from({ length: 10 }).map((_, idx) => (
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
      ) : (
        <div className="mb-24 space-y-5">
          <div className=" mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4  ">
            {slice.map((node) => (
              <MenuModal key={node.id} menu={node as unknown as Menu} user={user as User} />
            ))}
          </div>

          {hasMore && (
            <button
              onClick={() => setVisible((v) => v + 4)}
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
};

/* ------------------------------ main section (same UI) ------------------------------ */

type MenuSectionProps = {
  user: User;
};

const MenuSection = ({ user }: MenuSectionProps) => {
  const searchParams = useSearchParams();

  // ✅ URL is source-of-truth (Categories writes ?category=)
  const q = (searchParams.get("q") ?? "").trim();
  const category = (searchParams.get("category") ?? "all").trim() || "all";
  const price = parsePriceKey(searchParams.get("price"));

  const filtersActive = !!q || category !== "all" || price !== "all";
  const filterKey = useMemo(() => `${q}__${category}__${price}`, [q, category, price]);

  // pagination state (existing)
  const [pageVariables, setPageVariables] = useState([
    { first: 4, after: null as null | string },
  ]);

  // ✅ critical: reset pagination whenever filters change
  // prevents "stuck on old page" + prevents mixing results after fast category changes
  useEffect(() => {
    setPageVariables([{ first: 4, after: null }]);
  }, [filterKey]);

  return (
    <Suspense fallback={<DataLoading />}>
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
                onLoadMore={(after) =>
                  setPageVariables((prev) => [...prev, { after, first: 4 }])
                }
                pause={false}
              />
            ))
          )}
        </div>
      </section>
    </Suspense>
  );
};

export default MenuSection;
