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
  id: string;
  title: string;
  img: string;
  desc?: string;
  filterValue: string | "all";
  isRemote: boolean;
};

const isNonEmptyString = (val: unknown): val is string =>
  typeof val === "string" && val.trim().length > 0;

function isRemoteUrl(src: string) {
  return /^https?:\/\//i.test(src);
}

function normalizeImgSrc(src: string) {
  if (!src) return "";
  if (isRemoteUrl(src)) return src;
  if (src.startsWith("/")) return src;
  return `/${src}`;
}

function buildNextUrl(
  pathname: string,
  currentQuery: string,
  nextCategory: string | null
) {
  const params = new URLSearchParams(currentQuery);

  if (!nextCategory) params.delete(CATEGORY_PARAM);
  else params.set(CATEGORY_PARAM, nextCategory);

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

const FALLBACK_CATEGORIES: CategoryOption[] = (() => {
  const list = (categoriesData as any[])
    .filter((c) => isNonEmptyString(c?.title))
    .map((c) => {
      const rawImg =
        (c?.imageSrc as string | undefined) ??
        (c?.img as string | undefined) ??
        (c?.image as string | undefined) ??
        "";

      const img = normalizeImgSrc(rawImg);
      return {
        id: String(c?.id ?? c?.title),
        title: String(c.title),
        img,
        filterValue: String(c.title),
        isRemote: isRemoteUrl(img),
      } satisfies CategoryOption;
    });

  return list;
})();

const ALL_OPTION: CategoryOption = (() => {
  const img = normalizeImgSrc("/img/categories/fast-food.png");
  return {
    id: "all",
    title: "All",
    img,
    filterValue: "all",
    isRemote: isRemoteUrl(img),
  };
})();

const CategoryChip = React.memo(function CategoryChip({
  option,
  size = "sm",
  isActive,
  onSelect,
}: {
  option: CategoryOption;
  size?: "sm" | "md";
  isActive: boolean;
  onSelect: (
    filterValue: CategoryOption["filterValue"],
    titleForToast?: string
  ) => void;
}) {
  const base = size === "md" ? "h-20 w-20" : "h-16 w-16";

  return (
    <button
      type="button"
      onClick={() => onSelect(option.filterValue, option.title)}
      aria-pressed={isActive}
      className={[
        "flex flex-col items-center justify-center shrink-0 overflow-hidden rounded-full p-3 transition snap-start",
        base,
        isActive
          ? "bg-green-100 ring-2 ring-green-500"
          : "hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
      ].join(" ")}
    >
      <div className="h-10 w-10 flex items-center justify-center">
        {option.img ? (
          option.isRemote ? (
            <img
              src={option.img}
              alt={`${option.title} category`}
              className="h-10 w-10 object-contain"
              loading="lazy"
              decoding="async"
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
});

const Categories = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [isAllModalOpen, setIsAllModalOpen] = useState(false);

  const selectedCategoryId = useMenuFilterStore((s) => s.selectedCategoryId);
  const setCategory = useMenuFilterStore((s) => s.setCategory);
  const clearCategory = useMenuFilterStore((s) => s.clearCategory);
  const rehydrate = useMenuFilterStore((s) => s.rehydrate);

  const urlCategory = searchParams.get(CATEGORY_PARAM);

  const [{ data, fetching, error }, refetch] = useQuery<GetCategoriesForHomeQuery>({
    query: GetCategoriesForHomeDocument,
    requestPolicy: "cache-and-network",
  });

  useEffect(() => {
    rehydrate();
  }, [rehydrate]);

  const lastUrlCategoryRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastUrlCategoryRef.current === urlCategory) return;
    lastUrlCategoryRef.current = urlCategory;

    if (urlCategory) setCategory(urlCategory);
    else clearCategory();
  }, [urlCategory, setCategory, clearCategory]);

  const hasShownErrorToastRef = useRef(false);
  useEffect(() => {
    if (!error || hasShownErrorToastRef.current) return;
    hasShownErrorToastRef.current = true;
    toast.error("Failed to load categories. Please try again.", { duration: 5000 });
  }, [error]);

  const categories: CategoryOption[] = useMemo(() => {
    const dbCats: CategoryOption[] = (data?.getCategories ?? [])
      .filter((c): c is NonNullable<typeof c> => !!c && isNonEmptyString(c.title))
      .map((c) => {
        const img = normalizeImgSrc(c.img ?? "");
        return {
          id: c.id,
          title: c.title,
          desc: c.desc ?? undefined,
          img,
          filterValue: c.title,
          isRemote: isRemoteUrl(img),
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    const list = dbCats.length ? dbCats : FALLBACK_CATEGORIES;
    return [ALL_OPTION, ...list];
  }, [data?.getCategories]);

  const setCategoryInUrl = useCallback(
    (next: string | null) => {
      const nextUrl = buildNextUrl(pathname, searchParamsString, next);
      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, searchParamsString]
  );

  const activeValue = selectedCategoryId ?? "all";
  const activeValueRef = useRef(activeValue);
  useEffect(() => {
    activeValueRef.current = activeValue;
  }, [activeValue]);

  const onSelectCategory = useCallback(
    (filterValue: CategoryOption["filterValue"], titleForToast?: string) => {
      const currentActive = activeValueRef.current ?? "all";
      const nextActive = filterValue === "all" ? "all" : filterValue;

      if (nextActive === currentActive) {
        setIsAllModalOpen(false);
        return;
      }

      if (filterValue === "all") {
        clearCategory();
        setCategoryInUrl(null);
        toast.success("Showing all menu items", { duration: 2500 });
      } else {
        setCategory(filterValue);
        setCategoryInUrl(filterValue);
        toast.success(`Filtered by: ${titleForToast ?? filterValue}`, { duration: 2500 });
      }

      setIsAllModalOpen(false);
    },
    [clearCategory, setCategory, setCategoryInUrl]
  );

  const shouldShowSkeleton =
    fetching && (!data?.getCategories || data.getCategories.length === 0);

  return (
    <section id="menuSection" className="my-16">
      <div className="max-w-2xl mx-auto my-5 text-center relative px-4 sm:px-0">
        <h2 className="text-3xl leading-tight tracking-tight text-gray-600 sm:text-4xl">
          Categories
        </h2>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:mt-0 sm:absolute sm:-top-1 sm:right-0 sm:flex-nowrap sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => setIsAllModalOpen(true)}
            className="inline-flex min-h-11 items-center justify-center rounded px-2 py-1.5 text-xs text-gray-400 hover:text-gray-700 underline underline-offset-4 decoration-gray-200 hover:decoration-gray-400 transition hover:bg-slate-50"
          >
            Browse all
          </button>

          {activeValue !== "all" && (
            <>
              <span className="text-gray-300 hidden sm:inline">•</span>

              <button
                type="button"
                onClick={() => onSelectCategory("all", "All")}
                className="inline-flex min-h-11 items-center justify-center rounded px-2 py-1.5 text-xs text-gray-400 hover:text-gray-700 underline underline-offset-4 decoration-gray-200 hover:decoration-gray-400 transition hover:bg-slate-50"
              >
                Clear filter
              </button>

              <span className="text-gray-300 hidden sm:inline">•</span>

              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                Showing: <span className="font-semibold text-gray-600">{activeValue}</span>
              </span>
            </>
          )}
        </div>
      </div>

      <div className="mt-8 flex flex-row items-center gap-3 overflow-x-auto px-4 pb-2 sm:mt-12 sm:gap-6 md:justify-center md:gap-12 md:px-0 snap-x snap-mandatory">
        {shouldShowSkeleton ? (
          <>
            {Array.from({ length: 10 }).map((_, idx) => (
              <div
                key={`cat-skel-${idx}`}
                className="flex flex-col rounded-full h-16 w-16 items-center justify-center p-3 shrink-0 overflow-hidden bg-transparent snap-start"
                aria-hidden="true"
              >
                <div className="h-10 w-10 rounded-full bg-slate-200 animate-pulse" />
                <div className="mt-1 h-3 w-12 rounded bg-slate-200 animate-pulse" />
              </div>
            ))}
          </>
        ) : (
          categories.map((cat) => {
            const isActive =
              cat.filterValue === "all"
                ? activeValue === "all"
                : activeValue === cat.filterValue;

            return (
              <CategoryChip
                key={cat.id}
                option={cat}
                isActive={isActive}
                onSelect={onSelectCategory}
              />
            );
          })
        )}
      </div>

      {error && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <p className="text-sm text-red-600">Couldn&apos;t load categories.</p>
          <button
            type="button"
            onClick={() => {
              hasShownErrorToastRef.current = false;
              refetch({ requestPolicy: "network-only" });
            }}
            className="min-h-11 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Retry
          </button>
        </div>
      )}

      <Modal isOpen={isAllModalOpen} closeModal={() => setIsAllModalOpen(false)}>
        <div className="p-4 max-h-[90vh] overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+24px)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">All Categories</h3>
              <p className="text-sm text-gray-500">Pick a category to filter the menu.</p>
            </div>

            {activeValue !== "all" && (
              <button
                type="button"
                onClick={() => onSelectCategory("all", "All")}
                className="min-h-11 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500"
              >
                Clear
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {categories.map((cat) => {
              const isActive =
                cat.filterValue === "all"
                  ? activeValue === "all"
                  : activeValue === cat.filterValue;

              return (
                <CategoryChip
                  key={`modal-${cat.id}`}
                  option={cat}
                  size="md"
                  isActive={isActive}
                  onSelect={onSelectCategory}
                />
              );
            })}
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default Categories;
