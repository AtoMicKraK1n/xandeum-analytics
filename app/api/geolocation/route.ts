import { NextResponse } from "next/server";
import { getGeoLocation } from "@/lib/geo-cache";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");

  if (!ip) {
    return NextResponse.json({ error: "IP address required" }, { status: 400 });
  }

  const geoData = await getGeoLocation(ip);

  if (!geoData) {
    return NextResponse.json(
      { error: "Failed to fetch geolocation" },
      { status: 404 }
    );
  }

  return NextResponse.json(geoData);
}

export const revalidate = 604800; // Cache for 7 days
