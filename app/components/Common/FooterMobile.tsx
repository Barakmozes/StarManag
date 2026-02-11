"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { HiHome, HiOutlineShoppingCart, HiUser } from "react-icons/hi2";
import { useCartStore } from "@/lib/store";

export default function FooterMobile() {
  const pathname = usePathname();
  const menus = useCartStore((state) => state.menus);

  useEffect(() => {
    // Load persisted cart state for accurate badge counts on mobile.
    useCartStore.persist.rehydrate();
  }, []);

  const cartCount = menus?.length ?? 0;

  const isActive = useMemo(() => {
    return (href: string) => {
      if (href === "/") return pathname === "/";
      return pathname === href || pathname.startsWith(`${href}/`);
    };
  }, [pathname]);

  const activeCls = "bg-green-200 text-green-600 p-3 rounded-full transition-colors";
  const idleCls =
    "p-3 text-gray-500 hover:bg-green-200 hover:text-green-600 rounded-full transition-colors";

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white shadow-md md:hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-10">
        <Link
          href="/"
          aria-label="Home"
          aria-current={isActive("/") ? "page" : undefined}
          className={isActive("/") ? activeCls : idleCls}
        >
          <HiHome size={24} />
        </Link>

        <Link
          href="/cart"
          aria-label="Cart"
          aria-current={isActive("/cart") ? "page" : undefined}
          className={`relative ${isActive("/cart") ? activeCls : idleCls}`}
        >
          <HiOutlineShoppingCart size={24} />
          <span className="absolute -top-1 -right-1 min-w-[1.25rem] rounded-full bg-green-600 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-white">
            {cartCount}
          </span>
        </Link>

        <Link
          href="/user"
          aria-label="Profile"
          aria-current={isActive("/user") ? "page" : undefined}
          className={isActive("/user") ? activeCls : idleCls}
        >
          <HiUser size={24} />
        </Link>
        {/* Mobile-only Admin dashboard button */}
<div className="md:hidden">
  { (
    <Link
      href="/dashboard"
      className="
        inline-flex items-center justify-center
        rounded-full bg-green-600 px-3 py-1.5
        text-xs font-semibold text-white
        shadow-sm transition
        hover:bg-green-200 hover:text-green-700
        focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500
      "
      aria-label="Go to Dashboard"
    >
     
     Dashboard
      
    </Link>
  )}

 

</div>




      </div>
    </nav>
  );
}
