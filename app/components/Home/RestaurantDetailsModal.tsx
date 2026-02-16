"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@urql/next";
import toast from "react-hot-toast";
import { Disclosure, Tab } from "@headlessui/react";
import {
  HiChevronDown,
  HiClock,
  HiMapPin,
  HiStar,
  HiPhone,
  HiGlobeAlt,
  HiAdjustmentsHorizontal,
} from "react-icons/hi2";
import { FaGoogle, FaWaze, FaRoute } from "react-icons/fa";
import { gql } from "graphql-tag";

import Modal from "../Common/Modal";
import type { Restaurant } from "@/graphql/generated";

/* ------------------------------- GraphQL ------------------------------ */
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

/* ------------------------------ Google Types ------------------------------ */

type GoogleReview = {
  rating?: number;
  relativePublishTimeDescription?: string;
  publishTime?: string; // ISO (if returned)
  text?: { text?: string; languageCode?: string };
  authorAttribution?: { displayName?: string; photoUri?: string };
};

type GoogleData = {
  rating: number | null;
  userRatingCount: number | null;
  reviews: GoogleReview[];
  url: string | null;

  // optional
  websiteUri?: string | null;
  formattedPhoneNumber?: string | null;
};

/* ------------------------------ Small utils ------------------------------ */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function money(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "-";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/* ------------------------------ Open times utils ------------------------------ */

const DAYS: Array<
  "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday"
> = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type NormalizedOpenDay = {
  day: (typeof DAYS)[number];
  open: string | null;
  close: string | null;
  closed: boolean;
  display: string;
};

function canonicalDayName(raw: unknown): (typeof DAYS)[number] | null {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();

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

    // Hebrew best-effort
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

    const timesString =
      typeof item?.times === "string" && item.times.trim() ? item.times.trim() : null;

    const display = closed ? "Closed" : timesString ? timesString : `${open} - ${close}`;

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

  // Overnight support
  if (closeMin <= openMin) return nowMin >= openMin || nowMin < closeMin;

  return nowMin >= openMin && nowMin < closeMin;
}

/* ------------------------------ Stars ------------------------------ */

function StarRow({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const rounded = Math.max(0, Math.min(5, Math.round(rating)));
  const iconSize = size === "lg" ? "h-6 w-6" : size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <HiStar
          key={i}
          className={cn(iconSize, i < rounded ? "text-yellow-400" : "text-slate-200")}
        />
      ))}
    </div>
  );
}

/* ------------------------------ URL helpers ------------------------------ */

const MODAL_PARAM = "restaurantDetails";
const RESTAURANT_ID_PARAM = "restaurantId";

