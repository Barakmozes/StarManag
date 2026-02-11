"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { HiMapPin, HiOutlineCursorArrowRays } from "react-icons/hi2";
import toast from "react-hot-toast";

interface MapboxFeature {
  id: string;
  place_name: string;
}

const LocationSearchForm = () => {
  const [address, setAddress] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 1. טעינה ראשונית מה-Storage
  useEffect(() => {
    const saved = localStorage.getItem("delivery_address");
    if (saved) {
      setAddress(saved);
      setQuery(saved);
    }
  }, []);

  // 2. פונקציית זיהוי מיקום אוטומטי (מהקוד הראשון, משופרת)
  const detectLocation = () => {
    if (!("geolocation" in navigator)) return;
    
    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { longitude, latitude } = pos.coords;
          const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
          const { data } = await axios.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&country=IL&limit=1`
          );
          const place = data.features[0]?.place_name || "Unknown Location";
          saveAddress(place);
          toast.success("Location detected!");
        } catch (err) {
          toast.error("Failed to reverse geocode");
        } finally {
          setIsLoading(false);
        }
      },
      () => {
        toast.error("Location access denied");
        setIsLoading(false);
      }
    );
  };

  const saveAddress = (val: string) => {
    setAddress(val);
    setQuery(val);
    localStorage.setItem("delivery_address", val);
    setIsEditing(false);
    setSuggestions([]);
  };

  const fetchSuggestions = async (input: string) => {
    setQuery(input);
    if (input.length < 3) return setSuggestions([]);

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const { data } = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json`,
        { params: { access_token: token, autocomplete: true, country: "IL", limit: 5 } }
      );
      setSuggestions(data.features);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mx-auto max-w-lg mt-6 px-4">
      {!isEditing ? (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <HiMapPin className="text-green-600 shrink-0" size={20} />
            <p className="truncate text-sm font-medium text-slate-700">
              {address || "Where should we deliver?"}
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs font-bold text-green-700 hover:underline ml-4 uppercase tracking-wider"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative space-y-3">
          <div className="relative">
            <input
              autoFocus
              className="w-full p-4 pr-12 rounded-xl border border-slate-200 bg-white shadow-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all"
              placeholder="Enter street and city..."
              value={query}
              onChange={(e) => fetchSuggestions(e.target.value)}
            />
            <button 
              onClick={detectLocation}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-green-600 disabled:opacity-50"
              title="Use my current location"
            >
              <HiOutlineCursorArrowRays size={22} className={isLoading ? "animate-pulse text-green-500" : ""} />
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => saveAddress(s.place_name)}
                  className="w-full p-3 text-left text-sm text-slate-600 hover:bg-green-50 hover:text-green-700 border-b border-slate-50 last:border-none transition-colors"
                >
                  {s.place_name}
                </button>
              ))}
            </div>
          )}
          
          <button 
            onClick={() => setIsEditing(false)}
            className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationSearchForm;