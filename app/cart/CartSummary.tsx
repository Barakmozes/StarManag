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
      toast.error("Please add your phone number: ...Redirecting to your profile", {
        duration: 6000,
      });
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
      <div className="flex items-center justify-center space-x-3">
        <h2 className="text-2xl leading-tight tracking-tight text-gray-600">
          Cart Empty...
        </h2>
        <FaCartArrowDown className="animate-bounce text-green-600" size={24} />
      </div>
    );
  }

  return (
    <div className="border-gray-200 py-2">
      <>
        <CartList />
        <div className="px-4 sm:px-6 lg:px-8 mt-2">
          <div className="border-t border-gray-200 py-4">
            <h2 className="text-lg leading-6 my-4 font-medium text-gray-900">
              Delivery Address
            </h2>
            <LocationBtn />
          </div>
        </div>

        <div>
          <div className="px-4 sm:px-6 lg:px-8 mt-2">
            <h2 className="text-lg leading-6 my-4 font-medium text-gray-900">
              Cart Summary
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Review your order details and then pay securely via payplus
            </p>
          </div>

          <div className="px-4 sm:px-6 lg:px-8 mt-2">
            <div className="border-t border-gray-200 py-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-4 ">
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
                  <dt className="text-sm font-medium text-gray-500">Service Fee</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    $ {serviceFee.toFixed(2)}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">Delivery Fee</dt>
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
          </div>

          <div className="px-4 sm:px-6 lg:px-8 mt-2">
            <div className="border-t border-gray-200 py-4">
              <h2 className="text-lg leading-6 font-medium text-gray-500">
                Add a Note
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Optional</p>
              <div className="mt-2">
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  className="w-full h-16 rounded bg-green-50 border border-green-500 focus:border-green-500 focus:outline-none focus-visible:ring-green-500"
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </>

      <>
        <div className="sm:col-span-1 my-4">
          <div className="flex items-center justify-end">
            <dt className="pr-1 text-lg font-medium text-gray-500">Total:</dt>
            <dd className="pl-1 text-lg font-semibold text-green-700">
              $ {total.toFixed(2)}
            </dd>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 mt-2">
          <div className="flex justify-end">
            <button
              className="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={handleCheckOut}
            >
              CheckOut
            </button>
          </div>
        </div>
      </>
    </div>
  );
};

export default CartSummary;
