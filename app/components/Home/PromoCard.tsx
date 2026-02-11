import { PromoTypes } from "@/types";
import Image from "next/image";

type Props = {
  promo: PromoTypes;
};

function money(n: number) {
  const fixed = Number.isInteger(n) ? n.toString() : n.toFixed(2);
  return `$${fixed}`;
}

const PromoCard = ({ promo }: Props) => {
  const hasDiscount =
    typeof promo.oldPrice === "number" &&
    promo.oldPrice > 0 &&
    promo.price > 0 &&
    promo.oldPrice > promo.price;

  const ribbonText = promo.PercentOff > 0 ? `${promo.PercentOff} % Off` : "Promo";

  return (
    <article
      className="flex w-[240px] sm:w-80 md:w-96 shrink-0 overflow-hidden rounded-lg shadow-md sm:shadow-lg text-gray-500 hover:bg-green-200
    hover:text-green-600 transition-all duration-200 ease-out"
    >
      <div className="relative shrink-0 h-24 w-24 sm:h-32 sm:w-32 md:h-[200px] md:w-[200px] overflow-hidden">
        <span
          className="absolute rotate-[50deg] top-2 -right-3 px-3 py-1 bg-red-500
            text-white text-center text-[10px] sm:text-xs"
        >
          {ribbonText}
        </span>

        <Image
          src={promo.img}
          alt="promo-img"
          fill
          sizes="(max-width: 640px) 96px, (max-width: 768px) 128px, 200px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 p-3 sm:p-4 md:p-5 space-y-2 sm:space-y-3">
        {/* ✅ keep compact on mobile: max ~2 lines */}
<p
  className="
    font-semibold text-sm sm:text-base leading-5 sm:leading-6
    whitespace-nowrap overflow-x-auto scrollbar-hide [-webkit-overflow-scrolling:touch]
    md:whitespace-normal md:break-words md:overflow-visible
  "
  title={promo.title}
>
  {promo.title}
</p>




        <p className="text-[11px] sm:text-xs inline-flex items-center">
          {promo.salesQ} sells
          <span className="h-1.5 w-1.5 bg-gray-400 rounded-full mx-2"></span>
          {promo.likesN} likes
        </p>

        {/* ✅ מחיר חדש + מחיר ישן מחוק (עדין) */}
        {hasDiscount ? (
          <div className="flex items-center gap-2">
            <p className="text-red-500 font-semibold">{money(promo.price)}</p>
            <p className="text-[11px] sm:text-xs text-gray-400 line-through">
              {money(promo.oldPrice as number)}
            </p>
            <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Discount
            </span>
          </div>
        ) : (
          <p className="text-red-500 font-semibold">{money(promo.price)}</p>
        )}

        <button className="form-button min-h-11 text-sm py-2">Order Now</button>
      </div>
    </article>
  );
};

export default PromoCard;
