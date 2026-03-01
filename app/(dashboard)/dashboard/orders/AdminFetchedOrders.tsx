"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { useQuery, useMutation } from "@urql/next";
import { HiCheck, HiXCircle } from "react-icons/hi2";
import type { Order as PrismaOrder } from "@prisma/client";

import AdminOrderModal from "./AdminOrderModal";

import {
  EditOrderDocument,
  type EditOrderMutation,
  type EditOrderMutationVariables,
  GetOrdersDocument,
  type GetOrdersQuery,
  type GetOrdersQueryVariables,
  OrderStatus,
  DisplayStation,
  TicketStatus,
} from "@/graphql/generated";

type OrderNode = NonNullable<NonNullable<GetOrdersQuery["getOrders"]["edges"][number]>["node"]>;

function parseStatusList(raw: string | null): OrderStatus[] {
  if (!raw) return [];
  const allowed = new Set<string>(Object.values(OrderStatus));
  const parts = raw
    .split(/[,\s]+/g)
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const out: OrderStatus[] = [];
  for (const p of parts) if (allowed.has(p) && !out.includes(p as OrderStatus)) out.push(p as OrderStatus);
  return out;
}

function parsePaid(raw: string | null): boolean | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (["1", "true", "yes"].includes(v)) return true;
  if (["0", "false", "no"].includes(v)) return false;
  return undefined;
}

function ticketStatusColor(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.New: return "bg-blue-500";
    case TicketStatus.InProgress: return "bg-yellow-500";
    case TicketStatus.Completed: return "bg-green-500";
    case TicketStatus.Recalled: return "bg-orange-500";
    case TicketStatus.Cancelled: return "bg-gray-400";
    default: return "bg-gray-300";
  }
}

function ticketStatusLabel(status: TicketStatus): string {
  switch (status) {
    case TicketStatus.New: return "New";
    case TicketStatus.InProgress: return "In Progress";
    case TicketStatus.Completed: return "Done";
    case TicketStatus.Recalled: return "Recalled";
    case TicketStatus.Cancelled: return "Cancelled";
    default: return status;
  }
}

function TicketDots({ tickets }: { tickets?: Array<{ station: DisplayStation; status: TicketStatus }> }) {
  if (!tickets || tickets.length === 0) return null;
  const kitchen = tickets.find((t) => t.station === DisplayStation.Kitchen);
  const bar = tickets.find((t) => t.station === DisplayStation.Bar);
  return (
    <span className="inline-flex items-center gap-1.5">
      {kitchen && (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${ticketStatusColor(kitchen.status)}`}
          title={`Kitchen: ${ticketStatusLabel(kitchen.status)}`}
        />
      )}
      {bar && (
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ring-1 ring-white ${ticketStatusColor(bar.status)}`}
          title={`Bar: ${ticketStatusLabel(bar.status)}`}
        />
      )}
    </span>
  );
}

type Props = { pageSize?: number };

