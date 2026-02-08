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
      className="flex w-96 rounded-lg shrink-0  shadow-lg text-gray-500 hover:bg-green-200
    hover:text-green-600 transition-all duration-200 ease-out"
    >
      <div className="flex flex-1 relative overflow-hidden">
        <span
          className="absolute rotate-[50deg] top-4 right-1 px-4 py-2 bg-red-500
            text-white text-center
            "
        >
          {ribbonText}
        </span>

        <Image
          className="rounded-lg"
          src={promo.img}
          width={200}
          height={200}
          alt="promo-img"
        />
      </div>

      <div className="flex flex-col flex-1 p-5 space-y-3">
        <p className="font-semibold">{promo.title}</p>

        <p className="text-xs inline-flex items-center">
          {promo.salesQ} sells
          <span className="h-2 w-2 bg-gray-400 rounded-full mx-2"></span>
          {promo.likesN} likes
        </p>

        {/* ✅ מחיר חדש + מחיר ישן מחוק (עדין) */}
        {hasDiscount ? (
          <div className="flex items-center gap-2">
            <p className="text-red-500 font-semibold">{money(promo.price)}</p>
            <p className="text-xs text-gray-400 line-through">
              {money(promo.oldPrice as number)}
            </p>
            <span className="rounded bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
              Discount
            </span>
          </div>
        ) : (
          <p className="text-red-500 font-semibold">{money(promo.price)}</p>
        )}

        <button className="form-button">Order Now</button>
      </div>
    </article>
  );
};

export default PromoCard;
