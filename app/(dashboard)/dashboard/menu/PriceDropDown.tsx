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
    <div ref={wrapperRef} className="relative inline-block bg-white cursor-pointer">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="md:w-auto flex items-center justify-center py-2 px-4 text-sm text-gray-900 focus:outline-none bg-white border-b-2 border-gray-400 hover:bg-gray-100 hover:text-green-700"
        type="button"
      >
        Price
        <HiChevronDown className="ml-1 mr-1.5 w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute mt-2 -mr-1 w-56 bg-white rounded-md shadow-lg z-10">
          <div className="text-center py-3">
            <h3>Filter by Price</h3>
          </div>

          <ul className="space-y-2 text-sm p-3">
            {options.map((key) => (
              <li className="flex items-center" key={key}>
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
                <label className="ml-2 text-sm font-medium text-gray-600">
                  {key === "all" ? "All" : key === "15+" ? "$15+" : `$${key}`}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PriceDropDown;
