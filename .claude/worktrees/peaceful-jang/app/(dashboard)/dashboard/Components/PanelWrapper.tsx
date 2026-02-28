"use client";

import React from "react";

type PanelWrapperProps = {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export default function PanelWrapper({
  title,
  children,
  actions,
}: PanelWrapperProps) {
  return (
    <div className="my-6 rounded-lg bg-white p-4 shadow-2xl sm:my-12 sm:p-6 md:max-h-[80vh] md:overflow-y-auto">
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="min-w-0 text-center text-xl font-semibold text-slate-500 sm:text-left sm:text-2xl">
          {title}
        </h2>

        {actions ? (
          <div className="flex shrink-0 justify-center sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>

      <div className="relative overflow-x-auto">{children}</div>
    </div>
  );
}
