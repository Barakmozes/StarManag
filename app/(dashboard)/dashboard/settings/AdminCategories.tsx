"use client";

import Image from "next/image";
import { useMemo } from "react";
import { useQuery } from "@urql/next";
import { ReadonlyURLSearchParams, useSearchParams } from "next/navigation";

import TableWrapper from "../Components/TableWrapper";
import AdminAddCategory from "./AdminAddCategory";
import AdminEditCategory from "./AdminEditCategory";
import AdminDeleteCategory from "./AdminDeleteCategory";
import { GetCategoriesDocument, type GetCategoriesQuery } from "@/graphql/generated";

function firstPresent(sp: ReadonlyURLSearchParams, keys: readonly string[]) {
  for (const k of keys) {
    const v = sp.get(k);
    if (v !== null) return v;
  }
  return null;
}

const SEARCH_KEYS = ["q", "search", "query"] as const;

function normalizeStr(x: unknown) {
  return (x ?? "").toString().toLowerCase().trim();
}

const AdminCategories = () => {
  const searchParams = useSearchParams();
  const qParam = (firstPresent(searchParams, SEARCH_KEYS) ?? "").trim();
  const q = normalizeStr(qParam);

  const [{ data, fetching, error }] = useQuery<GetCategoriesQuery>({
    query: GetCategoriesDocument,
    requestPolicy: "cache-and-network",
  });

const categoriesAll = useMemo(() => data?.getCategories ?? [], [data?.getCategories]);


  // ✅ filter by URL search param (no server changes needed)
  const categories = useMemo(() => {
    if (!q) return categoriesAll;

    return categoriesAll.filter((cat) => {
      const title = normalizeStr(cat.title);
      const desc = normalizeStr(cat.desc);
      return title.includes(q) || desc.includes(q);
    });
  }, [categoriesAll, q]);

  return (
    <TableWrapper title="Categories">
      <div className="flex items-center justify-between pb-3 ">
        <p className="text-sm text-gray-500">
          Add / edit / delete categories (stored in DB).
        </p>
        <AdminAddCategory />
      </div>

      {fetching ? (
        <div className="py-6 text-center text-gray-500">Loading categories...</div>
      ) : error ? (
        <div className="py-6 text-center text-red-600">Failed to load categories.</div>
      ) : (
        <table className="w-full text-left text-slate-500 ">
          <thead className="text-xs overflow-x-auto whitespace-nowrap text-slate-700 uppercase bg-slate-100">
            <tr>
              <th scope="col" className="px-6 py-3">
                Image
              </th>
              <th scope="col" className="px-6 py-3">
                Title
              </th>
              <th scope="col" className="px-6 py-3">
                Description
              </th>
              <th scope="col" className="px-6 py-3">
                Edit
              </th>
              <th scope="col" className="px-6 py-3">
                Delete
              </th>
            </tr>
          </thead>

          <tbody>
            {categories.map((cat) => (
              <tr className="bg-white" key={cat.id}>
                <td className="px-6 py-2">
                  <Image
                    src={cat.img}
                    width={44}
                    height={44}
                    alt={cat.title}
                    className="rounded-md object-cover"
                  />
                </td>
                <td className="px-6 py-2 whitespace-nowrap">{cat.title}</td>
                <td className="px-6 py-2">
                  <p className="text-sm text-gray-400 line-clamp-2">{cat.desc}</p>
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <AdminEditCategory category={cat} />
                </td>
                <td className="px-6 py-2 whitespace-nowrap">
                  <AdminDeleteCategory category={cat} />
                </td>
              </tr>
            ))}

            {!categories.length && (
              <tr>
                <td className="px-6 py-6 text-center text-gray-500" colSpan={5}>
                  {q ? "No categories match your search." : "No categories yet. Add one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      <div className="mb-28"></div>
    </TableWrapper>
  );
};

export default AdminCategories;
