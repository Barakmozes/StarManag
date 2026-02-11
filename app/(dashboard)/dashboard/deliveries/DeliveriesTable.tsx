// app/(dashboard)/dashboard/deliveries/DeliveriesTable.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";

import { useQuery } from "@urql/next";
import { GET_DELIVERY_ORDERS } from "./deliveries.gql";
import { DeliveriesToastProvider, useDeliveriesToast } from "./DeliveriesToast";
import { formatDateTime, getGqlErrorMessage, statusBadge } from "./utils";
import { OrderStatus } from "@/graphql/generated";

import AssignDriver from "./AssignDriver";
import ViewDeliveryStatus from "./ViewDeliveryStatus";
import OrderDelivered from "./OrderDelivered";
import MarkReady from "./MarkReady";
import PanelWrapper from "../Components/PanelWrapper";

type DeliveryInfo = {
  id: string;
  orderNum: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
};

type DeliveryOrder = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  orderDate: any;
  deliveryTime?: any | null;
  deliveryAddress: string;
  userName: string;
  userPhone: string;
  delivery?: DeliveryInfo | null;
};

function DeliveriesTableInner() {
  const toast = useDeliveriesToast();

  const PAGE_SIZE = 20;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");

  const [after, setAfter] = useState<string | null>(null);
  const [rows, setRows] = useState<DeliveryOrder[]>([]);
  const [requestPolicy, setRequestPolicy] = useState<
    "cache-and-network" | "network-only"
  >("cache-and-network");

  // debounce search
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  // reset pagination when filters change
  useEffect(() => {
    setAfter(null);
    setRows([]);
    setRequestPolicy("network-only");
  }, [search, statusFilter]);

  const statusIn = useMemo(() => {
    if (statusFilter === "ALL") return null;
    return [statusFilter];
  }, [statusFilter]);

  const variables = useMemo(
    () => ({
      first: PAGE_SIZE,
      after,
      search: search || null,
      statusIn,
    }),
    [PAGE_SIZE, after, search, statusIn]
  );

  const [{ data, fetching, error }] = useQuery({
    query: GET_DELIVERY_ORDERS,
    variables,
    requestPolicy,
  });

  // after first network-only refresh, go back to cache-and-network
  useEffect(() => {
    if (!fetching && requestPolicy === "network-only") {
      setRequestPolicy("cache-and-network");
    }
  }, [fetching, requestPolicy]);

  const pageInfo = data?.getDeliveryOrders?.pageInfo;
  const nodes: DeliveryOrder[] = useMemo(() => {
    const edges = data?.getDeliveryOrders?.edges ?? [];
    return edges.map((e: any) => e?.node).filter(Boolean);
  }, [data]);

  // merge / replace rows
  useEffect(() => {
    if (!nodes?.length) return;

    setRows((prev) => {
      if (!after) return nodes;

      // append unique by id
      const map = new Map<string, DeliveryOrder>();
      prev.forEach((o) => map.set(o.id, o));
      nodes.forEach((o) => map.set(o.id, o));
      return Array.from(map.values());
    });
  }, [nodes, after]);

  useEffect(() => {
    if (error) toast.error(getGqlErrorMessage(error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  function refetchFromStart() {
    setAfter(null);
    setRows([]);
    setRequestPolicy("network-only");
  }

  function loadMore() {
    if (!pageInfo?.hasNextPage) return;
    setAfter(pageInfo.endCursor ?? null);
    setRequestPolicy("network-only");
  }

  function renderActions(order: DeliveryOrder) {
    if (order.status === OrderStatus.Preparing) {
      return (
        <MarkReady orderNumber={order.orderNumber} onDone={refetchFromStart} />
      );
    }

    if (order.status === OrderStatus.Unassigned) {
      return (
        <AssignDriver orderNumber={order.orderNumber} onDone={refetchFromStart} />
      );
    }

    if (order.status === OrderStatus.Collected) {
      return (
        <ViewDeliveryStatus
          order={{
            orderNumber: order.orderNumber,
            status: order.status,
            deliveryAddress: order.deliveryAddress,
            userName: order.userName,
            userPhone: order.userPhone,
            orderDate: order.orderDate,
            delivery: order.delivery ?? null,
          }}
          onDone={refetchFromStart}
        />
      );
    }

    if (order.status === OrderStatus.Delivered) {
      return (
        <OrderDelivered
          order={{
            orderNumber: order.orderNumber,
            deliveryAddress: order.deliveryAddress,
            userName: order.userName,
            userPhone: order.userPhone,
            deliveryTime: order.deliveryTime,
            delivery: order.delivery ?? null,
          }}
        />
      );
    }

    return null;
  }

  return (
    <PanelWrapper title="Deliveries">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <div className="flex-1">
          <label htmlFor="deliveries-search" className="sr-only">
            Search delivery orders
          </label>
          <input
            id="deliveries-search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search: order # / customer / phone / address / driver..."
            className="w-full min-h-[44px] border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-200"
            inputMode="search"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label className="sr-only" htmlFor="deliveries-status">
            Status filter
          </label>
          <select
            id="deliveries-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="min-h-[44px] border rounded-md px-3 py-2 bg-white text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value={OrderStatus.Preparing}>PREPARING</option>
            <option value={OrderStatus.Unassigned}>UNASSIGNED</option>
            <option value={OrderStatus.Collected}>COLLECTED</option>
            <option value={OrderStatus.Delivered}>DELIVERED</option>
          </select>

          <button
            type="button"
            className="min-h-[44px] px-4 py-2 rounded-md bg-slate-900 text-white text-sm disabled:opacity-60"
            onClick={refetchFromStart}
            disabled={fetching}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Mobile: card list (no horizontal scroll) */}
      <div className="md:hidden space-y-3">
        {rows.map((order) => {
          const badge = statusBadge(order.status);

          return (
            <div
              key={order.id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 break-all">
                    #{order.orderNumber}
                  </div>

                  <div className="mt-1 text-xs text-slate-600 break-words">
                    {order.deliveryAddress}
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    {formatDateTime(order.orderDate)}
                  </div>
                </div>

                <span
                  className={[
                    "shrink-0 px-2 py-1 rounded-md text-xs border border-slate-200",
                    badge.className,
                  ].join(" ")}
                >
                  {badge.label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                {renderActions(order)}
              </div>
            </div>
          );
        })}

        {!fetching && rows.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No delivery orders found.
          </div>
        )}

        {fetching && rows.length === 0 && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Loading...
          </div>
        )}
      </div>

      {/* Desktop/tablet: table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-slate-500">
          <thead className="text-xs whitespace-nowrap text-slate-700 uppercase bg-slate-100">
            <tr>
              <th scope="col" className="px-6 py-3">
                Order#
              </th>
              <th scope="col" className="px-6 py-3">
                Status
              </th>
              <th scope="col" className="px-6 py-3">
                Delivery Address
              </th>
              <th scope="col" className="px-6 py-3">
                Date
              </th>
              <th scope="col" className="px-6 py-3">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((order) => {
              const badge = statusBadge(order.status);

              return (
                <tr className="bg-white border-b align-top" key={order.id}>
                  <td className="px-6 py-2 whitespace-nowrap break-all">
                    {order.orderNumber}
                  </td>

                  <td className="px-6 py-2">
                    <span
                      className={[
                        "inline-flex px-2 py-1 rounded-md text-xs border border-slate-200",
                        badge.className,
                      ].join(" ")}
                    >
                      {badge.label}
                    </span>
                  </td>

                  <td className="px-6 py-2 max-w-[360px] whitespace-normal break-words">
                    {order.deliveryAddress}
                  </td>

                  <td className="px-6 py-2 whitespace-nowrap">
                    {formatDateTime(order.orderDate)}
                  </td>

                  <td className="px-6 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderActions(order)}
                    </div>
                  </td>
                </tr>
              );
            })}

            {!fetching && rows.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-sm text-slate-600" colSpan={5}>
                  No delivery orders found.
                </td>
              </tr>
            )}

            {fetching && rows.length === 0 && (
              <tr>
                <td className="px-6 py-6 text-sm text-slate-600" colSpan={5}>
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-end gap-2">
        <button
          type="button"
          className={[
            "min-h-[44px] px-4 py-2 rounded-md text-sm w-full sm:w-auto",
            pageInfo?.hasNextPage
              ? "bg-slate-900 text-white"
              : "bg-slate-200 text-slate-600 cursor-not-allowed",
          ].join(" ")}
          onClick={loadMore}
          disabled={!pageInfo?.hasNextPage || fetching}
        >
          {fetching ? "Loading..." : pageInfo?.hasNextPage ? "Load more" : "No more"}
        </button>
      </div>
    </PanelWrapper>
  );
}

export default function DeliveriesTable() {
  return (
    <DeliveriesToastProvider>
      <DeliveriesTableInner />
    </DeliveriesToastProvider>
  );
}
