"use client";

import { useEffect, useMemo, useState } from "react";
import CartList from "./CartList";
import LocationBtn from "../components/Common/LocationBtn";
import { useCartStore } from "@/lib/store";
import { User } from "@prisma/client";
import { FaCartArrowDown } from "react-icons/fa";
import { useQuery } from "@urql/next";
import { ORDER_NUMBER } from "@/lib/createOrderNumber";
import {
  GetProfileDocument,
  GetProfileQuery,
  GetProfileQueryVariables,
} from "@/graphql/generated";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Base64 } from "js-base64";
import axios from "axios";

type Props = {
  user: User;
};

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
      price: effective, // ✅ IMPORTANT: order uses the real effective price
    };
  });
}

const CartSummary = ({ user }: Props) => {
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [subTotal, setSubTotal] = useState(0);
  const [note, setNote] = useState("");
  const router = useRouter();

  const userName = user?.name as string;
  const email = user?.email as string;

  const serviceFee = 6;
  const deliveryFee = 3;
  const discount = 2;

  const fees = serviceFee + deliveryFee;
  const total = fees + (subTotal - discount);

  const [{ data: UserProfileData }] = useQuery<
    GetProfileQuery,
    GetProfileQueryVariables
  >({ query: GetProfileDocument, variables: { email } });

  const userPhone = UserProfileData?.getProfile.phone as string;

  const { menus } = useCartStore();

  // ✅ keep a normalized cart memo for checkout payload (uses sellingPrice when valid)
  const normalizedCart = useMemo(() => normalizeCartForOrder(menus as any), [menus]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const address = localStorage?.getItem("delivery_address") as string;
      setDeliveryAddress(address);
    }

    const res = normalizedCart.reduce(
      (prev, item: any) => prev + item.price * item.quantity,
      0
    );
    setSubTotal(res);
    setOrderNumber(ORDER_NUMBER);
  }, [normalizedCart]);

  const handleCheckOut = async () => {
    if (!userPhone) {
      toast.error(
        "Please add your phone number: ...Redirecting to your profile",
        {
          duration: 6000,
        }
      );
      router.push("/user");
      return;
    }

    if (!deliveryAddress) {
      toast.error("Please add a delivery address", { duration: 3000 });
      return;
    }

    try {
      const orderDetails = {
        cart: normalizedCart, // ✅ effective prices stored
        deliveryAddress,
        deliveryFee,
        userEmail: email,
        userName,
        userPhone,
        orderNumber,
        serviceFee,
        total,
        discount,
        note,
      };

      localStorage.setItem("You&i_cart", JSON.stringify(orderDetails));

      const encodedTotal = Base64.encode(total.toString());

      const payPlusResponse = await axios.post(`/api/payplus/${encodedTotal}`, {
        orderId: orderNumber,
        userName,
        email,
        userPhone,
      });

      if (payPlusResponse.data?.paymentLink) {
        router.push(payPlusResponse.data.paymentLink);
      } else {
        throw new Error("Failed to retrieve payment link");
      }
    } catch (error) {
      console.error("Error in handleCheckOut:", error);
      toast.error("An unexpected error occurred. Please try again.", {
        duration: 800,
      });
    }
  };

  if (menus.length < 1) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 text-center">
        <h2 className="text-xl sm:text-2xl leading-tight tracking-tight text-gray-600">
          Cart Empty...
        </h2>
        <FaCartArrowDown className="animate-bounce text-green-600" size={24} />
      </div>
    );
  }

  return (
    <div className="py-2">
      <div className="space-y-6">
        <CartList />

        {/* Delivery Address */}
        <section className="border-t border-gray-200 pt-4">
          <h2 className="text-lg leading-6 mb-3 font-medium text-gray-900">
            Delivery Address
          </h2>
          <LocationBtn />
        </section>

        {/* Summary */}
        <section className="border-t border-gray-200 pt-4">
          <h2 className="text-lg leading-6 font-medium text-gray-900">
            Cart Summary
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Review your order details and then pay securely via payplus
          </p>

          <div className="mt-4">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  $ {subTotal.toFixed(2)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Discount</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  -$ {discount.toFixed(2)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Service Fee
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  $ {serviceFee.toFixed(2)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Delivery Fee
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  $ {deliveryFee.toFixed(2)}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-gray-500">Total</dt>
                <dd className="mt-1 text-lg font-semibold text-green-700">
                  $ {total.toFixed(2)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Note */}
        <section className="border-t border-gray-200 pt-4">
          <h2 className="text-lg leading-6 font-medium text-gray-500">
            Add a Note
          </h2>
          <p className="mt-1 text-sm text-gray-500">Optional</p>

          <div className="mt-2">
            <textarea
              id="note"
              name="note"
              rows={3}
              className="w-full min-h-[96px] p-3 rounded bg-green-50 border border-green-500 focus:border-green-500 focus:outline-none focus-visible:ring-green-500 text-sm"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </section>

        {/* Total + Checkout */}
        <div className="border-t border-gray-200 pt-4 space-y-3">
          <div className="flex items-center justify-between sm:justify-end">
            <span className="pr-1 text-lg font-medium text-gray-500">Total:</span>
            <span className="pl-1 text-lg font-semibold text-green-700">
              $ {total.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-end">
            <button
              className="w-full sm:w-auto min-h-[44px] px-5 py-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={handleCheckOut}
            >
              CheckOut
            </button>
          </div>
        </div>

        {/* PayPlus test card */}
        <div className="mt-6 space-y-2">
          <h3 className="font-semibold text-slate-800">כרטיס לבדיקה</h3>
          <h3 className="font-semibold text-slate-800">PayPlus test card .</h3>
          <p className="text-slate-600 text-sm break-words">
            Use the following card details only for testing purchases via PayPlus
            (test/sandbox): השתמש בכרטיס זה כדי לבדוק תשלום להזמנה
          </p>

          <div className="rounded-md bg-slate-100 p-3 text-xs font-mono text-slate-700 space-y-1 break-all">
            <div>Card number: 5326140280779844</div>
            <div>Validity: 05 / 2026</div>
            <div>CVV (3 digits): 000</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
