"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@urql/next";
import toast from "react-hot-toast";
import { Disclosure } from "@headlessui/react";
import { HiChevronDown, HiClock, HiMapPin, HiStar } from "react-icons/hi2";
import { gql } from "graphql-tag";

import Modal from "../Common/Modal";
import type { Restaurant } from "@/graphql/generated";

/* ------------------------------- GraphQL doc ------------------------------ */
/**
 * Self-contained query so this component works immediately
 * (even if you haven't added restaurant.graphql to codegen yet).
 *
 * If you DO have codegen docs for restaurants, feel free to swap this
 * for the generated GetRestaurantsDocument.
 */
const GetRestaurantsForDetailsModalDocument = gql`
  query GetRestaurantsForDetailsModal {
    getRestaurants {
      id
      name
      address
      bannerImg
      rating
      deliveryFee
      serviceFee
      openTimes
    }
  }
`;

type GetRestaurantsForDetailsModalQuery = {
  getRestaurants: Restaurant[];
};

/* ------------------------------ open times utils ------------------------------ */

const DAYS: Array<
  "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"
> = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type NormalizedOpenDay = {
  day: (typeof DAYS)[number];
  open: string | null;  // "09:00"
  close: string | null; // "22:00"
  closed: boolean;
  display: string; // "09:00 - 22:00" OR "Closed"
};

function canonicalDayName(raw: unknown): (typeof DAYS)[number] | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();

  // English (full + short)
  const map: Record<string, (typeof DAYS)[number]> = {
    sun: "Sunday",
    sunday: "Sunday",
    mon: "Monday",
    monday: "Monday",
    tue: "Tuesday",
    tues: "Tuesday",
    tuesday: "Tuesday",
    wed: "Wednesday",
    wednesday: "Wednesday",
    thu: "Thursday",
    thur: "Thursday",
    thurs: "Thursday",
    thursday: "Thursday",
    fri: "Friday",
    friday: "Friday",
    sat: "Saturday",
    saturday: "Saturday",

    // Common Hebrew day strings (best-effort)
    "יום ראשון": "Sunday",
    ראשון: "Sunday",
    "יום שני": "Monday",
    שני: "Monday",
    "יום שלישי": "Tuesday",
    שלישי: "Tuesday",
    "יום רביעי": "Wednesday",
    רביעי: "Wednesday",
    "יום חמישי": "Thursday",
    חמישי: "Thursday",
    "יום שישי": "Friday",
    שישי: "Friday",
    "יום שבת": "Saturday",
    שבת: "Saturday",
  };

  return map[v] ?? null;
}

function tryParseJson(value: unknown) {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function timeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const m = value.match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

function normalizeOpenTimes(raw: unknown): NormalizedOpenDay[] {
  const parsed = tryParseJson(raw);

  const arr: any[] = Array.isArray(parsed) ? parsed : [];

  const byDay = new Map<(typeof DAYS)[number], any>();
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    const dayKey = canonicalDayName((item as any).day);
    if (!dayKey) continue;
    byDay.set(dayKey, item);
  }

  // Safe defaults (so UI stays consistent even if DB data is incomplete)
  const defaults: Record<(typeof DAYS)[number], { open: string; close: string }> = {
    Sunday: { open: "09:00", close: "22:00" },
    Monday: { open: "09:00", close: "22:00" },
    Tuesday: { open: "09:00", close: "22:00" },
    Wednesday: { open: "09:00", close: "22:00" },
    Thursday: { open: "09:00", close: "22:00" },
    Friday: { open: "09:00", close: "23:00" },
    Saturday: { open: "09:00", close: "23:00" },
  };

  return DAYS.map((day) => {
    const item = byDay.get(day);

    const closed = Boolean(item?.closed);
    const open = typeof item?.open === "string" ? item.open : defaults[day].open;
    const close = typeof item?.close === "string" ? item.close : defaults[day].close;

    // Some older data patterns might include a pre-formatted "times" string.
    const timesString =
      typeof item?.times === "string" && item.times.trim() ? item.times.trim() : null;

    const display = closed
      ? "Closed"
      : timesString
        ? timesString
        : `${open} - ${close}`;

    return {
      day,
      open: closed ? null : open,
      close: closed ? null : close,
      closed,
      display,
    };
  });
}

function computeOpenNow(now: Date, day: NormalizedOpenDay): boolean | null {
  if (day.closed) return false;

  const openMin = timeToMinutes(day.open);
  const closeMin = timeToMinutes(day.close);
  if (openMin === null || closeMin === null) return null;

  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Overnight support (e.g. 18:00 - 02:00)
  if (closeMin <= openMin) {
    return nowMin >= openMin || nowMin < closeMin;
  }
  return nowMin >= openMin && nowMin < closeMin;
}

