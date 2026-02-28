"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

type MiniMapTable = {
  id: string;
  x: number;
  y: number;
  reserved?: boolean;
  unpaid?: boolean;
  locked?: boolean;
  selected?: boolean;
};

type Viewport = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type MiniMapProps = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  stageSize: { width: number; height: number };
  scale: number;
  tables: MiniMapTable[];
  className?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

/**
 * MiniMap
 * - Shows a tiny overview of the whole floor plan
 * - Shows viewport rectangle
 * - Tap/drag on minimap to navigate
 */
const MiniMap: React.FC<MiniMapProps> = ({
  containerRef,
  stageSize,
  scale,
  tables,
  className,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [collapsed, setCollapsed] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, w: 0, h: 0 });

  const updateViewport = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const next: Viewport = {
      x: container.scrollLeft / scale,
      y: container.scrollTop / scale,
      w: container.clientWidth / scale,
      h: container.clientHeight / scale,
    };
    setViewport(next);
  }, [containerRef, scale]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateViewport);
    };

    updateViewport();
    container.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateViewport);

    return () => {
      container.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateViewport);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, updateViewport]);

  const navigateTo = useCallback(
    (worldX: number, worldY: number) => {
      const container = containerRef.current;
      if (!container) return;

      const targetLeft = worldX * scale - container.clientWidth / 2;
      const targetTop = worldY * scale - container.clientHeight / 2;

      const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
      const maxTop = Math.max(0, container.scrollHeight - container.clientHeight);

      container.scrollLeft = clamp(targetLeft, 0, maxLeft);
      container.scrollTop = clamp(targetTop, 0, maxTop);
    },
    [containerRef, scale]
  );

  const dragRef = useRef<{ active: boolean } | null>(null);

  const pointFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();

      const relX = (clientX - rect.left) / rect.width;
      const relY = (clientY - rect.top) / rect.height;

      const x = clamp(relX, 0, 1) * stageSize.width;
      const y = clamp(relY, 0, 1) * stageSize.height;
      return { x, y };
    },
    [stageSize.height, stageSize.width]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.preventDefault();
      e.stopPropagation();

      dragRef.current = { active: true };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}

      const p = pointFromClient(e.clientX, e.clientY);
      navigateTo(p.x, p.y);
    },
    [navigateTo, pointFromClient]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!dragRef.current?.active) return;
      e.preventDefault();
      e.stopPropagation();
      const p = pointFromClient(e.clientX, e.clientY);
      navigateTo(p.x, p.y);
    },
    [navigateTo, pointFromClient]
  );

  const onPointerUpOrCancel = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragRef.current?.active) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  }, []);

  const dotRadius = useMemo(() => 14, []);

  return (
    <div
      className={
        "pointer-events-auto select-none rounded-xl bg-white/90 shadow-lg border border-gray-200 backdrop-blur " +
        (className || "")
      }
    >
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-700">Mini‑map</p>
        <button
          type="button"
          onClick={() => setCollapsed((s) => !s)}
          className="min-h-[36px] px-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100"
          aria-label={collapsed ? "Expand mini-map" : "Collapse mini-map"}
        >
          {collapsed ? "Show" : "Hide"}
        </button>
      </div>

      {!collapsed && (
        <div className="p-2">
          <svg
            ref={svgRef}
            width={200}
            height={130}
            viewBox={`0 0 ${stageSize.width} ${stageSize.height}`}
            preserveAspectRatio="xMidYMid meet"
            className="block rounded-lg bg-gray-50 border border-gray-100 touch-none"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUpOrCancel}
            onPointerCancel={onPointerUpOrCancel}
            aria-label="Mini map navigation"
          >
            <rect x={0} y={0} width={stageSize.width} height={stageSize.height} fill="rgba(243,244,246,1)" />

            {tables.map((t) => {
              const fill = t.locked
                ? "rgba(156,163,175,0.95)"
                : t.unpaid
                  ? "rgba(245,158,11,0.95)"
                  : t.reserved
                    ? "rgba(239,68,68,0.95)"
                    : "rgba(34,197,94,0.95)";
              const stroke = t.selected ? "rgba(37,99,235,1)" : "rgba(0,0,0,0.12)";
              const strokeW = t.selected ? 4 : 2;
              return (
                <circle
                  key={t.id}
                  cx={t.x}
                  cy={t.y}
                  r={dotRadius}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeW}
                />
              );
            })}

            <rect
              x={viewport.x}
              y={viewport.y}
              width={Math.max(1, viewport.w)}
              height={Math.max(1, viewport.h)}
              fill="rgba(59,130,246,0.10)"
              stroke="rgba(37,99,235,1)"
              strokeWidth={6}
              rx={20}
            />
          </svg>

          <p className="mt-2 text-[11px] text-gray-500">
            Tap/drag to move view
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(MiniMap);
