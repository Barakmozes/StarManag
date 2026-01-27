"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AiOutlineHeart } from "react-icons/ai";
import { HiOutlineHome, HiOutlineShoppingCart, HiOutlineUser } from "react-icons/hi2";

const FooterMobile = () => {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Static placeholder (you can wire this to Zustand later)
  const cartCount = 0;

  const activeCls = "rounded-full bg-green-600 p-3 text-white shadow";
  const idleCls = "p-3 text-slate-700";

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 z-50 w-full bg-white/95 backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between border-t-2 border-gray-100 px-10 py-4">
        <Link aria-label="Home" href="/" className={isActive("/") ? activeCls : idleCls}>
          <HiOutlineHome className="h-6 w-6" />
        </Link>

        <Link
          aria-label="Favorites"
          href="/user/favorites"
          className={isActive("/user/favorites") ? activeCls : idleCls}
        >
          <AiOutlineHeart className="h-6 w-6" />
        </Link>

        <Link
          aria-label="Cart"
          href="/cart"
          className={isActive("/cart") ? `${activeCls} relative` : "relative " + idleCls}
        >
          <span
            className={[
              "absolute -top-2 left-7 min-w-[18px] rounded-full px-1 text-center text-xs font-semibold",
              isActive("/cart") ? "bg-white/15 text-white" : "bg-green-50 text-green-700",
            ].join(" ")}
          >
            {cartCount}
          </span>
          <HiOutlineShoppingCart className="h-6 w-6" />
        </Link>

        <Link aria-label="Account" href="/user" className={isActive("/user") ? activeCls : idleCls}>
          <HiOutlineUser className="h-6 w-6" />
        </Link>
      </div>
    </nav>
  );
};

export default FooterMobile;
