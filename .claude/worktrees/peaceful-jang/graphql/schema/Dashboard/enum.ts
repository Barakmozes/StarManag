import { builder } from "../../builder";

export const RevenueGroupByEnum = builder.enumType("RevenueGroupBy", {
  values: {
    DAY: { value: "DAY" },
    WEEK: { value: "WEEK" },
    MONTH: { value: "MONTH" },
  },
});
