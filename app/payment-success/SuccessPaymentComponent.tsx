'use client';

import {
  EditOrderOnPaymentDocument,
  EditOrderOnPaymentMutation,
  EditOrderOnPaymentMutationVariables,
} from "@/graphql/generated";
import { useCartStore } from "@/lib/store";
import { useMutation } from "@urql/next";
import { useRouter, useSearchParams } from "next/navigation";
import { AiOutlineCheck } from "react-icons/ai";
import ConfettiExplosion from "react-confetti-explosion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const SuccessPaymentComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract parameters from the PayPlus response
  const paymentToken = searchParams.get("page_request_uid"); // Unique payment token
  const transactionUid = searchParams.get("transaction_uid"); // Transaction UID
  const status = searchParams.get("status"); // Transaction status (e.g., "approved")
  const orderId = searchParams.get("orderId"); // Order ID
  const amount = searchParams.get("amount"); // Transaction amount (optional)

  const { resetCart } = useCartStore();
  const [loading, setLoading] = useState(false);

  // Mutation to update the order based on payment success
  const [_, editOrderOnPayment] = useMutation<
    EditOrderOnPaymentMutation,
    EditOrderOnPaymentMutationVariables
  >(EditOrderOnPaymentDocument);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      // Ensure all required parameters are present
      if (!orderId || !paymentToken || !transactionUid || !status) {
        toast.error("Invalid payment details. Unable to process the order.", { duration: 800 });
        console.error("Missing required parameters:", {
          orderId,
          paymentToken,
          transactionUid,
          status,
        });
        return;
      }

      // Check if the transaction was successful
      if (status !== "approved") {
        toast.error("Payment was not successful. Please contact support.", { duration: 800 });
        console.error("Transaction failed with status:", status);
        return;
      }

      try {
        setLoading(true);

        console.log("Updating order with payment details:", {
          orderId,
          paymentToken,
          transactionUid,
          amount,
        });

        // Call the mutation to update the order
        const res = await editOrderOnPayment({
          editOrderOnPaymentId: orderId,
          paymentToken, // Use the payment token from PayPlus
        });

        console.log("Mutation response:", res);

        if (res.data?.editOrderOnPayment) {
          toast.success("Order updated successfully!", { duration: 800 });
          resetCart();
          router.push(`/user/orders`);
        } else {
          console.error("Mutation failed. Response:", res.error || "Unknown error");
          throw new Error("Failed to update order in the database.");
        }
      } catch (error) {
        console.error("Error updating order:", error);
        toast.error("An error occurred while updating the order. Please contact support.", {
          duration: 800,
        });
      } finally {
        setLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [orderId, paymentToken, transactionUid, status, amount, editOrderOnPayment, resetCart, router]);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 mb-24">
      <div className="w-full rounded-lg shadow-xl sm:max-w-md p-6">
        <div className="flex items-center justify-center space-x-4 p-4 rounded-lg bg-green-600 text-white">
          <h1 className="font-bold text-2xl">Payment Successful!</h1>
          <AiOutlineCheck size={28} />
        </div>
        <ConfettiExplosion className="absolute m-auto" />
        {loading && (
          <div className="mt-4 text-center text-gray-600">
            <p>Processing your order...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuccessPaymentComponent;
