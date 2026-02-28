import Link from "next/link";
import { FaChevronRight } from "react-icons/fa";
import { FiGlobe } from "react-icons/fi";
import { GiHelp } from "react-icons/gi";
import LanguageSelectModal from "./LanguageSelectModal";

const UserPrefs = () => {
  return (
    <div className="flex flex-col mt-3 gap-3">
      <div className="px-3 py-2 bg-slate-100 rounded-lg">
        <h2 className="text-gray-500 font-medium">PREFERENCES</h2>
      </div>

      <div className="flex items-center justify-between gap-3 px-3 py-3 min-h-[44px] rounded-lg text-gray-500 hover:bg-slate-50 transition">
        <div className="flex items-center gap-3 min-w-0">
          <FiGlobe size={28} className="shrink-0" />
          <h3 className="text-base sm:text-lg font-medium truncate">Language</h3>
        </div>

        <LanguageSelectModal />
      </div>

      <Link
        href="/user/help"
        className="flex items-center justify-between gap-3 px-3 py-3 min-h-[44px] rounded-lg text-gray-500 hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3 min-w-0">
          <GiHelp size={28} className="shrink-0" />
          <h3 className="text-base sm:text-lg font-medium truncate">Help</h3>
        </div>

        <FaChevronRight className="shrink-0" />
      </Link>
    </div>
  );
};

export default UserPrefs;
