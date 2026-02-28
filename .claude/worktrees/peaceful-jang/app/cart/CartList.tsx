"use client";

import toast from "react-hot-toast";
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { useCartStore } from "@/lib/store";

function getBasePrice(item: any) {
  if (typeof item?.basePrice === "number" && Number.isFinite(item.basePrice))
    return item.basePrice;
  if (typeof item?.price === "number" && Number.isFinite(item.price))
    return item.price;
  return 0;
}

function getEffectivePrice(item: any) {
  const base = getBasePrice(item);
  const selling =
    typeof item?.sellingPrice === "number" && Number.isFinite(item.sellingPrice)
      ? item.sellingPrice
      : null;

  const hasValidDiscount = selling !== null && selling > 0 && selling < base;
  return hasValidDiscount ? (selling as number) : base;
}

const CartList = () => {
  const { menus, increaseCartItem, decreaseCartItem, deleteFromcart } =
    useCartStore();

  const handleRemoveFromCart = (id: string) => {
    deleteFromcart(id);
    toast.success("Item removed from Cart", { duration: 1000 });
  };

  if (!menus || menus.length === 0) {
    return (
      <div className="mt-2 rounded-lg border border-gray-200 bg-white p-4 text-center text-sm text-gray-500">
        No items yet.
      </div>
    );
  }

  return (
    <div className="mt-2">
      <h2 className="text-sm sm:text-base font-medium text-gray-700">
        Your Items
      </h2>

      <div className="mt-3 space-y-3">
        {menus?.map((item: any) => {
          const base = getBasePrice(item);
          const unit = getEffectivePrice(item);
          const discounted = unit < base && base > 0;
          const percentOff =
            discounted ? Math.round(((base - unit) / base) * 100) : null;

          return (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
            >
              {/* Header: item info + remove */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-800 break-words">
                    {item.shortDescr}
                  </p>

                  <div className="mt-1 space-y-1 text-xs sm:text-sm text-gray-500">
                    {item.instructions ? (
                      <p className="italic break-words">
                        notes({item.instructions})
                      </p>
                    ) : null}
                    {item.prepare ? (
                      <p className="italic break-words">
                        prepare({item.prepare})
                      </p>
                    ) : null}
                  </div>

                  {discounted && percentOff !== null && (
                    <p className="mt-1 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                      {percentOff}% OFF
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveFromCart(item.id)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-green-700 hover:bg-green-50 transition"
                  aria-label={`Remove ${item.shortDescr ?? "item"} from cart`}
                >
                  <HiOutlineTrash className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Controls: quantity + price */}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Quantity controls */}
                <div className="flex items-center justify-between sm:justify-start gap-3">
                  <div className="inline-flex items-center rounded-full border border-gray-200 bg-white">
                    <button
                      type="button"
                      onClick={() => decreaseCartItem(menus as any, item.id)}
                      disabled={item.quantity === 1}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
                      aria-label="Decrease quantity"
                    >
                      <HiOutlineMinus className="h-5 w-5" aria-hidden="true" />
                    </button>

                    <span
                      className="w-10 text-center text-sm font-medium text-gray-700"
                      aria-label={`Quantity ${item.quantity}`}
                    >
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() => increaseCartItem(menus as any, item.id)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-gray-50"
                      aria-label="Increase quantity"
                    >
                      <HiOutlinePlus className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-between sm:justify-end gap-2">
                  {discounted ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 line-through whitespace-nowrap">
                        ${base.toFixed(2)}
                      </span>
                      <span className="font-semibold text-green-700 whitespace-nowrap">
                        ${unit.toFixed(2)}
                      </span>
                    </div>
                  ) : (
                    <p className="font-semibold text-gray-700 whitespace-nowrap">
                      ${unit.toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CartList;
