"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@urql/next";

import AdminPreviewMenu from "./AdminPreviewMenu";
import AdminEditMenu from "./AdminEditMenu";
import AdminDeleteMenu from "./AdminDeleteMenu";

import {
  GetMenusDocument,
  GetMenusQuery,
  GetMenusQueryVariables,
} from "@/graphql/generated";

export type MenuRow = GetMenusQuery["getMenus"]["edges"][number] extends infer E
  ? E extends { node: infer N }
    ? N
    : never
  : never;

type AdminFetchedMenusProps = {
  variables: GetMenusQueryVariables;
  isAdminLastPage: boolean;
  onLoadMore: (after: string) => void;
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function getEffectivePrice(menu: any): number {
  return typeof menu?.sellingPrice === "number" ? menu.sellingPrice : menu.price;
}

function matchesPrice(price: number, priceKey: string): boolean {
  const key = priceKey.trim();

  if (!key || key === "all") return true;

  if (key === "15+") return price >= 15;

  // "0-5" | "6-10" | "11-15"
  const m = key.match(/^(\d+)\s*-\s*(\d+)$/);
  if (!m) return true;

  const min = Number(m[1]);
  const max = Number(m[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return true;

  return price >= min && price <= max;
}

export const AdminFetchedMenus = ({
  variables,
  isAdminLastPage,
  onLoadMore,
}: AdminFetchedMenusProps) => {
  const searchParams = useSearchParams();

  const q = normalize(searchParams.get("q") ?? "");
  const category = (searchParams.get("category") ?? "all").trim();
  const priceKey = (searchParams.get("price") ?? "all").trim();

  const { first, after } = variables;

  const [{ data, fetching, error }] = useQuery<GetMenusQuery, GetMenusQueryVariables>(
    {
      query: GetMenusDocument,
      variables: { first, after },
      requestPolicy: "cache-and-network",
    }
  );

const edges = useMemo(() => data?.getMenus?.edges ?? [], [data?.getMenus?.edges]);

  const filteredEdges = useMemo(() => {
    return edges.filter((edge) => {
      if (!edge?.node) return false;

      const node = edge.node as any;

      // Category filter (exact match by stored string)
      if (category && category !== "all" && node.category !== category) return false;

      // Price filter (uses sellingPrice if exists)
      const price = getEffectivePrice(node);
      if (!matchesPrice(price, priceKey)) return false;

      // Search filter (title + descr + category + price)
      if (q) {
        const haystack = [
          node.title,
          node.shortDescr,
          node.longDescr,
          node.category,
          String(price),
        ]
          .filter(Boolean)
          .join(" ");
        if (!normalize(haystack).includes(q)) return false;
      }

      return true;
    });
  }, [edges, category, priceKey, q]);

  const endCursor = data?.getMenus?.pageInfo?.endCursor ?? null;
  const hasNextPage = Boolean(data?.getMenus?.pageInfo?.hasNextPage);

  const colCount = 6;

  return (
    <>
      <tbody>
        {fetching && edges.length === 0 && (
          <tr className="bg-white">
            <td className="px-3 sm:px-6 py-4 text-sm text-gray-500" colSpan={colCount}>
              Loading menus…
            </td>
          </tr>
        )}

        {!fetching && error && (
          <tr className="bg-white">
            <td className="px-3 sm:px-6 py-4 text-sm text-red-600" colSpan={colCount}>
              Failed to load menus. Please refresh.
            </td>
          </tr>
        )}

        {!fetching && !error && filteredEdges.length === 0 && (
          <tr className="bg-white">
            <td className="px-3 sm:px-6 py-4 text-sm text-gray-500" colSpan={colCount}>
              No menus match your current filters.
            </td>
          </tr>
        )}

        {filteredEdges.map((edge) => {
          const menu = edge?.node as any;
          if (!menu?.id) return null;

          const effectivePrice = getEffectivePrice(menu);

          return (
            <tr className="bg-white border-b last:border-b-0" key={menu.id}>
              {/* Selection checkbox: desktop only */}
              <td className="hidden md:table-cell px-3 sm:px-6 py-2 align-top">
                <input
                  className="w-4 h-4 accent-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  type="checkbox"
                  aria-label={`Select ${menu.title}`}
                />
              </td>

              <td className="px-3 sm:px-6 py-2 align-top">
                <Image
                  src={menu.image}
                  width={40}
                  height={40}
                  alt={menu.title}
                  className="h-10 w-10 rounded-md object-cover"
                />
              </td>

              <td className="px-3 sm:px-6 py-2 align-top">
                <div className="font-medium text-slate-700 break-words">
                  {menu.title}
                </div>

                {/* Small helper line on mobile to keep rows informative without extra columns */}
                {menu.shortDescr ? (
                  <div className="mt-0.5 text-xs text-slate-400 sm:hidden truncate max-w-[12rem]">
                    {menu.shortDescr}
                  </div>
                ) : null}
              </td>

              <td className="px-3 sm:px-6 py-2 align-top">
                <span className="inline-flex bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">
                  {menu.category}
                </span>
              </td>

              <td className="px-3 sm:px-6 py-2 align-top whitespace-nowrap">
                {menu.sellingPrice ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                    <span className="text-slate-400 line-through">${menu.price}</span>
                    <span className="text-green-700 font-semibold">
                      ${effectivePrice}
                    </span>
                  </div>
                ) : (
                  <span>${menu.price}</span>
                )}
              </td>

              {/* Combined actions column */}
              <td className="px-3 sm:px-6 py-2 align-top">
                <div className="flex items-center justify-end sm:justify-start gap-1 sm:gap-2">
                  <AdminPreviewMenu menu={menu} />
                  <AdminEditMenu menu={menu} />
                  <AdminDeleteMenu menu={menu} />
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>

      <tfoot>
        <tr>
          <td className="px-3 sm:px-6 py-3" colSpan={colCount}>
            {isAdminLastPage && hasNextPage && endCursor && (
              <div className="flex justify-center">
                <button
                  onClick={() => onLoadMore(endCursor)}
                  className="min-h-[44px] w-full sm:w-auto bg-green-600 text-white text-center hover:bg-green-200 hover:text-green-700 py-2 px-4 rounded focus:outline-none"
                >
                  Load More ...
                </button>
              </div>
            )}
          </td>
        </tr>
      </tfoot>
    </>
  );
};
