import { Menu } from "@prisma/client";
import Image from "next/image";
import { FaCartArrowDown } from "react-icons/fa";

type Props = {
  favorite: Menu;
  OpenModal: () => void;
};

const FavoriteCard = ({ favorite, OpenModal }: Props) => {
  return (
    <div className="flex items-start gap-3 shadow-lg p-3 sm:p-4 rounded-lg">
      {/* Image */}
      <div className="shrink-0 w-16 h-16 overflow-hidden rounded-full bg-gray-100">
        <Image
          src={favorite.image}
          alt={favorite.title}
          width={70}
          height={70}
          className="object-cover w-full h-full"
        />
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <span className="block font-semibold text-gray-800 text-sm sm:text-base truncate">
          {favorite.title}
        </span>

        <p className="mt-0.5 text-xs sm:text-sm text-gray-600">
          Category:{" "}
          <span className="italic text-gray-500 break-words">
            {favorite.category}
          </span>
        </p>

        <p className="mt-0.5 text-xs sm:text-sm text-gray-600">
          Price:{" "}
          <span className="font-semibold text-green-600">${favorite.price}</span>
        </p>
      </div>

      {/* Action */}
      <button
        type="button"
        className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-200 text-green-600 hover:bg-green-200 hover:text-green-500 transition"
        onClick={OpenModal}
        aria-label={`Open ${favorite.title}`}
      >
        <FaCartArrowDown size={24} aria-hidden="true" />
      </button>
    </div>
  );
};

export default FavoriteCard;
