"use client";

/* eslint-disable @next/next/no-img-element */

import React, {
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
import gql from "graphql-tag";
import toast from "react-hot-toast";

import Modal from "../Common/Modal";
import { categoriesData } from "@/data/categories-data";
import type { Category as GqlCategory } from "@/graphql/generated";
import { useMenuFilterStore } from "@/lib/menuCategory";

const CATEGORY_PARAM = "category";

/**
 * DB-backed categories query (Prisma -> Pothos -> Apollo -> Urql).
 * Uses getCategories from your GraphQL schema.
 */
const GetCategoriesForHomeDocument = gql`
  query GetCategoriesForHome {
    getCategories {
      id
      title
      desc
      img
    }
  }
`;

type GetCategoriesForHomeQuery = {
  getCategories: Array<Pick<GqlCategory, "id" | "title" | "desc" | "img">>;
};

type CategoryOption = {
  /** Stable react key */
  id: string;
  /** Display title */
  title: string;
  /** Image URL or public path */
  img: string;
  /** Optional description */
  desc?: string;
  /**
   * Value used to filter menus.
   *
   * IMPORTANT:
   * Your current Menu query returns Menu.category as a STRING (legacy),
   * so we use Category.title to match it.
   *
   * If/when your Menu nodes include categoryId or Category { id },
   * you can switch this to `filterValue: c.id`.
   */
  filterValue: string | "all";
};

function isRemoteUrl(src: string) {
  return /^https?:\/\//i.test(src);
}

function normalizeImgSrc(src: string) {
  if (!src) return "";
  if (isRemoteUrl(src)) return src;
  if (src.startsWith("/")) return src;
  // handle "img/categories/pizza.png" without leading slash
  return `/${src}`;
}

function buildNextUrl(pathname: string, currentQuery: string, nextCategory: string | null) {
  const params = new URLSearchParams(currentQuery);

  if (!nextCategory) params.delete(CATEGORY_PARAM);
  else params.set(CATEGORY_PARAM, nextCategory);

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

const Categories = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isAllModalOpen, setIsAllModalOpen] = useState(false);

  // Filter store (shared with Menu rendering)
  const selectedCategoryId = useMenuFilterStore((s) => s.selectedCategoryId);
  const setCategory = useMenuFilterStore((s) => s.setCategory);
  const clearCategory = useMenuFilterStore((s) => s.clearCategory);
  const rehydrate = useMenuFilterStore((s) => s.rehydrate);

  const urlCategory = searchParams.get(CATEGORY_PARAM);

  const [{ data, fetching, error }, refetch] = useQuery<GetCategoriesForHomeQuery>({
    query: GetCategoriesForHomeDocument,
    requestPolicy: "cache-and-network",
  });

  /**
   * Persist middleware uses skipHydration across your app.
   * Rehydrate client-side to keep behavior consistent with existing patterns.
   */
  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  /**
   * Source-of-truth = URL param.
   * Keep the store aligned with ?category=...
   *
   * The ref prevents store updates "fighting" a click before the URL updates.
   */
  const lastUrlCategoryRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastUrlCategoryRef.current === urlCategory) return;
    lastUrlCategoryRef.current = urlCategory;

    if (urlCategory) setCategory(urlCategory);
    else clearCategory();
  }, [urlCategory, setCategory, clearCategory]);

  // Show a toast once on error (and still render Retry UI)
  const hasShownErrorToastRef = useRef(false);
  useEffect(() => {
    if (!error || hasShownErrorToastRef.current) return;
    hasShownErrorToastRef.current = true;
    toast.error("Failed to load categories. Please try again.", { duration: 5000 });
  }, [error]);

  const categories: CategoryOption[] = useMemo(() => {
  const hasTitle = (t: unknown): t is string =>
    typeof t === "string" && t.trim().length > 0;

  const dbCats: CategoryOption[] = (data?.getCategories ?? [])
    .filter((c): c is NonNullable<typeof c> => !!c && hasTitle(c.title))
    .map((c) => ({
      id: c.id,
      title: c.title, // ✅ string
      desc: c.desc ?? undefined,
      img: normalizeImgSrc(c.img ?? ""),
      filterValue: c.title, // ✅ string
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const fallbackCats: CategoryOption[] = categoriesData
    .filter((c): c is (typeof categoriesData)[number] & { title: string } =>
      hasTitle(c.title)
    )
    .map((c) => ({
      id: String(c.id),
      title: c.title, // ✅ string
      img: normalizeImgSrc((c as any).imageSrc ?? ""),
      filterValue: c.title, // ✅ string
    }));

  const list = dbCats.length ? dbCats : fallbackCats;

  return [
    {
      id: "all",
      title: "All",
      img: normalizeImgSrc("/img/categories/fast-food.png"),
      filterValue: "all",
    },
    ...list,
  ];
}, [data?.getCategories]);


  const setCategoryInUrl = useCallback(
    (next: string | null) => {
      const nextUrl = buildNextUrl(pathname, searchParams.toString(), next);

      // Matches your project style: url mutations + router.refresh
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
        router.refresh();
      });
    },
    [pathname, router, searchParams]
  );

  const onSelectCategory = useCallback(
    (filterValue: CategoryOption["filterValue"], titleForToast?: string) => {
      if (filterValue === "all") {
        clearCategory();
        setCategoryInUrl(null);
        toast.success("Showing all menu items", { duration: 2500 });
      } else {
        setCategory(filterValue);
        setCategoryInUrl(filterValue);
        toast.success(`Filtered by: ${titleForToast ?? filterValue}`, { duration: 2500 });
      }

      // Close modal if open (nice UX on mobile)
      setIsAllModalOpen(false);

      // Optional: if you add an id to Menu section, you can scroll to it
      // document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
    },
    [clearCategory, setCategory, setCategoryInUrl]
  );

  const activeValue = selectedCategoryId ?? "all";

  const CategoryChip = ({
    option,
    size = "sm",
  }: {
    option: CategoryOption;
    size?: "sm" | "md";
  }) => {
    const isActive =
      option.filterValue === "all"
        ? activeValue === "all"
        : activeValue === option.filterValue;

    const base = size === "md" ? "h-20 w-20" : "h-16 w-16";

    return (
      <button
        type="button"
        onClick={() => onSelectCategory(option.filterValue, option.title)}
        aria-pressed={isActive}
        className={[
          "flex flex-col items-center justify-center shrink-0 overflow-hidden rounded-full p-3 transition",
          base,
          isActive
            ? "bg-green-100 ring-2 ring-green-500"
            : "hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
        ].join(" ")}
      >
        <div className="h-10 w-10 flex items-center justify-center">
          {option.img ? (
            isRemoteUrl(option.img) ? (
              <img
                src={option.img}
                alt={`${option.title} category`}
                className="h-10 w-10 object-contain"
                loading="lazy"
              />
            ) : (
              <Image
                src={option.img}
                width={40}
                height={40}
                alt={`${option.title} category`}
                className="h-10 w-10 object-contain"
              />
            )
          ) : (
            <div className="h-10 w-10 rounded-full bg-slate-200" aria-hidden="true" />
          )}
        </div>

        <div className="whitespace-nowrap text-xs mt-1">
          <span className={isActive ? "font-semibold text-green-800" : "text-gray-700"}>
            {option.title}
          </span>
        </div>
      </button>
    );
  };

  return (
    <section id="menuSection" className="my-16">
      <div className="max-w-2xl mx-auto my-5 text-center relative">
  <h2 className="text-3xl leading-tight tracking-tight text-gray-600 sm:text-4xl">
    Categories
  </h2>

  {/* subtle actions + status (top-right) */}
  <div className="absolute -top-1 right-0 flex items-center gap-2">
    <button
      type="button"
      onClick={() => setIsAllModalOpen(true)}
      className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-4
                 decoration-gray-200 hover:decoration-gray-400 transition"
    >
      Browse all
    </button>

    {activeValue !== "all" && (
      <>
        <span className="text-gray-300">•</span>

        <button
          type="button"
          onClick={() => onSelectCategory("all", "All")}
          className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-4
                     decoration-gray-200 hover:decoration-gray-400 transition"
        >
          Clear filter
        </button>

        <span className="text-gray-300">•</span>

        <span className="text-[11px] text-gray-400 whitespace-nowrap">
          Showing: <span className="font-semibold text-gray-600">{activeValue}</span>
        </span>
      </>
    )}
  </div>
</div>


      {/* Horizontal categories row */}
      <div className="flex flex-row items-center md:justify-center justify-between mt-12 md:gap-12 overflow-x-auto">
        {fetching && (!data?.getCategories || data.getCategories.length === 0) ? (
          <>
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={`cat-skel-${idx}`}
                className="flex flex-col rounded-full h-16 w-16 items-center justify-center p-3 shrink-0 overflow-hidden bg-transparent"
                aria-hidden="true"
              >
                <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
                <div className="mt-1 h-3 w-12 rounded bg-slate-200 animate-pulse" />
              </div>
            ))}
          </>
        ) : (
          categories.map((cat) => <CategoryChip key={cat.id} option={cat} />)
        )}
      </div>

      {/* Error + Retry */}
      {error && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-sm text-red-600">Couldn&apos;t load categories.</p>
          <button
            type="button"
            onClick={() => {
              hasShownErrorToastRef.current = false;
              refetch({ requestPolicy: "network-only" });
            }}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Retry
          </button>
        </div>
      )}

      {/* Modal: full categories list */}
      <Modal isOpen={isAllModalOpen} closeModal={() => setIsAllModalOpen(false)}>
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">All Categories</h3>
              <p className="text-sm text-gray-500">Pick a category to filter the menu.</p>
            </div>

            {activeValue !== "all" && (
              <button
                type="button"
                onClick={() => onSelectCategory("all", "All")}
                className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {categories.map((cat) => (
              <CategoryChip key={`modal-${cat.id}`} option={cat} size="md" />
            ))}
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default Categories;
