"use client";

import { useEffect, useRef, useState } from "react";
import { HiBuildingLibrary } from "react-icons/hi2";
import Image from "next/image";

import { GiScooter } from "react-icons/gi";
import { FaChevronRight } from "react-icons/fa";

import { HiLocationMarker } from "react-icons/hi";
import { UserOrderCollected, UserOrderPreparing } from "./ViewUserOrderStatus";
import Modal from "@/app/components/Common/Modal";
import AppMap from "@/app/components/Common/AppMap";
import { Order } from "@prisma/client";

type Props = {
  order: Order;
};

type LngLat = { lng: number; lat: number };

async function geocodeAddress(address: string, token: string, signal?: AbortSignal): Promise<LngLat | null> {
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

const UserOnDeliveryModal = ({ order }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  // UI-only: keep the map from overflowing small screens
  const [mapSize, setMapSize] = useState<{ width: number; height: number }>({
    width: 400,
    height: 200,
  });

  // Map coords
  const [coords, setCoords] = useState<LngLat | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoTick, setGeoTick] = useState(0);

  // Cache per orderNumber so reopening modal is instant
  const geoCacheRef = useRef<Map<string, LngLat>>(new Map());

  useEffect(() => {
    const update = () => {
      const w = Math.min(520, Math.max(280, window.innerWidth - 48));
      const h = Math.min(280, Math.max(180, Math.round(w * 0.55)));
      setMapSize({ width: w, height: h });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  // Geocode when modal opens (and only if needed)
  useEffect(() => {
    if (!isOpen) return;

    // If delivered you already hide the map, but keep it safe
    if (order.status === "DELIVERED") return;

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
  }, [isOpen, order.orderNumber, order.deliveryAddress, order.status, geoTick]);

  const retryGeocode = () => {
    geoCacheRef.current.delete(order.orderNumber);
    setCoords(null);
    setGeoError(null);
    setGeoTick((x) => x + 1);
  };

  return (
    <>
      <button
        type="button"
        className="w-full min-h-[44px] flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100 transition"
        onClick={openModal}
        aria-label={`View delivery status for order ${order.orderNumber}`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <GiScooter className="animate-bounce shrink-0" size={24} />
          <span className="text-sm sm:text-base font-medium truncate">Order on the way</span>
        </span>

        <FaChevronRight className="shrink-0" aria-hidden="true" />
      </button>

      <Modal isOpen={isOpen} title={`Order: ${order.orderNumber}`} closeModal={closeModal}>
        <div className="w-[min(100vw-2rem,42rem)] max-w-2xl mx-auto max-h-[90vh] overflow-y-auto overscroll-contain pb-6">
          {order.status !== "DELIVERED" && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white overflow-hidden">
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
          )}

          <div className="mt-4">
            <h3 className="px-1 sm:px-0 text-sm sm:text-base font-semibold text-slate-800">
              Delivery Details
            </h3>

            <ol className="relative mt-3 border-l border-slate-200 pl-2 sm:pl-3">
              <li className="mb-8 ml-6">
                <div className="absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3">
                  <HiLocationMarker aria-hidden="true" />
                </div>

                <h5 className="text-sm font-semibold text-slate-800">barak rst</h5>
                <p className="mt-1 text-sm font-normal text-slate-600 break-words">
                  {order.deliveryAddress}
                </p>
              </li>

              {order.status === "PREPARING" || order.status === "UNASSIGNED" ? (
                <UserOrderPreparing />
              ) : (
                <UserOrderCollected />
              )}

              <li className="mb-8 ml-6">
                <div className="absolute flex items-center justify-center w-6 h-6 bg-red-100 text-red-900 rounded-full -left-3">
                  <HiBuildingLibrary aria-hidden="true" />
                </div>

                <h5 className="text-sm font-semibold text-red-950">Delivering To:</h5>

                <div className="mt-2 rounded-md bg-red-100 text-red-950 p-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Image
                      src="/img/humans/h1.jpg"
                      className="rounded-full shrink-0"
                      alt="customer"
                      width={36}
                      height={36}
                    />

                    <div className="min-w-0 space-y-1">
                      <h6 className="text-sm font-semibold break-words">{order?.userName}</h6>
                      <p className="text-sm font-normal text-red-900/80 break-words">
                        {order.deliveryAddress}
                      </p>
                    </div>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default UserOnDeliveryModal;
