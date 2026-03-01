// graphql/schema/KitchenTicket/enum.ts
import { builder } from "@/graphql/builder";

export const DisplayStation = builder.enumType("DisplayStation", {
  values: ["KITCHEN", "BAR"] as const,
  description: "Which preparation station handles this category/ticket.",
});

export const TicketStatus = builder.enumType("TicketStatus", {
  values: [
    "NEW",
    "IN_PROGRESS",
    "COMPLETED",
    "RECALLED",
    "CANCELLED",
  ] as const,
  description: "Lifecycle status of a kitchen/bar ticket.",
});

export const TicketItemStatus = builder.enumType("TicketItemStatus", {
  values: [
    "PENDING",
    "IN_PROGRESS",
    "DONE",
    "CANCELLED",
  ] as const,
  description: "Status of an individual item within a ticket.",
});
