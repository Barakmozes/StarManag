// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import TableWrapper from "../Components/TableWrapper";
// import UploadImg from "../Components/UploadImg";
// import Modal from "@/app/components/Common/Modal";

// import { SupabaseImageUpload } from "@/lib/supabaseStorage";
// import {
//   useAddRestaurantMutation,
//   useGetRestaurantsQuery,
//   type GetRestaurantsQuery,
// } from "@/graphql/generated";

// import RestaurantDetails from "./RestaurantDetails";
// import OpeningHours from "./OpeningHours";

// type Restaurant = GetRestaurantsQuery["getRestaurants"][number];

// const DAYS = [
//   "Sunday",
//   "Monday",
//   "Tuesday",
//   "Wednesday",
//   "Thursday",
//   "Friday",
//   "Saturday",
// ] as const;

// type OpeningHoursDay = {
//   day: (typeof DAYS)[number];
//   open: string; // "09:00"
//   close: string; // "22:00"
//   closed: boolean;
// };

// function defaultOpenTimes(): OpeningHoursDay[] {
//   return DAYS.map((day) => ({
//     day,
//     open: "09:00",
//     close: "22:00",
//     closed: false,
//   }));
// }

// export default function RestaurantSettings() {
//   const [{ data, fetching, error }, reexecuteQuery] = useGetRestaurantsQuery({
//     requestPolicy: "cache-and-network",
//   });

//   const refresh = () => reexecuteQuery({ requestPolicy: "network-only" });

//   const restaurants = useMemo(() => data?.getRestaurants ?? [], [data?.getRestaurants]);
//   const [selectedId, setSelectedId] = useState<string | null>(null);

//   useEffect(() => {
//     if (!selectedId && restaurants.length > 0) {
//       setSelectedId(restaurants[0].id);
//     }
//     if (selectedId && restaurants.length > 0) {
//       const stillExists = restaurants.some((r) => r.id === selectedId);
//       if (!stillExists) setSelectedId(restaurants[0].id);
//     }
//   }, [restaurants, selectedId]);

//   const selectedRestaurant: Restaurant | null = useMemo(() => {
//     if (!restaurants.length) return null;
//     return restaurants.find((r) => r.id === selectedId) ?? restaurants[0];
//   }, [restaurants, selectedId]);

//   // Create flow
//   const [, addRestaurant] = useAddRestaurantMutation();
//   const [createOpen, setCreateOpen] = useState(false);
//   const [creating, setCreating] = useState(false);
//   const [createError, setCreateError] = useState<string | null>(null);

//   const [newName, setNewName] = useState("");
//   const [newAddress, setNewAddress] = useState("");
//   const [newBannerImg, setNewBannerImg] = useState<string>("/banner.jpg"); // safe default
//   const [uploadingBanner, setUploadingBanner] = useState(false);

//   const handleCreateBannerUpload = async (file: File) => {
//     setUploadingBanner(true);
//     setCreateError(null);
//     try {
//       const url = await SupabaseImageUpload(file);
//       setNewBannerImg(url);
//     } catch (e) {
//       setCreateError("Failed to upload banner image.");
//     } finally {
//       setUploadingBanner(false);
//     }
//   };

//   const canCreate = newName.trim().length > 0 && !creating && !uploadingBanner;

//   const submitCreate = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!canCreate) return;

//     setCreating(true);
//     setCreateError(null);

//     const res = await addRestaurant({
//       name: newName.trim(),
//       address: newAddress.trim() || undefined,
//       bannerImg: newBannerImg || "/banner.jpg",
//       openTimes: defaultOpenTimes(),
//     });

//     setCreating(false);

//     if (res.error) {
//       setCreateError(res.error.message);
//       return;
//     }

//     setCreateOpen(false);
//     setNewName("");
//     setNewAddress("");
//     setNewBannerImg("/banner.jpg");
//     refresh();
//   };

//   return (
//     <TableWrapper title="Restaurant Settings">
//       <div className="flex items-center justify-between px-6 py-3 border-b bg-white">
//         <div>
//           <p className="text-sm text-slate-600">
//             Manage restaurant profile + opening hours
//           </p>
//           <p className="text-xs text-slate-400">
//             Data is live (GraphQL → Prisma → DB)
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={refresh}
//             className="px-3 py-2 text-sm rounded-md bg-slate-100 hover:bg-slate-200"
//             type="button"
//           >
//             Refresh
//           </button>

//           {restaurants.length === 0 && (
//             <button
//               onClick={() => setCreateOpen(true)}
//               className="px-3 py-2 text-sm rounded-md bg-green-700 text-white hover:bg-green-800"
//               type="button"
//             >
//               Create Restaurant
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="p-6 bg-white">
//         {fetching && <p className="text-sm text-slate-500">Loading…</p>}
//         {error && (
//           <p className="text-sm text-red-600">
//             Failed to load restaurants: {error.message}
//           </p>
//         )}

//         {restaurants.length === 0 && !fetching && (
//           <p className="text-sm text-slate-600">
//             No restaurant found in the database yet. Click{" "}
//             <span className="font-semibold">Create Restaurant</span>.
//           </p>
//         )}

//         {selectedRestaurant && (
//           <div className="space-y-8">
//             <RestaurantDetails
//               restaurants={restaurants}
//               restaurant={selectedRestaurant}
//               selectedId={selectedRestaurant.id}
//               onSelect={setSelectedId}
//               onSaved={refresh}
//             />

//             <OpeningHours restaurant={selectedRestaurant} onSaved={refresh} />
//           </div>
//         )}
//       </div>

//       <Modal
//         isOpen={createOpen}
//         closeModal={() => setCreateOpen(false)}
//         title="Create Restaurant"
//       >
//         <form onSubmit={submitCreate} className="space-y-4">
//           {createError && (
//             <p className="text-sm text-red-600">{createError}</p>
//           )}

//           <div className="space-y-2">
//             <label className="text-sm text-slate-700">Name</label>
//             <input
//               value={newName}
//               onChange={(e) => setNewName(e.target.value)}
//               className="w-full border rounded-md px-3 py-2"
//               placeholder="Restaurant name"
//               required
//             />
//           </div>

//           <div className="space-y-2">
//             <label className="text-sm text-slate-700">Address</label>
//             <input
//               value={newAddress}
//               onChange={(e) => setNewAddress(e.target.value)}
//               className="w-full border rounded-md px-3 py-2"
//               placeholder="Optional"
//             />
//           </div>

//           <div className="space-y-2">
//             <UploadImg
//               id="restaurant-create-banner"
//               title="Banner Image"
//               description="Upload a banner (or keep default)."
//               handleCallBack={handleCreateBannerUpload}
//               maxMB={10}
//             />
//             <p className="text-xs text-slate-500">
//               {uploadingBanner ? "Uploading…" : " "}
//             </p>
//           </div>

//           <button
//             type="submit"
//             disabled={!canCreate}
//             className="w-full px-4 py-2 rounded-md bg-green-700 text-white disabled:opacity-50"
//           >
//             {creating ? "Creating…" : "Create"}
//           </button>
//         </form>
//       </Modal>
//     </TableWrapper>
//   );
// }
