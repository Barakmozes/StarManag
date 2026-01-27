"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@urql/next";
import { gql } from "graphql-tag";

type DbCategory = { id: string; title: string };
type GetCategoriesForMenuQuery = { getCategories: DbCategory[] };

const GetCategoriesForMenuDocument = gql`
  query GetCategoriesForMenu {
    getCategories {
      id
      title
    }
  }
`;

function useOnClickOutside<T extends HTMLElement>(handler: () => void) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      if (event.target instanceof Node && el.contains(event.target)) return;
      handler();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [handler]);

  return ref;
}

const CategoryDropDown = () => {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const selected = (searchParams.get("category") ?? "all").trim();

  const [{ data, fetching, error }] = useQuery<GetCategoriesForMenuQuery>({
    query: GetCategoriesForMenuDocument,
    requestPolicy: "cache-and-network",
  });

  const categories = useMemo(() => {
    const list = data?.getCategories ?? [];
    return list.slice().sort((a, b) => a.title.localeCompare(b.title));
  }, [data]);

  const updateUrl = (nextCategory: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!nextCategory || nextCategory === "all") {
      params.delete("category");
    } else {
      params.set("category", nextCategory);
    }

    // Reset pagination/search cursor if you later add it
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  };

  return (
    <div ref={wrapperRef} className="relative inline-block bg-white cursor-pointer">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="md:w-auto flex items-center justify-center py-2 px-4 text-sm text-gray-900 focus:outline-none bg-white border-b-2 border-gray-400 hover:bg-gray-100 hover:text-green-700"
        type="button"
      >
        Category
        <HiChevronDown className="ml-1 mr-1.5 w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute mt-2 -mr-1 w-56 bg-white rounded-md shadow-lg z-10">
          <div className="text-center py-3">
            <h3>Filter by Category</h3>
          </div>

          {fetching && (
            <div className="px-3 pb-3 text-sm text-gray-500">Loading…</div>
          )}

          {!fetching && error && (
            <div className="px-3 pb-3 text-sm text-red-600">
              Failed to load categories
            </div>
          )}

          {!fetching && !error && (
            <ul className="space-y-2 text-sm p-3">
              <li className="flex items-center">
                <input
                  type="radio"
                  name="cat-filter"
                  checked={selected === "all"}
                  onChange={() => {
                    updateUrl("all");
                    setIsOpen(false);
                  }}
                  className="w-4 h-4 accent-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-600">
                  All
                </label>
              </li>

              {categories.map((cat) => (
                <li className="flex items-center" key={cat.id}>
                  <input
                    type="radio"
                    name="cat-filter"
                    checked={selected === cat.title}
                    onChange={() => {
                      updateUrl(cat.title);
                      setIsOpen(false);
                    }}
                    className="w-4 h-4 accent-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-600">
                    {cat.title}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryDropDown;
