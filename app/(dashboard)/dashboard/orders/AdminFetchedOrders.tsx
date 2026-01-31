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
} from "@/graphql/generated";

type OrderNode = NonNullable<NonNullable<GetOrdersQuery["getOrders"]["edges"][number]>["node"]>;

function parseStatusList(raw: string | null): OrderStatus[] {
  if (!raw) return [];
  const allowed = new Set<string>(Object.values(OrderStatus));
  const parts = raw.split(/[,\s]+/g).map((s) => s.trim().toUpperCase()).filter(Boolean);

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
    const nodes = data?.getOrders?.edges?.map((e) => e?.node).filter((n): n is OrderNode => !!n) ?? [];
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

  return (
    <>
      <tbody>
        {showSkeleton ? (
          Array.from({ length: pageSize }).map((_, idx) => (
            <tr key={`sk-${idx}`} className="bg-white animate-pulse whitespace-nowrap">
              {Array.from({ length: 9 }).map((__, i) => (
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
              <td className="px-6 py-3">{o.paymentToken ?? "-"}</td>
              <td className="px-6 py-3">
                {(() => {
                  const d = new Date(o.orderDate as any);
                  return Number.isFinite(d.getTime()) ? d.toLocaleString() : String(o.orderDate);
                })()}
              </td>
              <td className="px-6 py-3">{o.userName}</td>
              <td className="px-6 py-3 max-w-xs">
                <p className="truncate">{o.deliveryAddress}</p>
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
                    className="rounded text-xs font-semibold bg-green-100 px-2 py-1 text-green-600 hover:bg-green-200"
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
                    className="rounded text-xs font-semibold bg-red-100 px-2 py-1 text-red-500 hover:bg-red-200"
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
            <td className="px-6 py-10 text-center text-gray-500" colSpan={9}>
              No orders match your filters.
            </td>
          </tr>
        )}
      </tbody>

      <tfoot>
        <tr>
          <td colSpan={9} className="py-3 text-center">
            {hasNextPage && endCursor ? (
              <button
                onClick={() => {
                  if (loadingMore) return;
                  setLoadingMore(true);
                  setAfter(endCursor as string);
                }}
                className="bg-green-600 text-white hover:bg-green-200 hover:text-green-700 py-1 px-2 rounded focus:outline-none disabled:opacity-60"
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            ) : null}
          </td>
        </tr>
      </tfoot>
    </>
  );
}
