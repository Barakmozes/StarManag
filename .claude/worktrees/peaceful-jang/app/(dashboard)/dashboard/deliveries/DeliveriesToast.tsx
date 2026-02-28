// app/(dashboard)/dashboard/deliveries/DeliveriesToast.tsx
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: string; type: ToastType; message: string };

type ToastApi = {
  success: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
};

const ToastCtx = createContext<ToastApi | null>(null);

function toastStyles(type: ToastType) {
  if (type === "success") return "bg-green-600 text-white";
  if (type === "error") return "bg-red-600 text-white";
  return "bg-slate-900 text-white";
}

export function DeliveriesToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const api = useMemo<ToastApi>(() => {
    const push = (type: ToastType, message: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2400);
    };

    return {
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    };
  }, []);

  return (
    <ToastCtx.Provider value={api}>
      {children}

      {/* Toasts (mobile-safe width + safe-area top) */}
      <div
        className="fixed z-[9999] top-[calc(env(safe-area-inset-top)+0.75rem)] left-3 right-3 sm:left-auto sm:right-4 flex flex-col gap-2"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "w-full sm:min-w-[220px] sm:w-auto max-w-full",
              "break-words px-4 py-3 rounded-lg shadow-lg text-sm",
              toastStyles(t.type),
            ].join(" ")}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useDeliveriesToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx)
    throw new Error("useDeliveriesToast must be used within DeliveriesToastProvider");
  return ctx;
}
