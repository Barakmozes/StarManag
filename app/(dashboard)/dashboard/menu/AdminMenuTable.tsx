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
        <table className="w-full text-left text-slate-500">
          <thead className="text-xs overflow-x-auto whitespace-nowrap text-slate-700 uppercase bg-slate-100">
            <tr>
              <th scope="col" className="px-6 py-3">
                <input
                  className="w-4 h-4 accent-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  type="checkbox"
                />
              </th>
              <th scope="col" className="px-6 py-3">
                Product
              </th>
              <th scope="col" className="px-6 py-3">
                Title
              </th>
              <th scope="col" className="px-6 py-3">
                Category
              </th>
              <th scope="col" className="px-6 py-3">
                Price
              </th>
              <th scope="col" className="px-6 py-3">
                Pre-View
              </th>
              <th scope="col" className="px-6 py-3">
                Edit
              </th>
              <th scope="col" className="px-6 py-3">
                Delete
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
      </Suspense>
    </TableWrapper>
  );
};

export default AdminMenuTable;
