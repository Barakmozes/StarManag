import { builder } from "@/graphql/builder";

export const ShiftStatus = builder.enumType("ShiftStatus", {
  values: ["DRAFT", "PUBLISHED", "CANCELLED"] as const,
  description: "The status of a scheduled shift",
});
