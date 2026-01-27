"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@urql/next";
import toast from "react-hot-toast";
import { ReadonlyURLSearchParams, useRouter, useSearchParams } from "next/navigation";
import { HiPlus } from "react-icons/hi2";

import TableWrapper from "../Components/TableWrapper";
import UploadImg from "../Components/UploadImg";
import Modal from "@/app/components/Common/Modal";
import { SupabaseImageDelete, SupabaseImageUpload } from "@/lib/supabaseStorage";

import OpeningHours from "./OpeningHours";

import {
  AddRestaurantDocument,
  type AddRestaurantMutation,
  type AddRestaurantMutationVariables,
  EditRestaurantDocument,
  type EditRestaurantMutation,
  type EditRestaurantMutationVariables,
  GetRestaurantsDocument,
  type GetRestaurantsQuery,
} from "@/graphql/generated";
import PanelWrapper from "../Components/PanelWrapper";

// Same helper as category files (works whether you stored filename OR full public URL)
const getSupabaseFileName = (urlOrPath: string) => {
  if (!urlOrPath) return "";
  if (!urlOrPath.includes("http")) return urlOrPath.replace("public/", "");
  const idx = urlOrPath.lastIndexOf("/public/");
  if (idx !== -1) return urlOrPath.substring(idx + "/public/".length);
  return urlOrPath.split("/").pop() ?? urlOrPath;
};

const DEFAULT_OPEN_TIMES = [
  { day: "Sunday", open: "08:00", close: "22:00", closed: false },
  { day: "Monday", open: "08:00", close: "22:00", closed: false },
  { day: "Tuesday", open: "08:00", close: "22:00", closed: false },
  { day: "Wednesday", open: "08:00", close: "22:00", closed: false },
  { day: "Thursday", open: "08:00", close: "22:00", closed: false },
  { day: "Friday", open: "08:00", close: "23:00", closed: false },
  { day: "Saturday", open: "08:00", close: "23:00", closed: false },
];

function normalizeStr(x: unknown) {
  return (x ?? "").toString().toLowerCase().trim();
}

function firstPresent(sp: ReadonlyURLSearchParams, keys: readonly string[]) {
  for (const k of keys) {
    const v = sp.get(k);
    if (v !== null) return v;
  }
  return null;
}

const SEARCH_KEYS = ["q", "search", "query"] as const;

type RestaurantNode = NonNullable<GetRestaurantsQuery["getRestaurants"]>[number];

