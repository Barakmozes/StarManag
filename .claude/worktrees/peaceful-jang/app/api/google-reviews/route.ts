import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CacheEntry = { data: any; timestamp: number };

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 1000 * 60 * 60; // שעה אחת
const CACHE_MAX_ITEMS = 300;

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

function normalizeKey(q: string) {
  return q.trim().toLowerCase();
}

function getFromCache(key: string) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.timestamp > CACHE_DURATION_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function setCache(key: string, data: any) {
  if (cache.size >= CACHE_MAX_ITEMS) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim();

  if (!query) return NextResponse.json({ error: "Missing query" }, { status: 400 });
  if (!GOOGLE_API_KEY) return NextResponse.json({ error: "API Key missing" }, { status: 500 });

  const cacheKey = normalizeKey(query);
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return NextResponse.json(cachedData, { headers: { "X-Cache": "HIT" } });
  }

  try {
    // 1) חיפוש Place ID
    const searchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName",
      },
      body: JSON.stringify({
        textQuery: query,
        maxResultCount: 1,
        regionCode: "IL",
        languageCode: "he",
      }),
    });

    const searchJson = await searchRes.json();
    const placeId = searchJson?.places?.[0]?.id;

    if (!placeId) {
      return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
    }

    // 2) שליפת פרטים מלאים - שים לב ל-FieldMask המעודכן
    const detailsRes = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": GOOGLE_API_KEY,
        "X-Goog-FieldMask": "id,rating,userRatingCount,reviews.text,reviews.rating,reviews.relativePublishTimeDescription,reviews.publishTime,reviews.authorAttribution,googleMapsUri,websiteUri,nationalPhoneNumber,displayName",
      },
    });

    if (!detailsRes.ok) throw new Error("Failed to fetch details");

    const d = await detailsRes.json();

    const payload = {
      placeId: d.id,
      name: d.displayName?.text || null,
      rating: d.rating || null,
      userRatingCount: d.userRatingCount || 0,
      url: d.googleMapsUri || null,
      websiteUri: d.websiteUri || null,
      formattedPhoneNumber: d.nationalPhoneNumber || null,
      reviews: (d.reviews || []).map((r: any) => ({
        rating: r.rating,
        relativePublishTimeDescription: r.relativePublishTimeDescription,
        publishTime: r.publishTime, 
        text: r.text?.text || "", // מחזירים מחרוזת נקייה ל-Frontend
        authorAttribution: {
          displayName: r.authorAttribution?.displayName,
          photoUri: r.authorAttribution?.photoUri
        }
      })),
    };

    setCache(cacheKey, payload);

    return NextResponse.json(payload, {
      headers: { 
        "X-Cache": "MISS",
        "Cache-Control": "public, s-maxage=3600" 
      },
    });

  } catch (error: any) {
    console.error("Google API Route Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}