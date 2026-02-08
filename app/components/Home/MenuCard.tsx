import { Menu } from "@prisma/client";
import Image from "next/image";

type Props = {
  menu: Menu;
  openModal: () => void;
};

function money(n: number) {
  const fixed = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return `$${fixed}`;
}

function hasValidDiscount(price: number, sellingPrice?: number | null) {
  return (
    typeof sellingPrice === "number" &&
    sellingPrice > 0 &&
    sellingPrice < price
  );
}

function percentOff(price: number, sellingPrice: number) {
  return Math.round(((price - sellingPrice) / price) * 100);
}

const MenuCard = ({ menu, openModal }: Props) => {
  const basePrice = Number(menu.price ?? 0);
  const discountOk = hasValidDiscount(basePrice, menu.sellingPrice);

  return (
    <div
      className="flex flex-col rounded-lg shadow-md hover:scale-105
    hover:shadow-lg transition-all duration-200 ease-out cursor-pointer
    "
      onClick={openModal}
    >
      <Image
        src={menu.image}
        width={360}
        height={200}
        alt="menu-img"
        className="h-56 w-full object-scale-down rounded-t-lg"
      />

      <div className="flex flex-col flex-1 p-5">
        <div className="flex justify-between items-center gap-3">
          <h2 className="truncate">{menu.title}</h2>

          {discountOk ? (
            <div className="flex flex-col items-end shrink-0">
              {/* new price */}
              <span className="text-green-600 font-semibold">
                {money(menu.sellingPrice as number)}
              </span>

              {/* old price + subtle badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 line-through">
                  {money(basePrice)}
                </span>
                <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  {percentOff(basePrice, menu.sellingPrice as number)}% OFF
                </span>
              </div>
            </div>
          ) : (
            <span className="text-green-600 font-semibold shrink-0">
              {money(basePrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuCard;
