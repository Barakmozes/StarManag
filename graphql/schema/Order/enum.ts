// graphql/schema/Order/enum.ts
import { builder } from "@/graphql/builder";

export const OrderStatus = builder.enumType("OrderStatus", {
  values: [
    "PREPARING",
    "UNASSIGNED",
    "COLLECTED",
    "DELIVERED",
    "PENDING",
    "READY",
    "SERVED",
    "COMPLETED",
    "CANCELLED",
  ] as const,
  description: "All possible statuses an order can have.",
});
