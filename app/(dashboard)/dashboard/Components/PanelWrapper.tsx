"use client";

import React from "react";

type PanelWrapperProps = {
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export default function PanelWrapper({ title, children, actions }: PanelWrapperProps) {
  return (
    <div className="rounded-lg shadow-2xl p-6 my-12 max-h-[80vh] overflow-y-auto bg-white">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-center mb-6 text-2xl font-semibold text-slate-500 w-full">
          {title}
        </h2>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>

      <div className="relative overflow-x-auto">{children}</div>
    </div>
  );
}
