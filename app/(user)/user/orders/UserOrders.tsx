"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@urql/next";
import { Order, User } from "@prisma/client";
import {
  HiOutlineChevronLeft,
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineTruck,
  HiOutlineBuildingStorefront,
} from "react-icons/hi2";
import { CiReceipt } from "react-icons/ci";

import Container from "@/app/components/Common/Container";
import UserDeliveredModal from "./UserDeliveredModal";
import UserOnDeliveryModal from "./UserOnDeliveryModal";

import {
  GetUserDocument,
  GetUserQuery,
  GetUserQueryVariables,
} from "@/graphql/generated";

/**
 * ✅ Chronological sorting based on Prisma model:
 * Primary: orderDate (business time)
 * Fallback: createdAt
 */

type Props = { user: User };
type SortDir = "desc" | "asc"; // desc = newest first

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  const d = new Date(value as any);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDateTime(value: unknown) {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function formatMoney(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    maximumFractionDigits: 2,
  }).format(n);
}

function sortOrdersByBusinessTime<T extends { orderDate?: any; createdAt?: any }>(
  arr: T[],
  dir: SortDir
) {
  const factor = dir === "desc" ? -1 : 1;

  return [...arr].sort((a, b) => {
    const ta =
      toDate(a.orderDate)?.getTime() ?? toDate(a.createdAt)?.getTime() ?? 0;
    const tb =
      toDate(b.orderDate)?.getTime() ?? toDate(b.createdAt)?.getTime() ?? 0;

    if (ta === tb) return 0;
    return ta > tb ? factor : -factor;
  });
}

function badgeBase(active: boolean) {
  return [
    "text-sm px-3 py-2 min-h-[44px] rounded-full border transition whitespace-nowrap",
    active
      ? "bg-slate-900 text-white border-slate-900"
      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
  ].join(" ");
}

function statusBadge(status: string) {
  switch (status) {
    case "DELIVERED":
      return "bg-green-100 text-green-700 border-green-200";
    case "ON_DELIVERY":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "PREPARING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "CANCELLED":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "DELIVERED":
      return "נמסר";
    case "ON_DELIVERY":
      return "בדרך";
    case "PREPARING":
      return "בהכנה";
    case "CANCELLED":
      return "בוטל";
    default:
      return status;
  }
}

function typeLabel(o: any) {
  // Based on model fields: tableId / pickupTime / deliveryAddress
  if (o?.tableId)
    return {
      label: "שולחן",
      icon: <HiOutlineBuildingStorefront size={18} />,
    };
  if (o?.pickupTime)
    return {
      label: "איסוף",
      icon: <HiOutlineClock size={18} />,
    };
  return { label: "משלוח", icon: <HiOutlineTruck size={18} /> };
}

