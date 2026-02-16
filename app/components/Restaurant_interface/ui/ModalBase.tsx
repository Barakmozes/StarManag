"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";

function getFocusable(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )
  );
}

export function ModalBase({
  open,
  onClose,
  title,
  children,
  footer,
  size = "lg",
  mobileSheet = true,
  ariaLabel,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  ariaLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl";
  mobileSheet?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  const sizeCls = useMemo(() => {
    if (size === "md") return "max-w-lg";
    if (size === "xl") return "max-w-5xl";
    return "max-w-3xl";
  }, [size]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();

      if (e.key === "Tab" && panelRef.current) {
        const focusables = getFocusable(panelRef.current);
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    // focus first focusable element, else panel
    const t = window.setTimeout(() => {
      if (!panelRef.current) return;
      const focusables = getFocusable(panelRef.current);
      (focusables[0] ?? panelRef.current).focus();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  const content = (
    <div className="fixed inset-0 z-[9998]">
      <div
        className="absolute inset-0 bg-black/40"
        onMouseDown={onClose}
        aria-hidden="true"
      />
      <div
        className={[
          "absolute inset-0 flex items-center justify-center p-3",
          mobileSheet ? "sm:items-center sm:justify-center items-end" : "",
        ].join(" ")}
      >
        <div
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel ?? title ?? "Dialog"}
          className={[
            "w-full rounded-2xl bg-white shadow-2xl outline-none",
            sizeCls,
            mobileSheet ? "sm:rounded-2xl rounded-t-2xl" : "",
          ].join(" ")}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {(title ?? null) && (
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
              <div className="min-w-0">
                {title ? (
                  <h2 className="truncate text-base font-semibold text-slate-900">{title}</h2>
                ) : null}
              </div>
              <button
                onClick={onClose}
                className="rounded-lg border px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                aria-label="Close dialog"
              >
                Close
              </button>
            </div>
          )}
          <div className="max-h-[75vh] overflow-auto px-5 py-4">{children}</div>
          {footer ? <div className="border-t px-5 py-4">{footer}</div> : null}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
