"use client";

import { useEffect, useState, useCallback } from "react";
import { HiMapPin } from "react-icons/hi2";
import { FaChevronRight } from "react-icons/fa";
import LocationSearchForm from "./LocationSearchForm";
import Modal from "./Modal";

const LocationBtn = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [address, setAddress] = useState<string>("");

  // פונקציה לטעינת הכתובת - מוגדרת כ-Callback כדי להשתמש בה בכמה מקומות
  const refreshAddress = useCallback(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("delivery_address");
      setAddress(stored || "");
    }
  }, []);

  // טעינה ראשונית וסנכרון כשעוברים בין מצבים במודאל
  useEffect(() => {
    refreshAddress();
  }, [refreshAddress, showChange, isOpen]);

  const closeModal = () => {
    setShowChange(false);
    setIsOpen(false);
    refreshAddress(); // וידוא עדכון בסגירה
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex min-h-[44px] w-full items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-600 transition hover:bg-green-100 hover:text-green-700 md:w-auto md:max-w-sm md:rounded-lg"
        aria-label="Set delivery address"
      >
        <HiMapPin className="shrink-0 text-green-600" aria-hidden="true" />
        
        {/* נקודה דקורטיבית למסכי דסקטופ */}
        <span className="hidden h-1 w-1 shrink-0 rounded-full bg-slate-400 md:block" aria-hidden="true" />

        <span className="truncate text-sm font-medium max-w-[10rem] md:max-w-[14rem]">
          {address || "Enter Delivery Address"}
        </span>

        <FaChevronRight className="ml-auto size-3 shrink-0 text-slate-400 md:ml-0" aria-hidden="true" />
      </button>

      <Modal title="Delivery Address" isOpen={isOpen} closeModal={closeModal}>
        <div className="min-h-[200px]">
          {showChange ? (
            <div className="mt-2 animate-in fade-in slide-in-from-bottom-2">
              <LocationSearchForm />
              <button 
                onClick={() => setShowChange(false)}
                className="mt-4 text-xs font-semibold text-slate-400 hover:text-green-600 uppercase"
              >
                ← Back to saved
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4 border border-slate-100">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Address</p>
                  <p className="truncate text-sm font-medium text-slate-700 mt-1">
                    {address || "No address selected"}
                  </p>
                </div>
                <button
                  type="button"
                  className="ml-4 h-9 rounded-lg border border-green-500 bg-white px-4 text-xs font-bold text-green-600 transition hover:bg-green-50"
                  onClick={() => setShowChange(true)}
                >
                  CHANGE
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8">
          <button
            type="button"
            className="h-12 w-full rounded-xl bg-green-600 text-sm font-bold text-white shadow-lg shadow-green-200 transition hover:bg-green-700 active:scale-[0.98]"
            onClick={closeModal}
          >
            Done
          </button>
        </div>
      </Modal>
    </>
  );
};

export default LocationBtn;