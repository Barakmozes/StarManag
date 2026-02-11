// app/(dashboard)/dashboard/deliveries/ViewDeliveryStatus.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { HiLocationMarker, HiPhone } from "react-icons/hi";
import { HiBuildingLibrary } from "react-icons/hi2";
import Modal from "@/app/components/Common/Modal";
import AppMap from "@/app/components/Common/AppMap";
import { useMutation } from "@urql/next";
import { MARK_DELIVERY_DELIVERED, REMOVE_DRIVER_FROM_ORDER } from "./deliveries.gql";
import { useDeliveriesToast } from "./DeliveriesToast";
import { formatDateTime, getGqlErrorMessage } from "./utils";
import { OrderStatus } from "@/graphql/generated";

type DeliveryInfo = {
  id: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  orderNum: string;
};

type OrderRow = {
  orderNumber: string;
  status: OrderStatus;
  deliveryAddress: string;
  userName: string;
  userPhone: string;
  orderDate: any;
  delivery?: DeliveryInfo | null;
};

type LngLat = { lng: number; lat: number };

async function geocodeAddress(
  address: string,
  token: string,
  signal?: AbortSignal
): Promise<LngLat | null> {
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json` +
    `?access_token=${encodeURIComponent(token)}&limit=1`;

  const res = await fetch(url, { signal });
  if (!res.ok) return null;

  const json = (await res.json()) as any;
  const first = json?.features?.[0];
  const center = first?.center as [number, number] | undefined; // [lng, lat]

  if (!center || typeof center[0] !== "number" || typeof center[1] !== "number") return null;

  return { lng: center[0], lat: center[1] };
}

export default function ViewDeliveryStatus({
  order,
  onDone,
}: {
  order: OrderRow;
  onDone: () => void;
}) {
  const toast = useDeliveriesToast();

  const [isOpen, setIsOpen] = useState(false);
  const closeModal = () => setIsOpen(false);

  // UI-only: responsive map sizing so it never overflows mobile modals
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({
    width: 400,
    height: 200,
  });

  useEffect(() => {
    const update = () => {
      const w = Math.min(560, Math.max(280, window.innerWidth - 48));
      const h = Math.min(320, Math.max(180, Math.round(w * 0.55)));
      setMapSize({ width: w, height: h });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [{ fetching: delivering }, markDelivered] = useMutation(MARK_DELIVERY_DELIVERED);
  const [{ fetching: unassigning }, unassign] = useMutation(REMOVE_DRIVER_FROM_ORDER);

  const driver = order.delivery;

  const canMarkDelivered = useMemo(
    () => order.status === OrderStatus.Collected,
    [order.status]
  );

  async function onMarkDelivered() {
    const res = await markDelivered({ orderNumber: order.orderNumber });
    if (res.error) {
      toast.error(getGqlErrorMessage(res.error));
      return;
    }
    toast.success("Order marked as DELIVERED");
    closeModal();
    onDone();
  }

  async function onUnassign() {
    const res = await unassign({ orderNumber: order.orderNumber });
    if (res.error) {
      toast.error(getGqlErrorMessage(res.error));
      return;
    }
    toast.info("Driver unassigned");
    closeModal();
    onDone();
  }

  /* ------------------------------ Map Geocoding ------------------------------ */

  const [coords, setCoords] = useState<LngLat | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoTick, setGeoTick] = useState(0);

  // Cache per orderNumber so reopening modal is instant
  const geoCacheRef = useRef<Map<string, LngLat>>(new Map());

  useEffect(() => {
    if (!isOpen) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const address = (order.deliveryAddress ?? "").trim();
    const cacheKey = order.orderNumber;

    if (!address) {
      setCoords(null);
      setGeoError("Missing delivery address.");
      return;
    }

    if (!token) {
      setCoords(null);
      setGeoError("Missing Mapbox token (NEXT_PUBLIC_MAPBOX_TOKEN).");
      return;
    }

    const cached = geoCacheRef.current.get(cacheKey);
    if (cached) {
      setCoords(cached);
      setGeoError(null);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    setGeoLoading(true);
    setGeoError(null);

    (async () => {
      try {
        const result = await geocodeAddress(address, token, controller.signal);
        if (cancelled) return;

        if (!result) {
          setCoords(null);
          setGeoError("Could not locate this address on the map.");
          return;
        }

        geoCacheRef.current.set(cacheKey, result);
        setCoords(result);
        setGeoError(null);
      } catch (e: any) {
        if (controller.signal.aborted) return;
        setCoords(null);
        setGeoError(e?.message || "Failed to load map location.");
      } finally {
        if (!cancelled) setGeoLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [isOpen, order.orderNumber, order.deliveryAddress, geoTick]);

  const retryGeocode = () => {
    geoCacheRef.current.delete(order.orderNumber);
    setCoords(null);
    setGeoError(null);
    setGeoTick((x) => x + 1);
  };

  /* ---------------------------------- UI ---------------------------------- */

  return (
    <>
      <button
        type="button"
        className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-full text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition"
        onClick={() => setIsOpen(true)}
      >
        View
      </button>

      <Modal isOpen={isOpen} closeModal={closeModal} title="Delivery Status">
        <div className="w-[min(100vw-2rem,48rem)] max-w-3xl mx-auto max-h-[90vh] overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <div className="p-3 sm:p-4">
            <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
              {geoLoading ? (
                <div
                  className="animate-pulse bg-slate-200"
                  style={{ width: mapSize.width, height: mapSize.height }}
                  aria-hidden="true"
                />
              ) : coords ? (
                <AppMap
                  latitude={coords.lat}
                  longitude={coords.lng}
                  width={mapSize.width}
                  height={mapSize.height}
                />
              ) : (
                <div
                  className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                  style={{ width: mapSize.width, minHeight: mapSize.height }}
                >
                  <span className="min-w-0 break-words">
                    {geoError ?? "Map is unavailable."}
                  </span>
                  <button
                    type="button"
                    onClick={retryGeocode}
                    className="shrink-0 h-9 rounded bg-white border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4">
              <h3 className="text-sm sm:text-base font-semibold text-slate-800">
                Delivery Details
              </h3>

              <ol className="relative mt-3 border-l border-slate-200">
                <li className="mb-8 ml-6">
                  <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3">
                    <HiLocationMarker aria-hidden="true" />
                  </div>

                  <h5 className="text-sm font-semibold text-slate-800">Order</h5>
                  <p className="mt-1 text-sm font-normal leading-none text-slate-600 break-words">
                    #{order.orderNumber} • {formatDateTime(order.orderDate)}
                  </p>
                </li>

                <li className="mb-8 ml-6">
                  <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3">
                    <span className="w-4 h-4 bg-blue-500 rounded-full animate-ping"></span>
                  </div>

                  <h5 className="text-sm font-semibold text-slate-800">Driver</h5>

                  {driver ? (
                    <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-blue-100 p-3 rounded-md">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-800 break-words">
                          {driver.driverName}
                        </div>
                        <div className="text-xs text-slate-700 break-all">
                          {driver.driverEmail}
                        </div>
                        <a
                          href={`tel:${driver.driverPhone}`}
                          className="text-xs underline break-all"
                        >
                          {driver.driverPhone}
                        </a>
                      </div>

                      <a
                        href={`tel:${driver.driverPhone}`}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white cursor-pointer shadow-sm hover:bg-slate-50 transition self-start sm:self-auto"
                        aria-label="Call driver"
                      >
                        <HiPhone size={22} aria-hidden="true" />
                      </a>
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-slate-600">
                      No driver assigned (data mismatch).
                    </p>
                  )}
                </li>

                <li className="mb-8 ml-6">
                  <div className="absolute flex items-center justify-center w-6 h-6 bg-red-100 text-red-900 rounded-full -left-3">
                    <HiBuildingLibrary aria-hidden="true" />
                  </div>

                  <h5 className="text-sm font-semibold text-red-950">
                    Delivering To
                  </h5>

                  <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-red-100 text-red-950 p-3 rounded-md">
                    <div className="min-w-0 flex flex-col gap-1">
                      <span className="text-sm font-medium break-words">
                        {order.userName}
                      </span>
                      <a
                        href={`tel:${order.userPhone}`}
                        className="text-xs underline break-all"
                      >
                        {order.userPhone}
                      </a>
                      <p className="text-xs break-words">{order.deliveryAddress}</p>
                    </div>

                    <a
                      href={`tel:${order.userPhone}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-white cursor-pointer shadow-sm hover:bg-slate-50 transition self-start sm:self-auto"
                      aria-label="Call customer"
                    >
                      <HiPhone size={22} aria-hidden="true" />
                    </a>
                  </div>
                </li>
              </ol>

              <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <button
                  type="button"
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-md bg-slate-200 text-slate-800 hover:bg-slate-300 transition disabled:opacity-60"
                  onClick={closeModal}
                  disabled={delivering || unassigning}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-md bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-60"
                  onClick={onUnassign}
                  disabled={delivering || unassigning}
                  title="Remove assigned driver and return to UNASSIGNED"
                >
                  {unassigning ? "Unassigning..." : "Unassign"}
                </button>

                <button
                  type="button"
                  className={[
                    "w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-md text-white transition disabled:opacity-60",
                    canMarkDelivered
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-green-200 cursor-not-allowed",
                  ].join(" ")}
                  onClick={onMarkDelivered}
                  disabled={!canMarkDelivered || delivering || unassigning}
                >
                  {delivering ? "Saving..." : "Mark Delivered"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
