"use client";

import { useCallback } from "react";
import { signOut } from "next-auth/react";
import {
  HiArrowRightOnRectangle,
  HiChevronDoubleLeft,
  HiXMark,
} from "react-icons/hi2";

import RenderRoutes from "./RenderRoutes";
import { AdminRoutes } from "./routes";

type Props = {
  show: boolean; // desktop: expanded vs collapsed
  showSideBar: () => void;

  mobileOpen: boolean; // mobile drawer open/close
  onCloseMobile: () => void;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function DashSideBar({
  show,
  showSideBar,
  mobileOpen,
  onCloseMobile,
}: Props) {
  const showForRoutes = show || mobileOpen;

  const handleLogout = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  const handleNavClickCapture = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!mobileOpen) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a[href]");
      if (anchor) onCloseMobile();
    },
    [mobileOpen, onCloseMobile]
  );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col bg-white shadow-md",
        // ✅ animate both slide + width
        "transition-[transform,width] ease-out duration-300 md:duration-1000",
        // Mobile: slide-in drawer. Desktop: always visible.
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        // Mobile drawer width
        "w-[85vw] max-w-[18rem]",
        // ✅ Desktop width: pick ONE md width (no conflicts!)
        show ? "md:w-40" : "md:w-[5rem]"
      )}
      aria-label="Dashboard navigation"
    >
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-slate-100 px-3 py-3 md:hidden">
        <span className="text-sm font-semibold text-slate-700">Menu</span>

        <button
          type="button"
          onClick={onCloseMobile}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          aria-label="Close navigation"
        >
          <HiXMark className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      {/* Desktop toggle */}
      <button
        type="button"
        onClick={showSideBar}
        aria-label={show ? "Collapse sidebar" : "Expand sidebar"}
        aria-expanded={show}
        className={cn(
          "absolute -right-3 top-9 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white shadow-lg md:flex",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
          !show && "rotate-180"
        )}
      >
        <HiChevronDoubleLeft className="h-5 w-5" aria-hidden="true" />
      </button>

      <nav
        className="flex min-h-0 flex-1 flex-col items-center justify-between"
        onClickCapture={handleNavClickCapture}
      >
        {/* ✅ min-h-0 + flex-1 = scroll לא “נחתך” */}
        <div
          className={cn(
            "w-full min-h-0 flex-1 overflow-y-auto overflow-x-hidden pt-6 md:pt-20",
            "scrollbar-hide",
            showForRoutes ? "px-2" : "px-0"
          )}
        >
          <div
            className={cn(
              "flex flex-col space-y-6",
              showForRoutes ? "items-start" : "items-center"
            )}
          >
            <RenderRoutes routes={AdminRoutes} show={showForRoutes} />
          </div>
        </div>

        {/* Logout */}
        <div className="w-full border-t border-slate-100 bg-white px-2 pb-6 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              "group flex w-full items-center rounded-md px-2 py-2 transition hover:bg-slate-50",
              showForRoutes ? "justify-start" : "justify-center",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            )}
            aria-label="Logout"
          >
            <div className="relative">
              <span
                className={cn(
                  "invisible absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-green-600 px-2 py-1 text-[0.7rem] text-white shadow-sm group-hover:visible",
                  showForRoutes && "hidden"
                )}
              >
                Logout
              </span>

              <HiArrowRightOnRectangle
                className={cn(
                  "text-slate-500 transition-colors group-hover:text-green-600",
                  showForRoutes ? "mr-2" : "mr-0"
                )}
                size={24}
                aria-hidden="true"
              />
            </div>

            <span
              className={cn(
                "text-sm text-slate-600 transition-colors group-hover:text-green-600",
                showForRoutes ? "inline" : "hidden"
              )}
            >
              Logout
            </span>
          </button>
        </div>
      </nav>
    </aside>
  );
}
