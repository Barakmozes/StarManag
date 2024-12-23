// graphql/schema/Order/enum.ts

import { builder } from "@/graphql/builder";

/**
 * OrderStatus
 * 
 * Represents various statuses an order can have in the system.
 * Based on the Prisma enum:
 *  - PREPARING
 *  - UNASSIGNED
 *  - COLLECTED
 *  - DELIVERED
 *
 * Feel free to expand if your schema includes more statuses
 * (like PENDING, READY, etc.), but for now we'll keep it
 * to the values shown.
 */
export const OrderStatus = builder.enumType("OrderStatus", {
  values: ["PREPARING", "UNASSIGNED", "COLLECTED", "DELIVERED"] as const,
  description: "Order status",
});