/* ------------------------------ URL helpers ------------------------------ */

const MODAL_PARAM = "restaurantDetails";
const RESTAURANT_ID_PARAM = "restaurantId";

/* ---------------------------------- props ---------------------------------- */

type RestaurantDetailsModalProps = {
  /**
   * Optional: If you have a specific restaurant page/section, pass its id.
   * Otherwise the first restaurant returned by getRestaurants is used.
   */
  restaurantId?: string;

  /** Button label (defaults to "More Info") */
  triggerText?: string;

  /** Button className (defaults to your existing underline style) */
  triggerClassName?: string;

  /** If you want to render the modal without a trigger button */
  hideTrigger?: boolean;
};

const RestaurantDetailsModal = ({
  restaurantId,
  triggerText = "More Info",
  triggerClassName = "underline text-lg text-green-700 cursor-pointer font-semibold",
  hideTrigger = false,
}: RestaurantDetailsModalProps) => {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  // URL state (deep-link)
  const urlWantsOpen =
    searchParams.get(MODAL_PARAM) === "1" || searchParams.get(MODAL_PARAM) === "true";

  const paramsString = searchParams.toString();

  const updateUrlParams = useCallback(
    (updates: Record<string, string | null | undefined>) => {
      const params = new URLSearchParams(paramsString);

      Object.entries(updates).forEach(([key, val]) => {
        const v = (val ?? "").trim();
        if (!v) params.delete(key);
        else params.set(key, v);
      });

      const nextQs = params.toString();
      const nextUrl = nextQs ? `${pathname}?${nextQs}` : pathname;
      router.replace(nextUrl, { scroll: false });
    },
    [paramsString, pathname, router]
  );

  // Modal open state is derived from URL (source of truth)
  const [isOpen, setIsOpen] = useState<boolean>(urlWantsOpen);

  useEffect(() => {
    setIsOpen(urlWantsOpen);
  }, [urlWantsOpen]);

  // Live data from DB
  const [{ data, fetching, error }, reexecuteQuery] =
    useQuery<GetRestaurantsForDetailsModalQuery>({
      query: GetRestaurantsForDetailsModalDocument,
      requestPolicy: "cache-and-network",
    });

  // Avoid repeating toast error on every render
  const lastErrorRef = useRef<string | null>(null);
  useEffect(() => {
    if (!error?.message) return;
    if (lastErrorRef.current === error.message) return;
    lastErrorRef.current = error.message;
    toast.error("Failed to load restaurant details", { duration: 2500 });
  }, [error?.message]);

  const restaurants = data?.getRestaurants ?? [];

  const selectedId =
    searchParams.get(RESTAURANT_ID_PARAM) ?? restaurantId ?? (restaurants[0]?.id ?? null);

  const restaurant = useMemo(() => {
    if (!restaurants.length) return null;
    if (!selectedId) return restaurants[0];
    return restaurants.find((r) => r.id === selectedId) ?? restaurants[0];
  }, [restaurants, selectedId]);

  const openTimes = useMemo(() => {
    return normalizeOpenTimes(restaurant?.openTimes);
  }, [restaurant?.openTimes]);

  // Update time every minute while modal is open (so "Open now" stays correct)
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    if (!isOpen) return;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, [isOpen]);

  const todayName = DAYS[now.getDay()];
  const today = openTimes.find((d) => d.day === todayName) ?? null;

  const openNow = useMemo(() => {
    if (!today) return null;
    return computeOpenNow(now, today);
  }, [now, today]);

  const mapsUrl = useMemo(() => {
    const addr = restaurant?.address?.trim();
    if (!addr) return null;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }, [restaurant?.address]);

  const openModal = () => {
    // Ensure latest data when opening
    reexecuteQuery({ requestPolicy: "network-only" });

    setIsOpen(true);
    updateUrlParams({
      [MODAL_PARAM]: "1",
      ...(selectedId ? { [RESTAURANT_ID_PARAM]: selectedId } : {}),
    });
  };

  const closeModal = () => {
    setIsOpen(false);
    updateUrlParams({
      [MODAL_PARAM]: null,
      // Keep restaurantId param (optional) — you can also remove it if you prefer a cleaner URL:
      // [RESTAURANT_ID_PARAM]: null,
    });
  };

  const copyAddress = async () => {
    const addr = restaurant?.address?.trim();
    if (!addr) {
      toast.error("No address found", { duration: 1500 });
      return;
    }

    try {
      await navigator.clipboard.writeText(addr);
      toast.success("Address copied", { duration: 1200 });
    } catch {
      // Fallback
      try {
        const el = document.createElement("textarea");
        el.value = addr;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        el.remove();
        toast.success("Address copied", { duration: 1200 });
      } catch {
        toast.error("Could not copy address", { duration: 1500 });
      }
    }
  };

  const refreshInfo = () => {
    reexecuteQuery({ requestPolicy: "network-only" });
    router.refresh();
    toast.success("Restaurant info refreshed", { duration: 1200 });
  };

  return (
    <>
      {!hideTrigger && (
        <button className={triggerClassName} onClick={openModal} type="button">
          {triggerText}
        </button>
      )}

      <Modal isOpen={isOpen} closeModal={closeModal} title={restaurant?.name ?? "Restaurant"}>
        {/* Loading / error / empty states */}
        {fetching && (
          <div className="py-4 text-sm text-gray-500">Loading restaurant details…</div>
        )}

        {!fetching && error && (
          <div className="py-4 text-sm text-red-600">
            Could not load restaurant details. Please try again.
            <div className="mt-3">
              <button
                type="button"
                onClick={refreshInfo}
                className="px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        )}

        {!fetching && !error && !restaurant && (
          <div className="py-4 text-sm text-gray-600">
            Restaurant details are not available yet.
          </div>
        )}

        {!fetching && !error && restaurant && (
          <div className="flex flex-col space-y-5">
            {/* Banner */}
            <div className="relative w-full h-40 rounded-lg overflow-hidden bg-slate-100">
              <Image
                src={restaurant.bannerImg || "/banner.jpg"}
                alt={restaurant.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
                priority={false}
              />
            </div>

            {/* If multiple restaurants exist: allow switching */}
            {restaurants.length > 1 && (
              <div className="space-y-1">
                <label className="text-sm text-gray-600">Select restaurant</label>
                <select
                  value={restaurant.id}
                  onChange={(e) => {
                    updateUrlParams({ [RESTAURANT_ID_PARAM]: e.target.value });
                    // Fetch fresh data (best practice)
                    reexecuteQuery({ requestPolicy: "network-only" });
                  }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white"
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Name */}
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
                {restaurant.name}
              </h1>

              {/* Open/Closed badge */}
              {today && (
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-md text-xs font-medium ${
                      openNow === true
                        ? "bg-green-100 text-green-700"
                        : openNow === false
                          ? "bg-red-100 text-red-700"
                          : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {openNow === true ? "Open now" : openNow === false ? "Closed" : "Hours unknown"}
                  </span>

                  <span className="text-xs text-gray-500">
                    Today ({todayName}): {today.display}
                  </span>
                </div>
              )}
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <HiMapPin className="shrink-0 mt-0.5" size={24} />
              <div className="flex-1">
                <p className="text-gray-800">
                  {restaurant.address ? restaurant.address : "No address set"}
                </p>

                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="text-sm text-green-700 underline underline-offset-2"
                    disabled={!restaurant.address}
                  >
                    Copy address
                  </button>

                  {mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-green-700 underline underline-offset-2"
                    >
                      Open in Maps
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Opening Times */}
            <Disclosure as="div" className="mt-2">
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full items-center justify-between focus:outline-none">
                    <div className="flex items-center">
                      <HiClock className="shrink-0 mr-2" size={24} />
                      <p className="text-gray-900 font-medium">Opening Times</p>
                    </div>

                    <HiChevronDown
                      className={`${open ? "rotate-180 transform" : ""} h-5 w-5`}
                    />
                  </Disclosure.Button>

                  <Disclosure.Panel className="px-2 pt-3 pb-2">
                    <div className="space-y-2">
                      {openTimes.map((d) => (
                        <div
                          className="flex items-center justify-between text-sm"
                          key={d.day}
                        >
                          <p className="shrink-0 text-gray-700">{d.day}</p>
                          <p className={`${d.closed ? "text-red-600" : "text-gray-600"}`}>
                            {d.display}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

            {/* Rating + Fees */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center">
                <HiStar className="shrink-0 mr-2" size={24} />
                <p className="text-gray-800">
                  {Number.isFinite(restaurant.rating)
                    ? `${restaurant.rating.toFixed(1)} rating`
                    : "No rating"}
                </p>
              </div>

              <div className="text-sm text-gray-700 flex flex-col gap-1">
                <p>
                  Delivery fee:{" "}
                  <span className="font-semibold text-gray-900">
                    ${restaurant.deliveryFee?.toFixed?.(2) ?? restaurant.deliveryFee}
                  </span>
                </p>
                <p>
                  Service fee:{" "}
                  <span className="font-semibold text-gray-900">
                    ${restaurant.serviceFee?.toFixed?.(2) ?? restaurant.serviceFee}
                  </span>
                </p>
              </div>
            </div>

            {/* Footer actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={refreshInfo}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-sm text-gray-800"
              >
                Refresh
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-sm text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default RestaurantDetailsModal;
