"use client";

interface OrderTypeBadgeProps {
  orderType: string;
  tableNumber?: number | null;
}

export default function OrderTypeBadge({ orderType, tableNumber }: OrderTypeBadgeProps) {
  if (orderType === "DINE_IN") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-600/80 px-2.5 py-0.5 text-xs font-semibold text-white">
        Table {tableNumber ?? "?"}
      </span>
    );
  }

  if (orderType === "DELIVERY") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-600/80 px-2.5 py-0.5 text-xs font-semibold text-white">
        Delivery
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full bg-orange-600/80 px-2.5 py-0.5 text-xs font-semibold text-white">
      Takeaway
    </span>
  );
}
