"use client";
import {  useCartStore, useLoginModal, useSideBarDrawer ,useZoneStore} from "@/lib/store";
import Link from "next/link";
import { HiBars3, HiOutlineShoppingCart } from "react-icons/hi2";
import LocationBtn from "./LocationBtn";
import { User } from "@prisma/client";
import AccountDropDown from "./AccountDropDown";
import { zones } from "../Restaurant_interface/zone_restaurant"; // Import zones
// import { useState } from "react";
type HeaderProps = {
  user: User
}

const Header = ({user}:HeaderProps) => {

  const {onOpen} = useLoginModal()
  const { menus } = useCartStore();

    const {onSideBarOpen} = useSideBarDrawer()

    // const [selectedZone, setSelectedZone] = useState<string | null>(null);
    const { selectedZone, setSelectedZone } = useZoneStore();

    const handleZoneClick = (zoneName: string) => {
      setSelectedZone(zoneName);
    };
 
      // Save the selected zone to local storage
  // const handleZoneClick = (zoneName: string) => {
  //   setSelectedZone(zoneName);
  //   localStorage.setItem("selectedZone", zoneName);
  // };
    
  return (
    <header className="grid grid-cols-2 py-5 px-4 md:px-12 items-center sticky top-0 z-10 bg-white md:flex justify-between ">
      {/* Left Area  */}

      <div className="flex items-center gap-x-8">
        <button className="p-2 rounded-full bg-slate-200 text-gray-500 hover:bg-green-200 hover:text-green-600"
        onClick={onSideBarOpen}
        >
          <HiBars3 size={28} className="cursor-pointer shrink-0" />
        </button>

        {["ADMIN", "USER"].includes(user?.role) && <LocationBtn />}
      </div>

      {/* Center Area - Display Zones */}
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
          >
            {zone.name}
          </button>
        ))}
      </div>
    )}

       {/* Center Area - Selector for Small Screens */}
       {["WAITER", "MANAGER"].includes(user?.role) && (
        <div className="flex md:hidden items-center justify-center w-full">
          <select
            className="p-2 border rounded-lg text-gray-700 bg-white focus:ring focus:ring-green-300 w-full"
            value={selectedZone || ""}
            onChange={(e) => handleZoneClick(e.target.value)}
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
      
      {/* Right Area  */}

      <div className="hidden md:flex  items-center justify-end space-x-4 ">
        <Link
          href="/cart"
          className="relative p-2 bg-slate-200 rounded-full text-gray-500 hover:bg-green-200 hover:text-green-600 "
        >
          <HiOutlineShoppingCart className="pr-1" size={28} />
          <span className="absolute top-0 right-1 font-bold text-green-600">
          { menus ? menus.length : 0 }
          </span>
        </Link>
        {
          user ? (
            <AccountDropDown user={user} />
          ): (

        <button className="bg-slate-200 text-gray-500 px-4 py-1 rounded-full"
        onClick={onOpen}
        >
          Login/Signup
        </button>
          )
        }
      </div>
    </header>
  );
};

export default Header;