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
}) as React.ComponentType<{ pnodes: PNodeWithGeo[] }>;

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
    console.log(`[GEO] Fetching location for ${ip}`);
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country`
    );
    const data = await response.json();

    console.log(`[GEO] Response for ${ip}:`, data);

    if (data.status === "success" && data.lat && data.lon) {
      return {
        lat: data.lat,
        lng: data.lon,
        city: data.city,
        country: data.country,
      };
    }
  } catch (error) {
    console.error(`[GEO] Failed to get location for ${ip}:`, error);
  }
  return null;
}

export default function MapPage() {
  const [pnodes, setPnodes] = useState<PNodeWithGeo[]>([]);
  const [loading, setLoading] = useState(true);
  const [geoLoading, setGeoLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geoProgress, setGeoProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    console.log("[MAP] Starting to fetch pNodes...");

    // First, fetch the pNode list
    fetch("/api/pnodes")
      .then((res) => res.json())
      .then(async (data) => {
        console.log("[MAP] Received pNodes data:", data);

        if (data.success) {
          const nodes = data.data as PNode[];
          console.log(`[MAP] Got ${nodes.length} pNodes`);
          setPnodes(nodes);
          setLoading(false);

          // Then fetch geolocation for each node
          setGeoLoading(true);
          setGeoProgress({ current: 0, total: nodes.length });

          const nodesWithGeo: PNodeWithGeo[] = [];

          // Process in batches to avoid rate limiting
          const batchSize = 10;
          for (let i = 0; i < nodes.length; i += batchSize) {
            const batch = nodes.slice(i, i + batchSize);
            console.log(`[MAP] Processing batch ${i / batchSize + 1}`);

            const batchResults = await Promise.all(
              batch.map(async (node) => {
                const ip = node.address.split(":")[0];
                const geo = await fetchGeoLocation(ip);

                setGeoProgress({
                  current: i + batch.indexOf(node) + 1,
                  total: nodes.length,
                });

                return {
                  ...node,
                  lat: geo?.lat,
                  lng: geo?.lng,
                  city: geo?.city,
                  country: geo?.country,
                };
              })
            );

            nodesWithGeo.push(...batchResults);

            // Update state after each batch
            setPnodes([...nodesWithGeo]);

            // Small delay between batches to avoid rate limiting
            if (i + batchSize < nodes.length) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
            }
          }

          console.log(
            "[MAP] Geolocation complete. Nodes with coords:",
            nodesWithGeo.filter((n) => n.lat && n.lng).length
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
        console.error("[MAP] Error:", err);
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

  const nodesWithCoords = pnodes.filter((n) => n.lat && n.lng);

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
                  ? `Geolocating ${geoProgress.current}/${geoProgress.total} nodes...`
                  : `${nodesWithCoords.length} of ${pnodes.length} nodes mapped`}
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
        {!loading && pnodes.length > 0 && <MapComponent pnodes={pnodes} />}
        {!loading && pnodes.length === 0 && (
          <div className="h-full flex items-center justify-center bg-gray-900">
            <p className="text-white">No pNodes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
