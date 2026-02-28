"use client";

import { createElement } from "react";
import DialogComponent from "./DialogComponent";
import { BsCalendarCheck, BsHeartFill } from "react-icons/bs";
import { MdHelp } from "react-icons/md";
import { FaReceipt } from "react-icons/fa";
import { HiHome, HiOutlineArrowRightOnRectangle } from "react-icons/hi2";
import Link from "next/link";
import Image from "next/image";
import { useLoginModal, useSideBarDrawer } from "@/lib/store";
import { User } from "@prisma/client";
import { signOut } from "next-auth/react";

type Props = {
  user: User | null;
};

const Links = [
  { title: "Home", icon: HiHome, url: "/" },
  { title: "Orders", icon: FaReceipt, url: "/user/orders" },
  { title: "Favorites", icon: BsHeartFill, url: "/user/favorites" },
  { title: "Help", icon: MdHelp, url: "/user/help" },
];

const SideBar = ({ user }: Props) => {
  const { isSideBarOpen, onSideBarClose } = useSideBarDrawer();
  const { onOpen } = useLoginModal();

  const handleLoginClick = () => {
    onSideBarClose();
    onOpen();
  };

  const handleSignOut = () => {
    onSideBarClose();
    signOut({ callbackUrl: "/" });
  };

  return (
    <DialogComponent isVisible={isSideBarOpen} onClose={onSideBarClose}>
      <div className="flex flex-col gap-y-5 px-4 pb-8 pt-6 sm:px-6">
        {/* Logo Section */}
        <div className="flex justify-center border-b pb-4">
          <Link href="/" onClick={onSideBarClose}>
            <Image src="/img/logo.png" width={45} height={45} alt="logo" priority />
          </Link>
        </div>

        {user ? (
          <>
            {/* User Profile Card */}
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 border border-slate-100 shadow-sm">
              <Image
                src={user?.image || "/img/default-avatar.png"}
                width={48}
                height={48}
                alt="user-img"
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{user?.name}</p>
                <Link
                  href="/user"
                  onClick={onSideBarClose}
                  className="text-xs font-semibold text-green-600 hover:text-green-700 underline-offset-2 hover:underline"
                >
                  View Account
                </Link>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1">
              {Links.map((link) => (
                <Link
                  key={link.title}
                  href={link.url}
                  onClick={onSideBarClose}
                  className="flex min-h-[48px] items-center rounded-lg px-3 transition-colors hover:bg-green-50 hover:text-green-700 font-medium text-slate-600"
                >
                  {createElement(link.icon, { className: "h-5 w-5 mr-3 shrink-0" })}
                  <span className="text-sm">{link.title}</span>
                </Link>
              ))}

              {user?.role !== "MANAGER" && user?.role !== "WAITER" && (
                <Link
                  href="/user/reservations"
                  onClick={onSideBarClose}
                  className="flex min-h-[48px] items-center rounded-lg px-3 transition-colors hover:bg-green-50 hover:text-green-700 font-medium text-slate-600"
                >
                  <BsCalendarCheck className="h-5 w-5 mr-3 shrink-0" />
                  <span className="text-sm">Reservations</span>
                </Link>
              )}

              <button
                type="button"
                onClick={handleSignOut}
                className="flex min-h-[48px] items-center rounded-lg px-3 transition-colors hover:bg-red-50 hover:text-red-600 font-medium text-slate-600"
              >
                <HiOutlineArrowRightOnRectangle className="mr-3 shrink-0" size={20} />
                <span className="text-sm">Sign Out</span>
              </button>

              {/* Admin Dashboard Access */}
              {user?.role === "ADMIN" && (
                <Link
                  href="/dashboard"
                  onClick={onSideBarClose}
                  className="mt-4 flex min-h-[48px] items-center justify-center rounded-lg bg-green-600 text-sm font-bold text-white shadow-md hover:bg-green-700 transition-all active:scale-95"
                >
                  Admin Dashboard
                </Link>
              )}
            </nav>
          </>
        ) : (
          /* Unauthenticated State */
          <div className="py-4">
            <button
              type="button"
              className="h-12 w-full rounded-xl bg-green-600 text-sm font-bold text-white shadow-lg shadow-green-200 transition-all hover:bg-green-700 active:scale-95"
              onClick={handleLoginClick}
            >
              Login / Signup
            </button>
          </div>
        )}
      </div>
    </DialogComponent>
  );
};

export default SideBar;