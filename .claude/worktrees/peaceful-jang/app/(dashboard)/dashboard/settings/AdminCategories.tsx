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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3">
        <p className="text-sm text-gray-500">
          Add / edit / delete categories (stored in DB).
        </p>

        {/* Keep button usable on mobile */}
        <div className="w-full sm:w-auto">
          <AdminAddCategory />
        </div>
      </div>

      {fetching ? (
        <div className="py-6 text-center text-gray-500">Loading categories...</div>
      ) : error ? (
        <div className="py-6 text-center text-red-600">Failed to load categories.</div>
      ) : (
        <>
          {/* Mobile: card layout (no horizontal scroll, actions preserved) */}
          <div className="md:hidden space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0">
                    <Image
                      src={cat.img}
                      width={56}
                      height={56}
                      alt={cat.title}
                      className="h-14 w-14 rounded-md object-cover"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 break-words">{cat.title}</p>
                    <p className="mt-1 text-sm text-gray-400 break-words line-clamp-3">
                      {cat.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-end gap-1">
                  <AdminEditCategory category={cat} />
                  <AdminDeleteCategory category={cat} />
                </div>
              </div>
            ))}

            {!categories.length && (
              <div className="rounded-lg border border-slate-100 bg-white p-6 text-center text-gray-500">
                {q ? "No categories match your search." : "No categories yet. Add one."}
              </div>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden md:block">
            <div className="overflow-x-auto rounded-md border border-slate-100">
              <table className="min-w-[720px] w-full text-left text-slate-500">
                <thead className="text-xs whitespace-nowrap text-slate-700 uppercase bg-slate-100">
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
            </div>
          </div>
        </>
      )}

      {/* Keeps bottom content accessible above mobile browser UI / any fixed bars */}
      <div className="pb-24 md:pb-28" />
    </TableWrapper>
  );
};

export default AdminCategories;
