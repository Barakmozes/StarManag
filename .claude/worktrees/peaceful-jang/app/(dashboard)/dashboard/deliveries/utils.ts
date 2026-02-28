// app/(dashboard)/dashboard/deliveries/utils.ts
import { CombinedError } from "urql";
import { OrderStatus } from "@/graphql/generated";

export function getGqlErrorMessage(err: CombinedError | undefined | null) {
  if (!err) return "Something went wrong";
  const gqlMsg = err.graphQLErrors?.[0]?.message;
  if (gqlMsg) return gqlMsg;
  if (err.networkError) return "Network error. Please try again.";
  return err.message || "Something went wrong";
}

export function formatDateTime(value: any) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("he-IL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export function statusBadge(status: OrderStatus) {
  const label = String(status).toLowerCase();

  const className =
    (status === OrderStatus.Preparing && "bg-blue-100 text-blue-600") ||
    (status === OrderStatus.Unassigned && "bg-orange-100 text-orange-600") ||
    (status === OrderStatus.Collected && "bg-red-100 text-red-600") ||
    (status === OrderStatus.Delivered && "bg-green-100 text-green-600") ||
    "bg-slate-100 text-slate-600";

  return { label, className };
}