export default function AdminFetchedOrders({ pageSize = 8 }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  const search = (sp.get("q") ?? "").trim();
  const statusIn = parseStatusList(sp.get("status"));
  const paid = parsePaid(sp.get("paid"));

  const filtersKey = useMemo(
    () => `${search}__${statusIn.join(",")}__${paid === undefined ? "" : String(paid)}`,
    [search, statusIn, paid]
  );

  const [after, setAfter] = useState<string | null>(null);
  const [acc, setAcc] = useState<OrderNode[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // reset when filters change
  useEffect(() => {
    setAfter(null);
    setAcc([]);
    setLoadingMore(false);
  }, [filtersKey]);

  const variables = useMemo<GetOrdersQueryVariables>(
    () => ({
      first: pageSize,
      after,
      search: search ? search : undefined,
      statusIn: statusIn.length ? statusIn : undefined,
      paid,
    }),
    [pageSize, after, search, statusIn, paid]
  );

  const [{ data, fetching, error }] = useQuery<GetOrdersQuery, GetOrdersQueryVariables>({
    query: GetOrdersDocument,
    variables,
    requestPolicy: "cache-first",
  });

  const pageInfo = data?.getOrders?.pageInfo;
  const endCursor = pageInfo?.endCursor ?? null;
  const hasNextPage = !!pageInfo?.hasNextPage;

  const lastErrRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error) return;
    const msg = error.message ?? "Failed to load orders.";
    if (lastErrRef.current === msg) return;
    lastErrRef.current = msg;
    toast.error("Failed to load orders.");
  }, [error]);

  // append page results (server already sorted newest-first)
  useEffect(() => {
    const nodes =
      data?.getOrders?.edges?.map((e) => e?.node).filter((n): n is OrderNode => !!n) ?? [];
    if (!nodes.length) {
      setLoadingMore(false);
      return;
    }

    setAcc((prev) => {
      const seen = new Set(prev.map((x) => x.id));
      const next = [...prev];
      for (const n of nodes) if (!seen.has(n.id)) next.push(n);
      return next;
    });

    setLoadingMore(false);
  }, [data?.getOrders?.edges]);

  // mutations
  const [, editOrder] = useMutation<EditOrderMutation, EditOrderMutationVariables>(EditOrderDocument);

  const changeOrderStatus = useCallback(
    async (id: string, newStatus: OrderStatus, successMessage: string) => {
      const toastId = toast.loading("Updating order...");
      try {
        const res = await editOrder({ editOrderId: id, status: newStatus });
        if (res.data?.editOrder) {
          toast.success(successMessage, { id: toastId, duration: 1200 });

          setAcc((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
          router.refresh();
        } else {
          toast.error("An error occurred.", { id: toastId, duration: 2000 });
        }
      } catch (err: any) {
        toast.error(err?.message || "An error occurred.", { id: toastId, duration: 2000 });
      }
    },
    [editOrder, router]
  );

  const markCollected = (id: string) =>
    changeOrderStatus(id, OrderStatus.Collected, "Order status changed to Collected");

  const markDelivered = (id: string) =>
    changeOrderStatus(id, OrderStatus.Delivered, "Order status changed to Delivered");

  const showSkeleton = fetching && acc.length === 0;

  const formatOrderDate = (o: OrderNode) => {
    const d = new Date(o.orderDate as any);
    return Number.isFinite(d.getTime()) ? d.toLocaleString() : String(o.orderDate);
  };

  const loadMore = () => {
    if (!hasNextPage || !endCursor) return;
    if (loadingMore) return;
    setLoadingMore(true);
    setAfter(endCursor as string);
  };

  return (
    <div className="space-y-4">
      {/* Mobile: card list */}
      <div className="md:hidden space-y-3">
        {showSkeleton ? (
          Array.from({ length: pageSize }).map((_, idx) => (
            <div
              key={`mob-sk-${idx}`}
              className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm animate-pulse"
              aria-hidden="true"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-40 rounded bg-slate-200" />
                  <div className="h-3 w-24 rounded bg-slate-200" />
                </div>
                <div className="h-11 w-11 rounded bg-slate-200" />
              </div>

              <div className="mt-4 space-y-2">
                <div className="h-3 w-2/3 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-200" />
                <div className="h-3 w-3/4 rounded bg-slate-200" />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="h-11 rounded bg-slate-200" />
                <div className="h-11 rounded bg-slate-200" />
              </div>
            </div>
          ))
        ) : acc.length ? (
          acc.map((o) => (
            <div
              key={o.id}
              className="rounded-lg border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 break-words">
                    Order #{o.orderNumber}{" "}
                    <TicketDots tickets={o.tickets as any} />
                  </p>
                  <p className="text-xs text-slate-500">{formatOrderDate(o)}</p>
                </div>

                <div className="shrink-0">
                  <AdminOrderModal order={o as unknown as PrismaOrder} />
                </div>
              </div>

              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500">Payment Token</dt>
                  <dd className="text-slate-800 break-all">{o.paymentToken ?? "-"}</dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Customer</dt>
                  <dd className="text-slate-800 break-words">{o.userName}</dd>
                </div>

                <div>
                  <dt className="text-xs text-slate-500">Delivery Address</dt>
                  <dd className="text-slate-800 break-words">{o.deliveryAddress}</dd>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <dt className="text-xs text-slate-500">Paid</dt>
                  <dd className="text-sm">
                    {o.paid ? (
                      <span className="inline-flex items-center gap-2 text-green-700">
                        <HiCheck className="h-5 w-5" />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-red-600">
                        <HiXCircle className="h-5 w-5" />
                        Unpaid
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {/* Collected */}
                {o.status === OrderStatus.Collected || o.status === OrderStatus.Delivered ? (
                  <div className="min-h-11 rounded-md bg-green-50 text-green-700 flex items-center justify-center gap-2 text-sm font-medium">
                    <HiCheck className="h-5 w-5" />
                    Collected
                  </div>
                ) : (
                  <button
                    type="button"
                    className="min-h-11 rounded-md text-sm font-semibold bg-green-100 px-3 py-2 text-green-700 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    onClick={() => markCollected(o.id)}
                  >
                    Mark Collected
                  </button>
                )}

                {/* Delivered */}
                {o.status === OrderStatus.Delivered ? (
                  <div className="min-h-11 rounded-md bg-green-50 text-green-700 flex items-center justify-center gap-2 text-sm font-medium">
                    <HiCheck className="h-5 w-5" />
                    Delivered
                  </div>
                ) : (
                  <button
                    type="button"
                    className="min-h-11 rounded-md text-sm font-semibold bg-red-100 px-3 py-2 text-red-600 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                    onClick={() => markDelivered(o.id)}
                  >
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-slate-100 bg-white p-6 text-center text-gray-500">
            No orders match your filters.
          </div>
        )}

        {hasNextPage && endCursor ? (
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={loadMore}
              className="min-h-11 w-full rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-200 hover:text-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-60"
              disabled={loadingMore}
            >
              {loadingMore ? "Loading..." : "Load More"}
            </button>
          </div>
        ) : null}
      </div>

      {/* Desktop: table (with horizontal scroll support for smaller screens) */}
      <div className="hidden md:block">
        <div className="overflow-x-auto rounded-md border border-slate-100">
          <table className="min-w-[1100px] w-full text-left text-slate-500">
            <thead className="text-xs whitespace-nowrap text-slate-700 uppercase bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Order-Number
                </th>
                <th scope="col" className="px-6 py-3">
                  Payment Token
                </th>
                <th scope="col" className="px-6 py-3">
                  Order-Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Customer
                </th>
                <th scope="col" className="px-6 py-3">
                  Delivery Address
                </th>
                <th scope="col" className="px-6 py-3">
                  Prep
                </th>
                <th scope="col" className="px-6 py-3">
                  Paid
                </th>
                <th scope="col" className="px-6 py-3">
                  Collected
                </th>
                <th scope="col" className="px-6 py-3">
                  Delivered
                </th>
                <th scope="col" className="px-6 py-3">
                  View
                </th>
              </tr>
            </thead>

            <tbody>
              {showSkeleton ? (
                Array.from({ length: pageSize }).map((_, idx) => (
                  <tr key={`sk-${idx}`} className="bg-white animate-pulse whitespace-nowrap">
                    {Array.from({ length: 10 }).map((__, i) => (
                      <td key={`skc-${idx}-${i}`} className="px-6 py-3">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : acc.length ? (
                acc.map((o) => (
                  <tr className="bg-white whitespace-nowrap" key={o.id}>
                    <td className="px-6 py-3">{o.orderNumber}</td>
                    <td className="px-6 py-3">
                      <span className="break-all">{o.paymentToken ?? "-"}</span>
                    </td>
                    <td className="px-6 py-3">{formatOrderDate(o)}</td>
                    <td className="px-6 py-3">{o.userName}</td>
                    <td className="px-6 py-3 max-w-xs">
                      <p className="truncate">{o.deliveryAddress}</p>
                    </td>

                    <td className="px-6 py-3">
                      <TicketDots tickets={o.tickets as any} />
                    </td>

                    <td className="px-6 py-3">
                      {o.paid ? (
                        <HiCheck className="w-5 h-5 font-bold text-green-600" />
                      ) : (
                        <HiXCircle className="text-red-600" size={20} />
                      )}
                    </td>

                    <td className="px-6 py-3">
                      {o.status === OrderStatus.Collected || o.status === OrderStatus.Delivered ? (
                        <HiCheck className="font-bold text-green-600" size={20} />
                      ) : (
                        <button
                          type="button"
                          className="min-h-11 rounded text-sm font-semibold bg-green-100 px-3 py-2 text-green-700 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                          onClick={() => markCollected(o.id)}
                        >
                          Mark Collected
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-3">
                      {o.status === OrderStatus.Delivered ? (
                        <HiCheck className="font-bold text-green-600" size={20} />
                      ) : (
                        <button
                          type="button"
                          className="min-h-11 rounded text-sm font-semibold bg-red-100 px-3 py-2 text-red-600 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                          onClick={() => markDelivered(o.id)}
                        >
                          Mark Delivered
                        </button>
                      )}
                    </td>

                    <td className="px-6 py-3">
                      <AdminOrderModal order={o as unknown as PrismaOrder} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-6 py-10 text-center text-gray-500" colSpan={10}>
                    No orders match your filters.
                  </td>
                </tr>
              )}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan={10} className="py-4 text-center">
                  {hasNextPage && endCursor ? (
                    <button
                      type="button"
                      onClick={loadMore}
                      className="min-h-11 w-full max-w-xs bg-green-600 text-white hover:bg-green-200 hover:text-green-700 px-4 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 disabled:opacity-60"
                      disabled={loadingMore}
                    >
                      {loadingMore ? "Loading..." : "Load More"}
                    </button>
                  ) : null}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
