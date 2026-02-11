import Link from "next/link";
import { createElement } from "react";

type Props = {
  routes: { url: string; title: string; icon: React.ElementType }[];
  show: boolean;
};

export default function RenderRoutes({ routes, show }: Props) {
  return (
    <>
      {routes.map((route) => (
        <Link
          href={route.url}
          key={route.url}
          className="group p-2 md:p-1 rounded-md hover:bg-green-100 hover:text-green-600 dark:hover:bg-slate-200"
        >
          <div className="flex items-center space-x-2">
            <div className="relative">
              {/* Tooltip: desktop only (hover), mainly for collapsed sidebar */}
              <div
                className={[
                  "absolute bg-green-600 text-white text-[0.7rem] p-1 rounded-md -top-6 left-[0.7rem] transform -translate-x-1/2 invisible group-hover:visible",
                  "hidden md:block", // ✅ hide tooltip on phone
                  show ? "md:hidden" : "", // ✅ when expanded (desktop), no tooltip
                ].join(" ")}
              >
                {route.title}
              </div>

              {/* Bigger tap/click target ONLY on phone */}
              <div className="flex h-11 w-11 items-center justify-center md:h-auto md:w-auto md:items-start md:justify-start">
                {createElement(route.icon, {
                  className:
                    "text-slate-500 shrink-0 cursor-pointer transition-opacity duration-200 group-hover:text-green-600",
                  size: 24,
                })}
              </div>
            </div>

            {/* ✅ Phone only: always show title (no hover on mobile) */}
            <span className="md:hidden text-sm font-medium">{route.title}</span>

            {/* Desktop behavior stays exactly like before: show title only when expanded */}
            <span className={`hidden ${show ? "md:inline" : ""}`}>
              {route.title}
            </span>
          </div>
        </Link>
      ))}
    </>
  );
}
