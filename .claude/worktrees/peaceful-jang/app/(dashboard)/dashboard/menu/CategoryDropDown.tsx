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
    <div ref={wrapperRef} className="relative inline-block bg-white">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="min-h-[44px] md:w-auto inline-flex items-center justify-center gap-1 py-2 px-4 text-sm text-gray-900 focus:outline-none bg-white border-b-2 border-gray-400 hover:bg-gray-100 hover:text-green-700"
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        Category
        <HiChevronDown className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[min(90vw,14rem)] sm:w-56 bg-white rounded-md shadow-lg z-10 overflow-hidden">
          <div className="text-center py-3 px-3 border-b">
            <h3 className="text-sm font-semibold text-slate-700">
              Filter by Category
            </h3>
          </div>

          <div className="max-h-[70vh] overflow-auto p-2">
            {fetching && (
              <div className="px-2 pb-2 text-sm text-gray-500">Loading…</div>
            )}

            {!fetching && error && (
              <div className="px-2 pb-2 text-sm text-red-600">
                Failed to load categories
              </div>
            )}

            {!fetching && !error && (
              <ul className="space-y-1 text-sm">
                <li>
                  <label className="flex items-center gap-3 rounded-md px-2 py-2 min-h-[44px] hover:bg-slate-50 cursor-pointer">
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
                    <span className="text-sm font-medium text-gray-600">All</span>
                  </label>
                </li>

                {categories.map((cat) => (
                  <li key={cat.id}>
                    <label className="flex items-center gap-3 rounded-md px-2 py-2 min-h-[44px] hover:bg-slate-50 cursor-pointer">
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
                      <span className="text-sm font-medium text-gray-600 break-words">
                        {cat.title}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryDropDown;
