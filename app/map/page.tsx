"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamically import map to avoid SSR issues
const MapComponent = dynamic(() => import("../../components/MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-white text-lg">Loading map...</p>
      </div>
    </div>
  ),
});

interface PNode {
  address: string;
  version: string;
  pubkey: string | null;
  last_seen_timestamp: number;
}

interface PNodeWithGeo extends PNode {
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
}

// Fetch geolocation from ip-api.com
async function fetchGeoLocation(ip: string): Promise<{
  lat: number;
  lng: number;
  city?: string;
  country?: string;
} | null> {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country`
    );
    const data = await response.json();

    if (data.status === "success" && data.lat && data.lon) {
      return {
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country,
      };
    }
  } catch (error) {
    console.error(`Failed to get location for ${ip}:`, error);
  }
  return null;
}

export default function MapPage() {
  const [pnodes, setPnodes] = useState<PNodeWithGeo[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // First, fetch the pNode list
    fetch("/api/pnodes/list")
      .then((res) => res.json())
      .then(async (data) => {
        if (data.success) {
          const nodes = data.data as PNode[];
          setPnodes(nodes);
          setLoading(false);

          // Then fetch geolocation for each node
          setGeoLoading(true);
          const nodesWithGeo = await Promise.all(
            nodes.map(async (node) => {
              const ip = node.address.split(":")[0];
              const geo = await fetchGeoLocation(ip);

              return {
                ...node,
                lat: geo?.lat,
                lng: geo?.lng,
                city: geo?.city,
                country: geo?.country,
              };
            })
          );

          setPnodes(nodesWithGeo);
          setGeoLoading(false);
        } else {
          setError("Failed to load pNodes");
          setLoading(false);
          setGeoLoading(false);
        }
      })
      .catch((err) => {
        setError("Network error");
        setLoading(false);
        setGeoLoading(false);
      });
  }, []);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <Link href="/" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-gray-900/95 backdrop-blur border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/"
                className="text-blue-400 hover:text-blue-300 text-sm mb-1 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-white">
                pNode Network Map
              </h1>
              <p className="text-gray-400 text-sm">
                {loading
                  ? "Loading nodes..."
                  : geoLoading
                  ? `Geolocating ${pnodes.length} nodes...`
                  : `${pnodes.length} nodes worldwide`}
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-white text-sm">Online</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-white text-sm">Recent</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-lg">
                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                <span className="text-white text-sm">Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-full w-full pt-[100px]">
        {!loading && <MapComponent pnodes={pnodes} />}
      </div>
    </div>
  );
}
