import Link from "next/link";
import { AiOutlineHeart } from "react-icons/ai";
import { FaChevronRight } from "react-icons/fa";
import { TbReceipt } from "react-icons/tb";

const UserData = () => {
  return (
    <div className="flex flex-col mt-3 gap-3">
      <div className="px-3 py-2 bg-slate-100 rounded-lg">
        <h2 className="text-gray-500 font-medium">CONTENT</h2>
      </div>

      <Link
        href="/user/favorites"
        className="flex items-center justify-between gap-3 px-3 py-3 min-h-[44px] rounded-lg text-gray-500 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <AiOutlineHeart size={28} className="shrink-0" />
          <h3 className="text-base sm:text-lg font-medium truncate">
            Favorites
          </h3>
        </div>

        <FaChevronRight className="shrink-0" />
      </Link>

      <Link
        href="/user/orders"
        className="flex items-center justify-between gap-3 px-3 py-3 min-h-[44px] rounded-lg text-gray-500 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <TbReceipt size={28} className="shrink-0" />
          <h3 className="text-base sm:text-lg font-medium truncate">Orders</h3>
        </div>

        <FaChevronRight className="shrink-0" />
      </Link>
    </div>
  );
};

export default UserData;
