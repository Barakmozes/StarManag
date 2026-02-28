import { builder } from "../../builder";

export const NotificationPriorityEnum = builder.enumType("NotificationPriority", {
  values: ["LOW", "NORMAL", "HIGH"] as const,
});

export const NotificationStatusEnum = builder.enumType("NotificationStatus", {
  values: ["READ", "UNREAD"] as const,
});
