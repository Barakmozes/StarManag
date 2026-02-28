export const DEFAULT_GRID = 20;

export const TABLE_SIZE = {
  w: 110,
  h: 84,
};

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function snap(n: number, grid: number) {
  if (!grid || grid <= 1) return n;
  return Math.round(n / grid) * grid;
}

export function clampPointToStage(
  x: number,
  y: number,
  stageW: number,
  stageH: number,
  itemW = TABLE_SIZE.w,
  itemH = TABLE_SIZE.h
) {
  return {
    x: clamp(x, 0, Math.max(0, stageW - itemW)),
    y: clamp(y, 0, Math.max(0, stageH - itemH)),
  };
}

export type Rect = { x: number; y: number; w: number; h: number; id: string };

export function rectsOverlap(a: Rect, b: Rect) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

export function getCollisionIds(rects: Rect[]) {
  const collisions = new Set<string>();
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      if (rectsOverlap(rects[i], rects[j])) {
        collisions.add(rects[i].id);
        collisions.add(rects[j].id);
      }
    }
  }
  return collisions;
}

export function yyyyMmDd(d: Date) {
  const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
  return iso.slice(0, 10);
}

export function safeParsePosition(pos: any): { x: number; y: number } {
  if (!pos || typeof pos !== "object") return { x: 0, y: 0 };
  const x = Number(pos.x);
  const y = Number(pos.y);
  return { x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0 };
}
