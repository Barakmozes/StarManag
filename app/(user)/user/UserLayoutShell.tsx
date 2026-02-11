"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { HiBars3, HiXMark } from "react-icons/hi2";
import { User } from "@prisma/client";

import Header from "@/app/components/Common/Header";
import SideBar from "@/app/components/Common/SideBar";

type Props = {
  user: User;
  children: ReactNode;
};

export default function UserLayoutShell({ user, children }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change (after tapping a nav link).
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll + allow ESC to close when drawer is open.
  useEffect(() => {
    if (!mobileOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen">
      <Header user={user as User} />

      {/* Desktop/tablet sidebar stays as-is */}
      <div className="hidden md:block">
        <SideBar user={user as User} />
      </div>

      {/* Mobile: menu button + drawer
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-green-600 text-white shadow-lg hover:bg-green-700 transition focus:outline-none focus:ring-4 focus:ring-green-200"
        aria-label="Open navigation menu"
        aria-haspopup="dialog"
        aria-expanded={mobileOpen}
      >
        <HiBars3 size={22} aria-hidden="true" />
      </button> */}

      <div
        className={[
          "md:hidden fixed inset-0 z-[60] transition",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        {/* Overlay */}
        <div
          className={[
            "absolute inset-0 bg-black/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          ].join(" ")}
          onClick={() => setMobileOpen(false)}
        />

        {/* Drawer panel */}
        <div
          className={[
            "absolute inset-y-0 left-0 w-[min(85vw,20rem)] bg-white shadow-xl border-r",
            "transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
            "flex flex-col",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="text-slate-700 font-semibold">Menu</span>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-slate-100 transition"
              aria-label="Close navigation menu"
            >
              <HiXMark size={22} aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <SideBar user={user as User} />
          </div>

          {/* Safe area padding */}
          <div className="pb-[env(safe-area-inset-bottom)]" />
        </div>
      </div>

      {/* Page content */}
      <div className="relative">{children}</div>
    </div>
  );
}
