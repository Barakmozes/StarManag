"use client";

import {
  useCartStore,
  useLoginModal,
  useSideBarDrawer,
} from "@/lib/store";
import { useRestaurantStore } from "@/lib/restaurantStore";
import Link from "next/link";
import { HiBars3, HiOutlineShoppingCart } from "react-icons/hi2";
import LocationBtn from "./LocationBtn";
import { User } from "@prisma/client";
import AccountDropDown from "./AccountDropDown";

type HeaderProps = {
  user: User;
};

const Header = ({ user }: HeaderProps) => {
  const { onOpen } = useLoginModal();
  const { menus } = useCartStore();
  const { onSideBarOpen } = useSideBarDrawer();
  const { selectedZone, setSelectedZone, zones } = useRestaurantStore();

  // Improved zone selection logic
  const handleZoneClick = (zoneName: string) => {
    setSelectedZone(zoneName);
  };

  return (
    <header className="grid grid-cols-2 py-5 px-4 md:px-12 items-center sticky top-0 z-10 bg-white md:flex justify-between shadow">
      {/* Left Area */}
      <div className="flex items-center gap-x-8">
        <button
          className="p-2 rounded-full bg-slate-200 text-gray-500 hover:bg-green-200 hover:text-green-600"
          onClick={onSideBarOpen}
          aria-label="Open sidebar"
        >
          <HiBars3 size={28} className="cursor-pointer shrink-0" />
        </button>

        {["ADMIN", "USER"].includes(user?.role) && <LocationBtn />}
      </div>

      {/* Center Area - Display Zones for Desktop */}
      {["WAITER", "MANAGER"].includes(user?.role) && (
        <div className="hidden md:flex flex-wrap items-center justify-center gap-1.5 flex-1">
          {zones.map((zone) => (
            <button
              key={zone.name}
              onClick={() => handleZoneClick(zone.name)}
              className={`px-2 py-1 whitespace-nowrap rounded-lg text-xs md:text-base shadow-sm hover:shadow-md text-gray-700 bg-gray-100 hover:bg-green-100 transition ${
                selectedZone === zone.name
                  ? "bg-green-200 text-green-800 font-semibold"
                  : ""
              }`}
              aria-label={`Select zone: ${zone.name}`}
            >
              {zone.name}
            </button>
          ))}
        </div>
      )}

      {/* Center Area - Zone Selector for Small Screens */}
      {["WAITER", "MANAGER"].includes(user?.role) && (
        <div className="flex md:hidden items-center justify-center w-full">
          <select
            className="p-2 border rounded-lg text-gray-700 bg-white focus:ring focus:ring-green-300 w-full"
            value={selectedZone || ""}
            onChange={(e) => handleZoneClick(e.target.value)}
            aria-label="Select a zone"
            style={{
              backgroundColor: selectedZone
                ? "rgba(144, 238, 144, 0.2)" /* Subtle light green */
                : "white",
            }}
          >
            <option value="" disabled>
              Select a Zone
            </option>
            {zones.map((zone) => (
              <option key={zone.name} value={zone.name}>
                {zone.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Right Area */}
      <div className="hidden md:flex items-center justify-end space-x-4">
        {/* Shopping Cart */}
        <Link
          href="/cart"
          className="relative p-2 bg-slate-200 rounded-full text-gray-500 hover:bg-green-200 hover:text-green-600"
          aria-label="View cart"
        >
          <HiOutlineShoppingCart className="pr-1" size={28} />
          <span
            className="absolute top-0 right-1 font-bold text-green-600"
            aria-label={`Cart items: ${menus ? menus.length : 0}`}
          >
            {menus ? menus.length : 0}
          </span>
        </Link>

        {/* User Account Dropdown */}
        {user ? (
          <AccountDropDown user={user} />
        ) : (
          <button
            className="bg-slate-200 text-gray-500 px-4 py-1 rounded-full hover:bg-green-200 hover:text-green-600"
            onClick={onOpen}
            aria-label="Login or signup"
          >
            Login/Signup
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
