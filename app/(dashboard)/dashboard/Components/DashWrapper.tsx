"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import DashHeader from "./DashHeader";
import DashSideBar from "./DashSideBar";
import { User } from "@prisma/client";

type DashWrapperProps = {
  children: React.ReactNode;
  user: User;
};

const DashWrapper = ({ user, children }: DashWrapperProps) => {
  // Desktop-only: collapsible sidebar width (icons-only vs expanded)
  const [show, setShow] = useState(false);

  // Mobile-only: drawer open/close state
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathname = usePathname();

  const showSideBar = () => setShow((v) => !v);
  const openMobile = () => setMobileOpen(true);
  const closeMobile = () => setMobileOpen(false);

  // Close mobile drawer on navigation (keeps UX clean)
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-slate-200">
      {/* Mobile overlay */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={closeMobile}
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
        />
      ) : null}

      <DashSideBar
        show={show}
        showSideBar={showSideBar}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
      />

      <section
        className={`relative ml-0 transition-[margin] duration-300 ease-out md:duration-1000 md:ml-[6.5rem] ${
          show ? "md:ml-[10rem]" : ""
        }`}
      >
        <DashHeader user={user} onMenuClick={openMobile} />
        {children}
      </section>
    </div>
  );
};

export default DashWrapper;
