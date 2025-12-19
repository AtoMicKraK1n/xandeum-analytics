import { NextResponse } from "next/server";

// Simple in-memory cache
const geoCache = new Map<
  string,
  {
    data: any;
    timestamp: number;
  }
>();

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");

  if (!ip) {
    return NextResponse.json({ error: "IP address required" }, { status: 400 });
  }

  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[GeoCache] Hit for ${ip}`);
    return NextResponse.json(cached.data);
  }

  // Not in cache, fetch from API
  try {
    console.log(`[GeoCache] Fetching from API for ${ip}`);

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country,regionName,isp,org`
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.error(`[GeoCache] Rate limited for ${ip}`);
        return NextResponse.json({ error: "Rate limited" }, { status: 429 });
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (data.status === "success" && data.lat && data.lon) {
      const geoData = {
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country,
        regionName: data.regionName,
        isp: data.isp,
        org: data.org,
      };

      // Cache it
      geoCache.set(ip, {
        data: geoData,
        timestamp: Date.now(),
      });

      return NextResponse.json(geoData);
    }

    return NextResponse.json(
      { error: "Geolocation not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error(`[GeoCache] Error fetching ${ip}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch geolocation" },
      { status: 500 }
    );
  }
}

export const revalidate = 604800; // Cache for 7 days
