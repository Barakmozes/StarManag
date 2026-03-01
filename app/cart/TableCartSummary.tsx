"use client";

import { useEffect, useMemo, useState } from "react";
import { useCartStore } from "@/lib/store";
import { User } from "@prisma/client";
import { FaCartArrowDown, FaCheckCircle, FaReceipt, FaSpinner, FaUtensils } from "react-icons/fa";
import CartList from "../cart/CartList";
import { useMutation, useQuery } from "@urql/next";
import {
  AddOrderToTableDocument,
  AddOrderToTableMutation,
  AddOrderToTableMutationVariables,
  GetTableOrderDocument,
  GetTableOrderQuery,
  GetTableOrderQueryVariables,
} from "@/graphql/generated";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ORDER_NUMBER } from "@/lib/createOrderNumber";
import TicketDots from "@/app/components/Common/TicketDots";

// --- Types ---

type TableCartSummaryProps = {
  user: User;
};

// ממשק עזר לפריט בתוך ה-JSON של העגלה
interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
}

// --- Helper Functions ---

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
      price: effective,
    };
  });
}

// --- Main Component ---

export default function TableCartSummary({ user }: TableCartSummaryProps) {
  const router = useRouter();

  // Zustand Store
  const { menus, tableId, resetCart, tableNumber } = useCartStore();

  // Local State
  const [currentOrderNumber, setCurrentOrderNumber] = useState("");
  const [cartSubTotal, setCartSubTotal] = useState(0);
  const [note, setNote] = useState("");

  const serviceFee = 0; 
  const discount = 0;

  // 1. Normalize Cart Data (Current items to be ordered)
  const normalizedCart = useMemo(() => normalizeCartForOrder(menus as any), [menus]);

  // 2. Calculate Cart Subtotal
  useEffect(() => {
    const newSubTotal = normalizedCart.reduce(
      (prev, item: any) => prev + item.price * item.quantity,
      0
    );
    setCartSubTotal(newSubTotal);
    setCurrentOrderNumber(ORDER_NUMBER);
  }, [normalizedCart]);

  // 3. Mutation: Add Order to Table
  const [{ fetching: submitting }, addTableOrder] = useMutation<
    AddOrderToTableMutation,
    AddOrderToTableMutationVariables
  >(AddOrderToTableDocument);

  // 4. Query: Fetch Active Orders for this Table
  const [{ data: activeOrdersData, fetching: loadingActiveOrders }] = useQuery<
    GetTableOrderQuery,
    GetTableOrderQueryVariables
  >({
    query: GetTableOrderDocument,
    variables: { tableId: tableId || "" },
    pause: !tableId,
    requestPolicy: 'cache-and-network',
  });

  // --- Logic for Active Orders (History) ---
  
  // המערכת מחזירה מערך של הזמנות. אנחנו רוצים להציג את כולן.
  const activeOrders = activeOrdersData?.getTableOrder || [];

  // איחוד כל הפריטים מכל ההזמנות הפעילות לרשימה אחת שטוחה לצורך תצוגה וחישוב
  const allPreviousItems = useMemo(() => {
    const items: CartItem[] = [];
    activeOrders.forEach(order => {
      if (Array.isArray(order.cart)) {
        order.cart.forEach((cItem: any) => {
          items.push({
            id: cItem.id,
            title: cItem.title || "Unknown Item",
            price: Number(cItem.price) || 0,
            quantity: Number(cItem.quantity) || 1
          });
        });
      }
    });
    return items;
  }, [activeOrders]);

  // חישוב סכום ההזמנות שכבר נשלחו
  const existingSubTotal = useMemo(() => {
    return allPreviousItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [allPreviousItems]);
  
  // סך הכל סופי (היסטוריה + עגלה נוכחית)
  const grandTotal = existingSubTotal + cartSubTotal + serviceFee - discount;

  // --- Handlers ---

  const handleTableOrder = async () => {
    try {
      if (!tableId) {
        toast.error("No table selected.", { duration: 3000 });
        return;
      }

      if (normalizedCart.length === 0) {
        toast.error("Cart is empty", { duration: 2000 });
        return;
      }

      const cartItems = normalizedCart.map((item: any) => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        instructions: item.instructions,
        prepare: item.prepare,
        price: item.price,
        basePrice: item.basePrice,
        sellingPrice: item.sellingPrice,
        category: item.category,
        categoryId: item.categoryId,
      }));

      const response = await addTableOrder({
        tableId,
        orderNumber: currentOrderNumber,
        cart: cartItems,
        userName: user.name || "Staff",
        userEmail: user.email || "staff@local",
        serviceFee,
        total: cartSubTotal, // שולחים את הטוטאל של ההזמנה הנוכחית
        note,
      });

      if (response.error) {
        console.error(response.error);
        toast.error("Error: " + response.error.message, { duration: 4000 });
        return;
      }

      const tickets = response.data?.addOrderToTable?.tickets ?? [];
      if (tickets.length === 0) {
        toast.error("Order created but NO KDS tickets — check item categories", { duration: 5000 });
      } else {
        toast.success(`Order sent! ${tickets.length} ticket(s) created`, { duration: 3000 });
      }
      resetCart();
      setNote("");
    } catch (error) {
      console.error("Error while creating table order:", error);
      toast.error("An unexpected error occurred.", { duration: 3000 });
    }
  };

  // --- Render ---

  if (!tableId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
        <FaUtensils className="text-4xl mb-2 text-gray-300" />
        <p>Please select a table to start.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
      
      {/* Header */}
      <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-gray-800">
            Table {tableNumber}
            </h2>
            <p className="text-xs text-gray-500 font-medium">ORDER SUMMARY</p>
        </div>
        {activeOrders.length > 0 && (
            <div className="flex flex-col items-end">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    {activeOrders.length} Active Rounds
                </span>
            </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
        
        {/* Section 1: Previous/Active Orders (Sent to Kitchen) */}
        {loadingActiveOrders ? (
           <div className="flex justify-center p-8"><FaSpinner className="animate-spin text-gray-400 text-xl" /></div>
        ) : allPreviousItems.length > 0 ? (
            <div className="border border-blue-100 rounded-xl bg-blue-50/30 p-4">
                <div className="flex items-center gap-2 mb-3 text-blue-800 border-b border-blue-100 pb-2">
                    <FaCheckCircle className="text-sm" />
                    <h3 className="text-sm font-bold uppercase tracking-wide">In Kitchen / Served</h3>
                </div>
                <div className="space-y-4">
                    {activeOrders.map((order, oIdx) => {
                      const orderItems = Array.isArray(order.cart)
                        ? order.cart.map((c: any) => ({ id: c.id, title: c.title || "Unknown", price: Number(c.price) || 0, quantity: Number(c.quantity) || 1 }))
                        : [];
                      if (orderItems.length === 0) return null;
                      return (
                        <div key={order.id || oIdx}>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-semibold text-blue-600">Round {oIdx + 1}</span>
                            <TicketDots tickets={order.tickets as any} />
                          </div>
                          <div className="space-y-1.5 pl-2">
                            {orderItems.map((item: any, idx: number) => (
                              <div key={`${item.id}-${idx}`} className="flex justify-between items-start text-sm text-gray-700">
                                <div className="flex gap-2">
                                  <span className="font-semibold text-gray-900 w-6">{item.quantity}x</span>
                                  <span className="text-gray-600">{item.title}</span>
                                </div>
                                <span className="font-medium whitespace-nowrap">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
                <div className="mt-4 pt-2 border-t border-blue-200 flex justify-between text-sm font-bold text-blue-900">
                    <span>Subtotal (Ordered)</span>
                    <span>${existingSubTotal.toFixed(2)}</span>
                </div>
            </div>
        ) : null}


        {/* Section 2: Current Cart (Not Sent Yet) */}
        <div>
            <div className="flex items-center gap-2 mb-3 text-gray-800 pb-2 border-b border-gray-200">
                <FaCartArrowDown className="text-sm text-green-600" />
                <h3 className="text-sm font-bold uppercase tracking-wide">New Items (Cart)</h3>
            </div>
            
            {menus.length > 0 ? (
                <div className="px-1">
                    <CartList />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    <span className="text-sm italic">Cart is empty</span>
                    <span className="text-xs">Add items from the menu</span>
                </div>
            )}
        </div>

        {/* Section 3: Totals & Summary */}
        <section className="border-t border-gray-200 pt-5 bg-gray-50/50 -mx-4 px-6 pb-4 mt-auto">
          <dl className="space-y-3 text-sm">
            
            {/* Breakdown */}
            <div className="flex justify-between text-gray-600">
              <dt>Current Cart</dt>
              <dd className="font-medium">${cartSubTotal.toFixed(2)}</dd>
            </div>
            
            {existingSubTotal > 0 && (
                <div className="flex justify-between text-gray-600">
                    <dt>Previous Orders</dt>
                    <dd className="font-medium">${existingSubTotal.toFixed(2)}</dd>
                </div>
            )}

            {(serviceFee > 0 || discount > 0) && (
                <>
                    <div className="flex justify-between text-gray-500 text-xs">
                    <dt>Service Fee</dt>
                    <dd>${serviceFee.toFixed(2)}</dd>
                    </div>

                    {discount > 0 && (
                        <div className="flex justify-between text-green-600 text-xs">
                        <dt>Discount</dt>
                        <dd>-${discount.toFixed(2)}</dd>
                        </div>
                    )}
                </>
            )}

            <div className="border-t border-gray-300 my-2"></div>

            <div className="flex justify-between items-center">
              <dt className="text-lg font-black text-gray-900">Grand Total</dt>
              <dd className="text-2xl font-black text-gray-900">${grandTotal.toFixed(2)}</dd>
            </div>
          </dl>

          {/* Note Input */}
          <div className="mt-5">
            <label htmlFor="note" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Kitchen Notes
            </label>
            <textarea
                id="note"
                rows={2}
                placeholder="Ex: No cilantro on table 5, Sauce on side..."
                className="w-full p-3 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all shadow-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Action Button */}
          <button
            onClick={handleTableOrder}
            disabled={menus.length === 0 || submitting}
            className={`w-full mt-5 flex justify-center items-center gap-2 px-4 py-4 border border-transparent text-base font-bold rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-[0.98]
                ${menus.length === 0 || submitting 
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none" 
                    : "bg-green-600 text-white hover:bg-green-700 hover:shadow-green-200"}`}
          >
            {submitting ? (
                <>
                    <FaSpinner className="animate-spin" /> Sending Order...
                </>
            ) : (
                <>
                    <FaReceipt /> 
                    <span>Fire {menus.length} Items</span>
                </>
            )}
          </button>
        </section>
      </div>
    </div>
  );
}