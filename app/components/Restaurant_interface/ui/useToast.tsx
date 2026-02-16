"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: string; kind: ToastKind; title: string; message?: string };

const ToastCtx = createContext<{
  push: (t: Omit<Toast, "id">) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, ...t };
    setToasts((prev) => [toast, ...prev].slice(0, 4));
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-3 top-3 z-[9999] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              "pointer-events-auto w-[320px] max-w-[calc(100vw-24px)] rounded-xl border bg-white p-3 shadow-lg",
              t.kind === "success" ? "border-emerald-200" : "",
              t.kind === "error" ? "border-rose-200" : "",
              t.kind === "info" ? "border-slate-200" : "",
            ].join(" ")}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className={[
                  "mt-1 h-2.5 w-2.5 rounded-full",
                  t.kind === "success" ? "bg-emerald-500" : "",
                  t.kind === "error" ? "bg-rose-500" : "",
                  t.kind === "info" ? "bg-sky-500" : "",
                ].join(" ")}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{t.title}</p>
                {t.message ? (
                  <p className="mt-0.5 text-sm text-slate-600">{t.message}</p>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  
  return ctx;
}