export default function UserOrders({ user }: Props) {
  const userEmail = user?.email ?? "";
  const userRole = user?.role ?? "";
  const isStaff = ["WAITER", "MANAGER"].includes(userRole);

  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const [{ data, fetching, error }] = useQuery<
    GetUserQuery,
    GetUserQueryVariables
  >({
    query: GetUserDocument,
    variables: { email: userEmail },
  });

  const rawOrders = (data?.getUser?.order as any[]) ?? [];

  const { tableOrders, otherOrders } = useMemo(() => {
    const table = rawOrders.filter((o) => o.tableId != null);
    const other = rawOrders.filter((o) => o.tableId == null);
    return {
      tableOrders: sortOrdersByBusinessTime(table, sortDir),
      otherOrders: sortOrdersByBusinessTime(other, sortDir),
    };
  }, [rawOrders, sortDir]);

  const totalCount = rawOrders.length;

  if (fetching) {
    return (
      <Container>
        <div className="mt-6 sm:mt-8 space-y-6">
          <div className="h-8 w-44 bg-slate-100 rounded animate-pulse mx-auto" />
          <div className="h-10 w-80 max-w-full bg-slate-100 rounded-full animate-pulse mx-auto" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="border rounded-xl p-4 bg-white shadow-sm"
              >
                <div className="h-5 w-24 bg-slate-100 rounded animate-pulse mb-4" />
                <div className="h-16 bg-slate-100 rounded animate-pulse mb-4" />
                <div className="h-10 bg-slate-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </Container>
    );
  }

  if (error) {
    console.error("Error fetching user orders:", error);
    return (
      <Container>
        <div className="mt-12 flex flex-col items-center text-center gap-3 px-2">
          <div className="text-red-600 font-semibold">שגיאה בטעינת ההזמנות</div>
          <div className="text-sm text-slate-500">נסה לרענן את הדף.</div>
          <Link
            href="/user"
            className="inline-flex w-full max-w-sm min-h-[44px] items-center justify-center bg-green-600 text-base px-5 py-2.5 text-white border border-green-500 gap-2 rounded-full hover:text-green-700 hover:bg-green-200 transition"
          >
            <HiOutlineChevronLeft />
            <span>חזרה לפרופיל</span>
          </Link>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {/* Header */}
      <div className="mt-6 text-center space-y-3 px-1">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl tracking-tight text-gray-700 leading-tight">
          ההזמנות שלי
        </h2>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Link
            href="/user"
            className="inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center bg-green-600 text-base px-5 py-2.5 text-white border border-green-500 gap-2 rounded-full hover:text-green-700 hover:bg-green-200 transition"
          >
            <HiOutlineChevronLeft />
            <span>חזרה לפרופיל</span>
          </Link>

          {totalCount > 0 && (
            <div className="w-full sm:w-auto flex flex-wrap items-center justify-center gap-2 rounded-2xl border bg-white p-2 shadow-sm">
              <button
                type="button"
                onClick={() => setSortDir("desc")}
                className={badgeBase(sortDir === "desc")}
              >
                חדש → ישן
              </button>
              <button
                type="button"
                onClick={() => setSortDir("asc")}
                className={badgeBase(sortDir === "asc")}
              >
                ישן → חדש
              </button>
            </div>
          )}
        </div>

        {totalCount > 0 && (
          <div className="text-sm text-slate-500">
            סה״כ{" "}
            <span className="font-semibold text-slate-700">{totalCount}</span>{" "}
            הזמנות • מסודר לפי{" "}
            <span className="font-semibold text-slate-700">orderDate</span>
          </div>
        )}
      </div>

      {/* Empty state */}
      {totalCount < 1 && (
        <div className="mt-12 flex flex-col items-center text-center gap-3 px-2">
          <div className="text-slate-700 font-semibold">אין הזמנות להצגה</div>
          <div className="text-sm text-slate-500">
            ברגע שתבצע הזמנה — היא תופיע כאן.
          </div>
        </div>
      )}

      {/* Table orders for staff */}
      {isStaff && tableOrders.length > 0 && (
        <section className="py-6 sm:py-10">
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
              הזמנות שולחן{" "}
              <span className="text-sm text-slate-500 font-normal">
                ({tableOrders.length})
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {tableOrders.map((order) => (
              <OrderCard key={order.id} order={order as Order} />
            ))}
          </div>
        </section>
      )}

      {/* Other orders (delivery/pickup) */}
      {otherOrders.length > 0 && (
        <section className="py-6 sm:py-10">
          <div className="flex items-end justify-between mb-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
              הזמנות{" "}
              <span className="text-sm text-slate-500 font-normal">
                ({otherOrders.length})
              </span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {otherOrders.map((order) => (
              <OrderCard key={order.id} order={order as Order} />
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}

function OrderCard({ order }: { order: Order }) {
  const o: any = order;

  const orderedAt = formatDateTime(o.orderDate ?? o.createdAt);
  const updatedAt = formatDateTime(o.updatedAt);

  const deliveryTime = formatDateTime(o.deliveryTime);
  const pickupTime = formatDateTime(o.pickupTime);

  const type = typeLabel(o);
  const isDelivered = o.status === "DELIVERED";

  return (
    <div className="group flex flex-col border rounded-xl bg-white shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Modal trigger area */}
      <div className="p-3">
        {isDelivered ? (
          <UserDeliveredModal order={order} />
        ) : (
          <UserOnDeliveryModal order={order} />
        )}
        <div className="mt-2 text-xs text-slate-500">
          לחץ על האיקון לצפייה בפרטי ההזמנה
        </div>
      </div>

      <div className="mt-auto border-t bg-slate-50 p-3">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-700 min-w-0">
            <div className="p-2 rounded-lg bg-white border shrink-0">
              <CiReceipt size={22} />
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-xs text-slate-500">הזמנה</div>
              <div className="text-sm font-semibold break-all">
                #{o.orderNumber}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span
              className={[
                "text-xs px-2 py-1 rounded-full border font-semibold whitespace-nowrap",
                statusBadge(o.status),
              ].join(" ")}
            >
              {statusLabel(o.status)}
            </span>

            <span
              className={[
                "text-xs px-2 py-1 rounded-full border font-semibold whitespace-nowrap",
                o.paid
                  ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-700 border-slate-200",
              ].join(" ")}
            >
              {o.paid ? "שולם" : "לא שולם"}
            </span>
          </div>
        </div>

        {/* Middle: meta chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border bg-white text-slate-700">
            {type.icon}
            <span>{type.label}</span>
            {o.preOrder ? (
              <span className="text-slate-500">• PreOrder</span>
            ) : null}
          </span>

          {o.discount != null && Number(o.discount) > 0 && (
            <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border bg-white text-slate-700">
              הנחה:{" "}
              <span className="font-semibold">{formatMoney(o.discount)}</span>
            </span>
          )}

          <span className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border bg-white text-slate-700">
            סה״כ: <span className="font-semibold">{formatMoney(o.total)}</span>
          </span>
        </div>

        {/* Dates grid */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-lg bg-white border p-2 min-w-0">
            <HiOutlineCalendarDays
              size={18}
              className="text-slate-500 shrink-0"
            />
            <div className="leading-tight min-w-0">
              <div className="text-[11px] text-slate-500">תאריך הזמנה</div>
              <div className="text-xs font-semibold text-slate-700 break-words">
                {orderedAt}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white border p-2 min-w-0">
            <HiOutlineClock size={18} className="text-slate-500 shrink-0" />
            <div className="leading-tight min-w-0">
              <div className="text-[11px] text-slate-500">עודכן</div>
              <div className="text-xs font-semibold text-slate-700 break-words">
                {updatedAt}
              </div>
            </div>
          </div>
        </div>

        {/* Delivery / pickup time */}
        {(o.deliveryTime || o.pickupTime) && (
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="rounded-lg bg-white border p-2 min-w-0">
              <div className="text-[11px] text-slate-500">זמן משלוח</div>
              <div className="text-xs font-semibold text-slate-700 break-words">
                {deliveryTime}
              </div>
            </div>
            <div className="rounded-lg bg-white border p-2 min-w-0">
              <div className="text-[11px] text-slate-500">זמן איסוף</div>
              <div className="text-xs font-semibold text-slate-700 break-words">
                {pickupTime}
              </div>
            </div>
          </div>
        )}

        {/* Address (only if delivery + has address) */}
        {!o.tableId && !o.pickupTime && o.deliveryAddress && (
          <div className="mt-2 rounded-lg bg-white border p-2 min-w-0">
            <div className="text-[11px] text-slate-500">כתובת משלוח</div>
            <div className="text-xs font-semibold text-slate-700 break-words line-clamp-2">
              {o.deliveryAddress}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
