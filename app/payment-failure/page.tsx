// app/payment-failure/page.tsx

"use client";
import { useSearchParams } from "next/navigation";

const PaymentFailurePage = () => {
  const searchParams = useSearchParams();

  const responseCode = searchParams.get("Response");

  return (
    <div>
      <h1>Payment Failed</h1>
      <p>Error Code: {responseCode}</p>
      <p>Please try again or contact support if this problem persists.</p>
    </div>
  );
};

export default PaymentFailurePage;