function buildUrl(pathname: string, current: URLSearchParams, updates: Record<string, string | null | undefined>) {
  const params = new URLSearchParams(current.toString());

  Object.entries(updates).forEach(([k, v]) => {
    const value = (v ?? "").trim();
    if (!value) params.delete(k);
    else params.set(k, value);
  });

  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/* ------------------------------ Props ------------------------------ */

type RestaurantDetailsModalProps = {
  restaurantId?: string;
  triggerText?: string;
  triggerClassName?: string;
  hideTrigger?: boolean;

  // Optional CTA hook (so we don't hardcode routes)
  onCtaClick?: (restaurant: Restaurant) => void;
  ctaTextOpen?: string;
  ctaTextClosed?: string;
};

export default function RestaurantDetailsModal({
  restaurantId,
  triggerText = "More Info",
  triggerClassName = "text-green-700 font-semibold underline underline-offset-2",
  hideTrigger = false,
  onCtaClick,
  ctaTextOpen = "Order Now",
  ctaTextClosed = "Pre-Order for Later",
}: RestaurantDetailsModalProps) {
  const router = useRouter();
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();

  const isOpen = searchParams.get(MODAL_PARAM) === "1" || searchParams.get(MODAL_PARAM) === "true";

  const selectedId =
    searchParams.get(RESTAURANT_ID_PARAM) ?? restaurantId ?? null;

  const openModal = useCallback(() => {
    const nextUrl = buildUrl(
      pathname,
      new URLSearchParams(searchParams.toString()),
      {
        [MODAL_PARAM]: "1",
        ...(restaurantId ? { [RESTAURANT_ID_PARAM]: restaurantId } : {}),
      }
    );
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams, restaurantId]);

  const closeModal = useCallback(() => {
    const nextUrl = buildUrl(
      pathname,
      new URLSearchParams(searchParams.toString()),
      {
        [MODAL_PARAM]: null,
      }
    );
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  /* ------------------------------ Data ------------------------------ */

  const [{ data, fetching, error }, reexecuteQuery] = useQuery<GetRestaurantsForDetailsModalQuery>({
    query: GetRestaurantsForDetailsModalDocument,
    pause: !isOpen, // ✅ don't fetch until modal opens
    requestPolicy: "cache-and-network",
  });

  const restaurants = useMemo(() => data?.getRestaurants ?? [], [data?.getRestaurants]);

  const restaurant = useMemo(() => {
    if (!restaurants.length) return null;
    if (!selectedId) return restaurants[0];
    return restaurants.find((r) => r.id === selectedId) ?? restaurants[0];
  }, [restaurants, selectedId]);

  // Avoid error toast spam
  const lastErrRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    if (!error?.message) return;
    if (lastErrRef.current === error.message) return;
    lastErrRef.current = error.message;
    toast.error("Failed to load restaurant details", { duration: 2000 });
  }, [isOpen, error?.message]);

  /* ------------------------------ Open now ------------------------------ */

  const openTimes = useMemo(() => normalizeOpenTimes(restaurant?.openTimes), [restaurant?.openTimes]);

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

  /* ------------------------------ Maps / Waze / Copy ------------------------------ */

  const mapsUrl = useMemo(() => {
    const addr = restaurant?.address?.trim();
    if (!addr) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`;
  }, [restaurant?.address]);

  const wazeUrl = useMemo(() => {
    const name = restaurant?.name?.trim();
    const addr = restaurant?.address?.trim();
    const q = [name, addr].filter(Boolean).join(" ");
    if (!q) return null;
    return `https://waze.com/ul?q=${encodeURIComponent(q)}&navigate=yes`;
  }, [restaurant?.name, restaurant?.address]);

  const openWaze = useCallback(() => {
    if (!wazeUrl) return;
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) window.location.href = wazeUrl;
    else window.open(wazeUrl, "_blank", "noopener,noreferrer");
  }, [wazeUrl]);

  const copyAddress = useCallback(async () => {
    const addr = restaurant?.address?.trim();
    if (!addr) return toast.error("No address found", { duration: 1200 });

    try {
      await navigator.clipboard.writeText(addr);
      toast.success("Address copied", { duration: 1200 });
    } catch {
      toast.error("Could not copy address", { duration: 1200 });
    }
  }, [restaurant?.address]);

  const refreshInfo = useCallback(() => {
    reexecuteQuery({ requestPolicy: "network-only" });
    router.refresh();
    toast.success("Refreshed", { duration: 1000 });
  }, [reexecuteQuery, router]);

  /* ------------------------------ Google Reviews ------------------------------ */

  const [googleData, setGoogleData] = useState<GoogleData | null>(null);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [sortMethod, setSortMethod] = useState<"newest" | "highest" | "lowest">("newest");

  useEffect(() => {
    if (!isOpen || !restaurant?.name) return;

    const controller = new AbortController();

    const run = async () => {
      setLoadingGoogle(true);
      setGoogleError(null);

      try {
        const q = `${restaurant.name} ${restaurant.address || ""}`.trim();
        const res = await fetch(`/api/google-reviews?query=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(text || `Google reviews failed (${res.status})`);
        }

        const json = (await res.json()) as GoogleData;

        setGoogleData({
          rating: typeof json.rating === "number" ? json.rating : null,
          userRatingCount: typeof json.userRatingCount === "number" ? json.userRatingCount : null,
          reviews: Array.isArray(json.reviews) ? json.reviews : [],
          url: typeof json.url === "string" ? json.url : null,
          websiteUri: typeof json.websiteUri === "string" ? json.websiteUri : null,
          formattedPhoneNumber:
            typeof json.formattedPhoneNumber === "string" ? json.formattedPhoneNumber : null,
        });
      } catch (e: any) {
        if (controller.signal.aborted) return;
        setGoogleData(null);
        setGoogleError(e?.message || "Failed to load Google reviews");
      } finally {
        if (!controller.signal.aborted) setLoadingGoogle(false);
      }
    };

    run();
    return () => controller.abort();
  }, [isOpen, restaurant?.name, restaurant?.address]);

  const sortedReviews = useMemo(() => {
    const reviews = googleData?.reviews ? [...googleData.reviews] : [];

    const byPublishTime = (a: GoogleReview, b: GoogleReview) => {
      const ta = a.publishTime ? new Date(a.publishTime).getTime() : 0;
      const tb = b.publishTime ? new Date(b.publishTime).getTime() : 0;
      return tb - ta;
    };

    if (sortMethod === "highest") {
      return reviews.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    if (sortMethod === "lowest") {
      return reviews.sort((a, b) => (a.rating ?? 0) - (b.rating ?? 0));
    }
    // newest
    return reviews.sort(byPublishTime);
  }, [googleData?.reviews, sortMethod]);

  /* ------------------------------ JSON-LD ------------------------------ */
  const jsonLd = useMemo(() => {
    if (!restaurant) return null;

    const aggregate =
      typeof googleData?.rating === "number" && typeof googleData?.userRatingCount === "number"
        ? {
            "@type": "AggregateRating",
            ratingValue: googleData.rating,
            reviewCount: googleData.userRatingCount,
          }
        : undefined;

    // Note: JSON-LD inside a modal isn't a strong SEO signal, but it's harmless
    return {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: restaurant.name,
      image: restaurant.bannerImg || undefined,
      address: restaurant.address || undefined,
      aggregateRating: aggregate,
      openingHoursSpecification: openTimes
        .filter((d) => !d.closed && d.open && d.close)
        .map((d) => ({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: d.day,
          opens: d.open,
          closes: d.close,
        })),
    };
  }, [restaurant, googleData?.rating, googleData?.userRatingCount, openTimes]);

  /* ------------------------------ Trigger only ------------------------------ */
  if (!isOpen) {
    return !hideTrigger ? (
      <button onClick={openModal} type="button" className={triggerClassName}>
        {triggerText}
      </button>
    ) : null;
  }

  return (
    <Modal isOpen={isOpen} closeModal={closeModal} title={restaurant?.name || "Restaurant"}>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}

      <div className="flex flex-col h-full max-h-[85vh]">
        {!restaurant ? (
          <div className="p-8 text-center text-gray-500">
            {fetching ? "Loading details..." : "Restaurant not found"}
          </div>
        ) : (
          <>
            {/* Header image */}
            <div className="relative h-48 w-full shrink-0 rounded-xl overflow-hidden bg-slate-100">
              <Image
                src={restaurant.bannerImg || "/placeholder-food.jpg"}
                alt={restaurant.name || "Restaurant"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 700px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold truncate">{restaurant.name}</h2>
                    <p className="text-sm opacity-90 flex items-start gap-1 line-clamp-2">
                      <HiMapPin className="mt-0.5 shrink-0" /> {restaurant.address || "No address set"}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold shrink-0",
                      openNow === true
                        ? "bg-green-500 text-white"
                        : openNow === false
                          ? "bg-red-500 text-white"
                          : "bg-slate-200 text-slate-800"
                    )}
                  >
                    {openNow === true ? "OPEN NOW" : openNow === false ? "CLOSED" : "HOURS?"}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tab.Group>
              <Tab.List className="mt-3 flex gap-1 rounded-xl bg-slate-100 p-1">
                {["Info & Hours", "Reviews", "Map"].map((label) => (
                  <Tab
                    key={label}
                    className={({ selected }) =>
                      cn(
                        "w-full rounded-lg py-2.5 text-sm font-semibold leading-5",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500",
                        selected ? "bg-white text-green-700 shadow-sm" : "text-slate-600 hover:bg-white/60"
                      )
                    }
                  >
                    {label}
                  </Tab>
                ))}
              </Tab.List>

              <Tab.Panels className="mt-3 flex-1 overflow-y-auto rounded-xl bg-slate-50 p-4">
                {/* INFO TAB */}
                <Tab.Panel className="space-y-4 focus:outline-none">
                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={openWaze}
                      disabled={!wazeUrl}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border font-semibold py-3 transition",
                        wazeUrl
                          ? "bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100"
                          : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      )}
                    >
                      <FaWaze className="text-xl" /> Waze
                    </button>

                    <a
                      href={mapsUrl || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-xl border font-semibold py-3 transition",
                        mapsUrl
                          ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                          : "bg-slate-100 text-slate-400 border-slate-200 pointer-events-none"
                      )}
                    >
                      <FaRoute className="text-xl" /> Maps
                    </a>
                  </div>

                  {/* Optional contact (from Google) */}
                  {(googleData?.formattedPhoneNumber || googleData?.websiteUri) && (
                    <div className="grid grid-cols-2 gap-3">
                      {googleData.formattedPhoneNumber ? (
                        <a
                          href={`tel:${googleData.formattedPhoneNumber}`}
                          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <HiPhone className="text-lg text-green-700" />
                          Call
                        </a>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-100 py-3 text-center text-slate-400 font-semibold">
                          Call
                        </div>
                      )}

                      {googleData.websiteUri ? (
                        <a
                          href={googleData.websiteUri}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
                        >
                          <HiGlobeAlt className="text-lg text-green-700" />
                          Website
                        </a>
                      ) : (
                        <div className="rounded-xl border border-slate-200 bg-slate-100 py-3 text-center text-slate-400 font-semibold">
                          Website
                        </div>
                      )}
                    </div>
                  )}

                  {/* Copy address */}
                  <button
                    type="button"
                    onClick={copyAddress}
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50 transition"
                    disabled={!restaurant.address}
                  >
                    Copy Address
                  </button>

                  {/* Fees */}
                  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="font-semibold text-gray-900 mb-2">Fees</h3>
                    <div className="flex justify-between text-sm py-1 border-b border-slate-50">
                      <span className="text-slate-500">Delivery</span>
                      <span className="font-semibold text-slate-900">
                        {money(restaurant.deliveryFee)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm py-1 pt-2">
                      <span className="text-slate-500">Service</span>
                      <span className="font-semibold text-slate-900">
                        {money(restaurant.serviceFee)}
                      </span>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                    <Disclosure>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full justify-between bg-white px-4 py-3 text-left text-sm font-semibold hover:bg-slate-50">
                            <span className="flex items-center gap-2 text-gray-900">
                              <HiClock className="text-lg text-green-600" /> Full Opening Hours
                            </span>
                            <HiChevronDown
                              className={cn(
                                "h-5 w-5 text-gray-500 transition-transform",
                                open && "rotate-180"
                              )}
                            />
                          </Disclosure.Button>

                          <Disclosure.Panel className="px-4 pb-4 pt-1 text-sm text-gray-600 bg-slate-50/50">
                            <div className="space-y-1.5">
                              {openTimes.map((day) => (
                                <div
                                  key={day.day}
                                  className="flex justify-between border-b border-dashed border-slate-200 last:border-0 pb-1"
                                >
                                  <span
                                    className={cn(
                                      day.day === todayName && "font-bold text-green-700"
                                    )}
                                  >
                                    {day.day}
                                  </span>
                                  <span className={cn(day.closed && "text-red-500")}>
                                    {day.display}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  </div>
                </Tab.Panel>

                {/* REVIEWS TAB */}
                <Tab.Panel className="focus:outline-none">
                  {loadingGoogle ? (
                    <div className="space-y-3 animate-pulse">
                      <div className="h-20 bg-slate-200 rounded-xl" />
                      <div className="h-10 bg-slate-200 rounded-xl w-1/3" />
                      <div className="h-24 bg-slate-200 rounded-xl" />
                    </div>
                  ) : googleError ? (
                    <div className="text-center py-10 text-slate-500">
                      Reviews unavailable
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={refreshInfo}
                          className="min-h-11 px-4 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 font-semibold"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                  ) : !googleData ? (
                    <div className="text-center py-10 text-slate-500">Reviews unavailable</div>
                  ) : (
                    <>
                      {/* Summary */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-4 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-3xl font-bold text-gray-900">
                            {typeof googleData.rating === "number" ? googleData.rating.toFixed(1) : "-"}
                          </span>
                          <StarRow rating={googleData.rating ?? 0} size="md" />
                          <span className="text-xs text-slate-500 mt-1">
                            {typeof googleData.userRatingCount === "number"
                              ? `${googleData.userRatingCount} verified reviews`
                              : "Verified reviews"}
                          </span>
                        </div>

                        <div className="h-10 w-px bg-slate-200 mx-4" />

                        <div className="flex items-center justify-center">
                          <FaGoogle className="text-3xl text-slate-300" />
                        </div>
                      </div>

                      {/* Sorting */}
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-900">What people say</h3>

                        <div className="relative">
                          <select
                            className="appearance-none bg-white border border-slate-200 text-xs rounded-lg py-1.5 pl-2 pr-8 focus:ring-green-500 focus:border-green-500"
                            value={sortMethod}
                            onChange={(e) => setSortMethod(e.target.value as any)}
                          >
                            <option value="newest">Newest</option>
                            <option value="highest">Highest Rated</option>
                            <option value="lowest">Lowest Rated</option>
                          </select>
                          <HiAdjustmentsHorizontal className="absolute right-2 top-2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      {/* Reviews list */}
                      <div className="space-y-3">
                        {sortedReviews.slice(0, 25).map((review, i) => (
                          <div
                            key={i}
                            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition hover:shadow-md"
                          >
                            <div className="flex items-start gap-3">
                              {review.authorAttribution?.photoUri ? (
                                <img
                                  src={review.authorAttribution.photoUri}
                                  alt=""
                                  className="w-10 h-10 rounded-full bg-slate-100 object-cover"
                                  referrerPolicy="no-referrer"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-slate-200" />
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-semibold text-sm text-gray-900 truncate">
                                    {review.authorAttribution?.displayName ?? "Google user"}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 shrink-0">
                                    {review.relativePublishTimeDescription ?? ""}
                                  </span>
                                </div>

                                <div className="my-1">
                                  <StarRow rating={review.rating ?? 0} />
                                </div>

                             <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
  {review.text?.text || "—"}
</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 text-center">
                        <a
                          href={googleData.url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(
                            "text-sm text-green-700 font-semibold hover:underline",
                            !googleData.url && "pointer-events-none text-slate-400"
                          )}
                        >
                          Read more on Google Maps
                        </a>
                      </div>
                    </>
                  )}
                </Tab.Panel>

                {/* MAP TAB */}
                <Tab.Panel className="focus:outline-none">
                  <div className="h-[320px] rounded-xl overflow-hidden relative border border-slate-200 bg-white">
                    {/* ✅ No API key needed: free embed */}
                    <iframe
                      width="100%"
                      height="100%"
                      className="absolute inset-0 border-0"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        `${restaurant.name} ${restaurant.address || ""}`.trim()
                      )}&output=embed`}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <HiMapPin className="text-green-700" />
                      <span className="truncate">{restaurant.address || "No address set"}</span>
                    </div>

                    {mapsUrl && (
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-lg bg-slate-100 hover:bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        Open in Maps
                      </a>
                    )}
                  </div>
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>

            {/* Sticky Footer CTA */}
            <div className="p-4 bg-white border-t border-slate-100 z-10 shrink-0">
              <button
                type="button"
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition active:scale-[0.98]"
                onClick={() => {
                  if (onCtaClick) onCtaClick(restaurant);
                  else toast.success("CTA clicked", { duration: 900 });
                  closeModal();
                }}
              >
                {openNow === true ? ctaTextOpen : ctaTextClosed}
              </button>

              <div className="mt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={refreshInfo}
                  className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                >
                  Refresh
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                >
                  Close
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
