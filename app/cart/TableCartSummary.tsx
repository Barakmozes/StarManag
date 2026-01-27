"use client";

import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/store";
import { User } from "@prisma/client";
import { FaCartArrowDown } from "react-icons/fa";
import CartList from "../cart/CartList";
import { useMutation } from "@urql/next";
import {
  AddOrderToTableDocument,
  AddOrderToTableMutation,
  AddOrderToTableMutationVariables,
} from "@/graphql/generated";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ORDER_NUMBER } from "@/lib/createOrderNumber";

type TableCartSummaryProps = {
  user: User;
};

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

function normalizeCartForOrder(menus: any[]) {
  return menus.map((item) => {
    const base = getBasePrice(item);
    const selling =
      typeof item?.sellingPrice === "number" && Number.isFinite(item.sellingPrice)
        ? item.sellingPrice
        : null;

    const effective = getEffectivePrice(item);

    return {
      ...item,
      basePrice: base,
      sellingPrice: selling,
      price: effective,
    };
  });
}

export default function TableCartSummary({ user }: TableCartSummaryProps) {
  const router = useRouter();

  const { menus, tableId, resetCart, tableNumber } = useCartStore();

  const [orderNumber, setOrderNumber] = useState("");
  const [subTotal, setSubTotal] = useState(0);
  const [note, setNote] = useState("");

  const serviceFee = 6;
  const discount = 0;
  const total = subTotal + serviceFee - discount;

  const normalizedCart = useMemo(() => normalizeCartForOrder(menus as any), [menus]);

  const [, addTableOrder] = useMutation<
    AddOrderToTableMutation,
    AddOrderToTableMutationVariables
  >(AddOrderToTableDocument);

  useEffect(() => {
    const newSubTotal = normalizedCart.reduce(
      (prev, item: any) => prev + item.price * item.quantity,
      0
    );
    setSubTotal(newSubTotal);
    setOrderNumber(ORDER_NUMBER);
  }, [normalizedCart]);

  if (menus.length < 1) {
    return (
      <div className="flex items-center justify-center space-x-3">
        <h2 className="text-2xl leading-tight tracking-tight text-gray-600">
          Cart Empty...
        </h2>
        <FaCartArrowDown className="animate-bounce text-green-600" size={24} />
      </div>
    );
  }

  const handleTableOrder = async () => {
    try {
      if (!tableId) {
        toast.error("No table selected. Please pick a table first.", {
          duration: 3000,
        });
        return;
      }

      // ✅ Send normalized cart (effective price) to backend
      const cartItems = normalizedCart.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        instructions: item.instructions,
        prepare: item.prepare,
        // IMPORTANT: price is the effective price (sellingPrice if valid)
        price: item.price,
        // optional fields (nice for later rendering/invoices)
        basePrice: item.basePrice,
        sellingPrice: item.sellingPrice,
      }));

      const response = await addTableOrder({
        tableId,
        orderNumber,
        cart: cartItems,
        userName: user.name || "Staff",
        userEmail: user.email || "staff@local",
        serviceFee,
        total,
        note,
      });

      if (response.error) {
        console.error(response.error);
        toast.error("Could not create table order", { duration: 3000 });
        return;
      }

      toast.success("Order sent to Kitchen/Bar!", { duration: 3000 });
      resetCart();
      router.push("/user/orders");
    } catch (error) {
      console.error("Error while creating table order:", error);
      toast.error("An unexpected error occurred.", { duration: 3000 });
    }
  };

  return (
    <div className="border-gray-200 py-4">
      <h2 className="text-center">שולחן מס {tableNumber}</h2>

      <CartList />

      <div className="px-4 sm:px-6 lg:px-8 mt-4">
        <h2 className="text-lg leading-6 my-2 font-medium text-gray-900">
          Order Summary
        </h2>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 border-t pt-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
            <dd className="mt-1 text-sm text-gray-900">
              ${subTotal.toFixed(2)}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Service Fee</dt>
            <dd className="mt-1 text-sm text-gray-900">
              ${serviceFee.toFixed(2)}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Discount</dt>
            <dd className="mt-1 text-sm text-gray-900">
              -${discount.toFixed(2)}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-500">Total</dt>
            <dd className="mt-1 text-lg font-semibold text-green-700">
              ${total.toFixed(2)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-2">
        <div className="border-t border-gray-200 py-4">
          <h2 className="text-lg leading-6 font-medium text-gray-500">Add a Note</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Optional</p>
          <textarea
            id="note"
            name="note"
            rows={2}
            className="w-full mt-2 rounded bg-green-50 border border-green-500 focus:border-green-500 focus:outline-none focus-visible:ring-green-500"
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 mt-2 flex justify-end">
        <button
          onClick={handleTableOrder}
          className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Send Order to Kitchen
        </button>
      </div>
    </div>
  );
}
