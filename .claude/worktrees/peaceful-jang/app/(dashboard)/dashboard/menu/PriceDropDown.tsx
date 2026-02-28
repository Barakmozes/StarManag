"use client";

import { useEffect, useRef, useState } from "react";
import { HiChevronDown } from "react-icons/hi2";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

const PriceDropDown = () => {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useOnClickOutside<HTMLDivElement>(() => setIsOpen(false));

  const selected = (searchParams.get("price") ?? "all").trim();
  const options = ["all", "0-5", "6-10", "11-15", "15+"];

  const updateUrl = (nextPrice: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!nextPrice || nextPrice === "all") {
      params.delete("price");
    } else {
      params.set("price", nextPrice);
    }

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
        Price
        <HiChevronDown className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[min(90vw,14rem)] sm:w-56 bg-white rounded-md shadow-lg z-10 overflow-hidden">
          <div className="text-center py-3 px-3 border-b">
            <h3 className="text-sm font-semibold text-slate-700">Filter by Price</h3>
          </div>

          <div className="max-h-[70vh] overflow-auto p-2">
            <ul className="space-y-1 text-sm">
              {options.map((key) => (
                <li key={key}>
                  <label className="flex items-center gap-3 rounded-md px-2 py-2 min-h-[44px] hover:bg-slate-50 cursor-pointer">
                    <input
                      type="radio"
                      name="price-filter"
                      checked={selected === key}
                      onChange={() => {
                        updateUrl(key);
                        setIsOpen(false);
                      }}
                      className="w-4 h-4 accent-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <span className="text-sm font-medium text-gray-600">
                      {key === "all" ? "All" : key === "15+" ? "$15+" : `$${key}`}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceDropDown;
