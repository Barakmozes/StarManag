"use client";

import toast from "react-hot-toast";
import { HiOutlineMinus, HiOutlinePlus, HiOutlineTrash } from "react-icons/hi2";
import { useCartStore } from "@/lib/store";

function getBasePrice(item: any) {
  if (typeof item?.basePrice === "number" && Number.isFinite(item.basePrice)) return item.basePrice;
  if (typeof item?.price === "number" && Number.isFinite(item.price)) return item.price;
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

  return (
    <div>
      <p>Your Items</p>

      {menus?.map((item: any) => {
        const base = getBasePrice(item);
        const unit = getEffectivePrice(item);
        const discounted = unit < base && base > 0;
        const percentOff =
          discounted ? Math.round(((base - unit) / base) * 100) : null;

        return (
          <div className="flex justify-between items-center mt-3" key={item.id}>
            <div className="flex space-x-3 border rounded-full px-2 ">
              <button
                onClick={() => decreaseCartItem(menus as any, item.id)}
                disabled={item.quantity === 1}
              >
                <HiOutlineMinus />
              </button>
              <p>{item.quantity}</p>
              <button onClick={() => increaseCartItem(menus as any, item.id)}>
                <HiOutlinePlus />
              </button>
            </div>

            <div className="px-3">
              <p>
                <span className="text-sm">{item.shortDescr}: </span>{" "}
                <span className="text-xs italic">notes({item.instructions}) </span>{" "}
                <span className="text-xs italic">prepare({item.prepare}) </span>
              </p>
              {discounted && (
                <p className="text-xs text-red-600 font-semibold">
                  {percentOff}% OFF
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {discounted ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 line-through">
                    ${base.toFixed(2)}
                  </span>
                  <span className="font-semibold text-green-700">
                    ${unit.toFixed(2)}
                  </span>
                </div>
              ) : (
                <p className="font-semibold text-gray-700">
                  ${unit.toFixed(2)}
                </p>
              )}

              <HiOutlineTrash
                className="cursor-pointer text-green-700"
                onClick={() => handleRemoveFromCart(item.id)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartList;
