import { builder } from "@/graphql/builder";

export const TimeEntryType = builder.enumType("TimeEntryType", {
  values: ["CLOCK_IN", "CLOCK_OUT"] as const,
  description: "Type of time entry event",
});

export const TimeEntryStatus = builder.enumType("TimeEntryStatus", {
  values: ["ACTIVE", "COMPLETED", "AUTO_CLOSED", "EDITED"] as const,
  description: "The status of a time entry",
});