const RestaurantDetails = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = (firstPresent(searchParams, SEARCH_KEYS) ?? "").trim();
  const qNorm = useMemo(() => normalizeStr(qParam), [qParam]);

  const [{ data, fetching, error }, reexecuteQuery] = useQuery<GetRestaurantsQuery>({
    query: GetRestaurantsDocument,
    requestPolicy: "cache-and-network",
  });

  const restaurantsAll = useMemo<RestaurantNode[]>(
    () => data?.getRestaurants ?? [],
    [data?.getRestaurants]
  );

  // ✅ Apply search filter (this is why search "didn't work": component ignored URL query)
  const restaurants = useMemo<RestaurantNode[]>(() => {
    if (!qNorm) return restaurantsAll;

    return restaurantsAll.filter((r) => {
      const name = normalizeStr(r.name);
      const address = normalizeStr(r.address);
      const id = normalizeStr(r.id);
      return name.includes(qNorm) || address.includes(qNorm) || id.includes(qNorm);
    });
  }, [restaurantsAll, qNorm]);

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);

  // ✅ Keep selection valid against *filtered* list
  useEffect(() => {
    if (!restaurants.length) {
      setSelectedRestaurantId(null);
      return;
    }

    if (!selectedRestaurantId) {
      setSelectedRestaurantId(restaurants[0].id);
      return;
    }

    const stillExists = restaurants.some((r) => r.id === selectedRestaurantId);
    if (!stillExists) {
      setSelectedRestaurantId(restaurants[0].id);
    }
  }, [restaurants, selectedRestaurantId]);

  const selectedRestaurant = useMemo(() => {
    if (!restaurants.length) return null;
    return restaurants.find((r) => r.id === selectedRestaurantId) ?? restaurants[0];
  }, [restaurants, selectedRestaurantId]);

  // Details form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [serviceFee, setServiceFee] = useState<number>(0);
  const [rating, setRating] = useState<number>(0);
  const [bannerImg, setBannerImg] = useState<string>("");

  // Sync state when selected restaurant changes
  useEffect(() => {
    if (!selectedRestaurant) return;

    setName(selectedRestaurant.name ?? "");
    setAddress(selectedRestaurant.address ?? "");
    setDeliveryFee(Number(selectedRestaurant.deliveryFee ?? 0));
    setServiceFee(Number(selectedRestaurant.serviceFee ?? 0));
    setRating(Number(selectedRestaurant.rating ?? 0));
    setBannerImg(selectedRestaurant.bannerImg ?? "");
  }, [
    selectedRestaurant?.id,
    selectedRestaurant?.name,
    selectedRestaurant?.address,
    selectedRestaurant?.deliveryFee,
    selectedRestaurant?.serviceFee,
    selectedRestaurant?.rating,
    selectedRestaurant?.bannerImg,
  ]);

  const [, editRestaurant] = useMutation<EditRestaurantMutation, EditRestaurantMutationVariables>(
    EditRestaurantDocument
  );

  const deleteBannerSafely = useCallback(async (urlOrPath: string) => {
    const file = getSupabaseFileName(urlOrPath);
    if (!file) return;
    try {
      await SupabaseImageDelete(file);
    } catch (e) {
      console.warn("Failed to delete banner:", e);
    }
  }, []);

  const getBannerFile = async (file: File) => {
    if (!selectedRestaurant?.id) return;

    const old = bannerImg || selectedRestaurant.bannerImg || "";
    const toastId = toast.loading("Uploading banner...");

    try {
      const nextUrl = await SupabaseImageUpload(file);
      if (!nextUrl) throw new Error("Upload failed");
      setBannerImg(nextUrl);

      // ✅ delete old only after new upload succeeded (prevents losing banner on failed upload)
      if (old && old !== nextUrl) {
        await deleteBannerSafely(old);
      }

      toast.success("Banner updated", { id: toastId, duration: 1200 });
    } catch (e: any) {
      toast.error(e?.message || "Error uploading banner", { id: toastId, duration: 2500 });
    }
  };

  const handleSaveRestaurantDetails = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedRestaurant?.id) {
      toast.error("No restaurant selected", { duration: 2000 });
      return;
    }
    if (!name.trim()) {
      toast.error("Restaurant name is required", { duration: 2000 });
      return;
    }

    const toastId = toast.loading("Saving...");
    try {
      const res = await editRestaurant({
        editRestaurantId: selectedRestaurant.id,
        name: name.trim(),
        address: address.trim(),
        deliveryFee: Number.isFinite(deliveryFee) ? deliveryFee : 0,
        serviceFee: Number.isFinite(serviceFee) ? serviceFee : 0,
        rating: Number.isFinite(rating) ? rating : 0,
        bannerImg: bannerImg || undefined,
      });

      if (res.data?.editRestaurant) {
        toast.success("Restaurant updated", { id: toastId, duration: 1200 });
        reexecuteQuery({ requestPolicy: "network-only" });
        router.refresh();
      } else {
        toast.error("An error occurred", { id: toastId, duration: 2000 });
      }
    } catch (err) {
      console.error("Error editing restaurant:", err);
      toast.error("An error occurred", { id: toastId, duration: 2000 });
    }
  };

  // Create restaurant (if none exists)
  const [createOpen, setCreateOpen] = useState(false);
  const closeCreate = () => setCreateOpen(false);
  const openCreate = () => setCreateOpen(true);

  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newBanner, setNewBanner] = useState<string>("");

  const getNewBannerFile = async (file: File) => {
    const toastId = toast.loading("Uploading banner...");
    try {
      const res = await SupabaseImageUpload(file);
      if (!res) throw new Error("Upload failed");
      setNewBanner(res);
      toast.success("Banner uploaded", { id: toastId, duration: 1200 });
    } catch (error: any) {
      toast.error(error?.message || "Error uploading banner", { id: toastId, duration: 2500 });
    }
  };

  const [, addRestaurant] = useMutation<AddRestaurantMutation, AddRestaurantMutationVariables>(
    AddRestaurantDocument
  );

  const handleCreateRestaurant = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newName.trim()) {
      toast.error("Restaurant name is required", { duration: 2000 });
      return;
    }

    const toastId = toast.loading("Creating...");
    try {
      const res = await addRestaurant({
        name: newName.trim(),
        address: newAddress.trim() || undefined,
        bannerImg: newBanner || undefined,
        openTimes: DEFAULT_OPEN_TIMES,
      });

      if (res.data?.addRestaurant) {
        toast.success("Restaurant created", { id: toastId, duration: 1200 });
        setNewName("");
        setNewAddress("");
        setNewBanner("");
        setTimeout(closeCreate, 700);

        reexecuteQuery({ requestPolicy: "network-only" });
        router.refresh();
      } else {
        toast.error("An error occurred", { id: toastId, duration: 2000 });
      }
    } catch (err) {
      console.error("Error creating restaurant:", err);
      toast.error("An error occurred", { id: toastId, duration: 2000 });
    }
  };

  const noRestaurantsInDb = !fetching && !error && restaurantsAll.length === 0;
  const noMatches = !fetching && !error && restaurantsAll.length > 0 && restaurants.length === 0 && !!qNorm;

  return (
    <>
      <PanelWrapper title="Restaurant Settings" >
        {fetching ? (
          <div className="py-6 text-center text-gray-500">Loading restaurant...</div>
        ) : error ? (
          <div className="py-6 text-center text-red-600">Failed to load restaurant data.</div>
        ) : noRestaurantsInDb ? (
          <div className="py-6">
            <div className="flex items-center justify-between">
              <p className="text-gray-500">No restaurant found in DB.</p>
              <button
                onClick={openCreate}
                className="text-white inline-flex items-center whitespace-nowrap bg-green-600
                hover:bg-green-700 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                <HiPlus className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
                Create Restaurant
              </button>
            </div>

            <Modal isOpen={createOpen} title="Create Restaurant" closeModal={closeCreate}>
              <form onSubmit={handleCreateRestaurant}>
                <div className="grid gap-4 mb-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="form-label" htmlFor="newName">
                      Name
                    </label>
                    <input
                      id="newName"
                      className="form-input"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Restaurant name"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="form-label" htmlFor="newAddress">
                      Address
                    </label>
                    <input
                      id="newAddress"
                      className="form-input"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Restaurant address"
                    />
                  </div>
                </div>

                <UploadImg handleCallBack={getNewBannerFile} id="createRestaurantBanner" />

                <button
                  type="submit"
                  className="mt-4 text-white inline-flex items-center bg-green-600
                    hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300
                    font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                >
                  <HiPlus className="mr-1 -ml-1 w-4 h-4" fill="currentColor" />
                  Create
                </button>
              </form>
            </Modal>
          </div>
        ) : noMatches ? (
          <div className="py-6 text-center text-gray-500">
            No restaurants match your search.
          </div>
        ) : (
          <>
            {/* Restaurant selector */}
            {restaurants.length > 1 && (
              <div className="mb-4">
                <label className="form-label" htmlFor="restaurantSelect">
                  Select Restaurant
                </label>
                <select
                  id="restaurantSelect"
                  className="form-input"
                  value={selectedRestaurant?.id ?? ""}
                  onChange={(e) => setSelectedRestaurantId(e.target.value)}
                >
                  {restaurants.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Details form */}
            <form onSubmit={handleSaveRestaurantDetails}>
              <div className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Restaurant Details</h3>
                    <p className="text-sm text-gray-500">Update your restaurant information</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Banner */}
                  <div className="sm:col-span-2">
                    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
                      <Image
                        src={bannerImg || selectedRestaurant?.bannerImg || "/img/banner.jpg"}
                        alt="banner"
                        width={960}
                        height={320}
                        className="h-44 w-full object-cover sm:h-52"
                        priority
                      />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
                    </div>
                  </div>

                  {/* Name */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="name">
                      Name
                    </label>
                    <input
                      id="name"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-900/20 focus:ring-4 focus:ring-gray-900/10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Restaurant name"
                    />
                  </div>

                  {/* Address */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="address">
                      Address
                    </label>
                    <input
                      id="address"
                      className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-900/20 focus:ring-4 focus:ring-gray-900/10"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Full address"
                    />
                  </div>

                  {/* Delivery Fee */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="deliveryFee">
                      Delivery Fee
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        ₪
                      </span>
                      <input
                        id="deliveryFee"
                        type="number"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-7 pr-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-900/20 focus:ring-4 focus:ring-gray-900/10"
                        value={deliveryFee}
                        onChange={(e) => setDeliveryFee(e.target.valueAsNumber)}
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Service Fee */}
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="serviceFee">
                      Service Fee
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        ₪
                      </span>
                      <input
                        id="serviceFee"
                        type="number"
                        className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-7 pr-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-900/20 focus:ring-4 focus:ring-gray-900/10"
                        value={serviceFee}
                        onChange={(e) => setServiceFee(e.target.valueAsNumber)}
                        min={0}
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-sm font-medium text-gray-700" htmlFor="rating">
                      Rating
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id="rating"
                        type="number"
                        step="0.1"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none transition focus:border-gray-900/20 focus:ring-4 focus:ring-gray-900/10"
                        value={rating}
                        onChange={(e) => setRating(e.target.valueAsNumber)}
                        min={0}
                        max={5}
                      />
                      <span className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700">
                        0–5
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <UploadImg
                handleCallBack={getBannerFile}
                id={`restaurantBanner-${selectedRestaurant?.id ?? "x"}`}
              />

              <button
                type="submit"
                className="mt-4 text-white inline-flex items-center bg-green-600
                  hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300
                  font-medium rounded-lg text-sm px-5 py-2.5 text-center"
              >
                Save Details
              </button>
            </form>

            {/* Opening hours section */}
            {selectedRestaurant?.id && (
              <div className="mt-6">
                <OpeningHours restaurantId={selectedRestaurant.id} openTimes={selectedRestaurant.openTimes} />
              </div>
            )}
          </>
        )}
      </PanelWrapper>
    </>
  );
};

export default RestaurantDetails;
