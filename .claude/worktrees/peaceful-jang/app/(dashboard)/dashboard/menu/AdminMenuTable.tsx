"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { AdminFetchedMenus } from "./AdminFetchedMenus";
import TableWrapper from "../Components/TableWrapper";
import DataLoading from "@/app/components/Common/ClientLoaders";

const basePage = (first: number) => [{ first, after: null as null | string }];

const AdminMenuTable = () => {
  const searchParams = useSearchParams();

  // Any filter change should reset pagination back to the first page.
  const filtersKey = useMemo(() => {
    const q = (searchParams.get("q") ?? "").trim();
    const category = (searchParams.get("category") ?? "all").trim();
    const price = (searchParams.get("price") ?? "all").trim();
    return `${q}|${category}|${price}`;
  }, [searchParams]);

  const pageSize = useMemo(() => {
    const q = (searchParams.get("q") ?? "").trim();
    const category = (searchParams.get("category") ?? "").trim();
    const price = (searchParams.get("price") ?? "").trim();
    const hasFilters = Boolean(q || category || price);
    return hasFilters ? 20 : 8;
  }, [searchParams]);

  const [pageVariables, setPageVariables] = useState(basePage(pageSize));

  useEffect(() => {
    setPageVariables(basePage(pageSize));
  }, [filtersKey, pageSize]);

  return (
    <TableWrapper title={"All Menus"}>
      <Suspense fallback={DataLoading()}>
        <div className="w-full">
          {/* Mobile affordance for dense tables */}
          <p className="md:hidden text-xs text-slate-500 px-1 pb-2">
            Tip: swipe horizontally if you need to see more.
          </p>

          <div className="w-full overflow-x-auto pb-2">
            <table className="w-full text-left text-slate-500">
              <thead className="text-xs whitespace-nowrap text-slate-700 uppercase bg-slate-100">
                <tr>
                  {/* Keep selection UI on desktop; hide on mobile to prevent crowding */}
                  <th scope="col" className="hidden md:table-cell px-3 sm:px-6 py-3">
                    <input
                      className="w-4 h-4 accent-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                      type="checkbox"
                      aria-label="Select all menus"
                    />
                  </th>

                  <th scope="col" className="px-3 sm:px-6 py-3">
                    Product
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-3">
                    Title
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-3">
                    Category
                  </th>
                  <th scope="col" className="px-3 sm:px-6 py-3">
                    Price
                  </th>

                  {/* Combine actions into one column to reduce width on mobile */}
                  <th
                    scope="col"
                    className="px-3 sm:px-6 py-3 text-right sm:text-left"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              {pageVariables.map((variables, i) => (
                <AdminFetchedMenus
                  key={"" + variables.after}
                  variables={variables}
                  isAdminLastPage={i === pageVariables.length - 1}
                  onLoadMore={(after) =>
                    setPageVariables([...pageVariables, { after, first: pageSize }])
                  }
                />
              ))}
            </table>
          </div>
        </div>
      </Suspense>
    </TableWrapper>
  );
};

export default AdminMenuTable;
