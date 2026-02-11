export type Locale = "en" | "he";

/**
 * Normalizes any value we might see in cookies / external systems.
 * - "he" or the legacy "iw" => "he"
 * - everything else => "en"
 */
export function normalizeLocale(value: string | null | undefined): Locale {
  const v = (value ?? "").trim().toLowerCase();
  if (v === "he" || v === "iw") return "he";
  return "en";
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const parts = document.cookie ? document.cookie.split("; ") : [];
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;

    const key = part.slice(0, eq);
    if (key !== name) continue;

    return decodeURIComponent(part.slice(eq + 1));
  }

  return null;
}

export function getClientLocale(cookieName = "locale"): Locale {
  return normalizeLocale(getCookie(cookieName));
}
