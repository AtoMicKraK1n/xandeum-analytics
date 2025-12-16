"use client";

import * as React from "react";
import { createMap } from "svg-dotted-map";
import { cn } from "@/lib/utils";

interface PNode {
  address: string;
  version: string;
  last_seen_timestamp: number;
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
}

interface GeolocatedPNode extends PNode {
  lat: number;
  lng: number;
}

interface Marker {
  lat: number;
  lng: number;
  size?: number;
  label?: string;
  count?: number;
  color?: string;
}

interface NetworkDistributionMapProps {
  pnodes: PNode[];
  className?: string;
}

function getNodeColor(lastSeenTimestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - lastSeenTimestamp;

  if (diff < 300) return "#00FF9F"; // cyber-mint - healthy
  if (diff < 3600) return "#A855F7"; // cyber-purple - degraded
  return "#FF006E"; // cyber-pink - offline
}

function getNodeStatus(
  lastSeenTimestamp: number
): "healthy" | "degraded" | "offline" {
  const now = Date.now() / 1000;
  const diff = now - lastSeenTimestamp;

  if (diff < 300) return "healthy";
  if (diff < 3600) return "degraded";
  return "offline";
}

// Fetch real geolocation from ip-api.com
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

export function NetworkDistributionMap({
  pnodes,
  className,
}: NetworkDistributionMapProps) {
  const [geolocatedNodes, setGeolocatedNodes] = React.useState<
    GeolocatedPNode[]
  >([]);
  const [loading, setLoading] = React.useState(true);

  // Geolocate up to 40 nodes on mount
  React.useEffect(() => {
    const geolocateNodes = async () => {
      setLoading(true);

      // Take first 40 nodes (prioritize healthy ones)
      const sortedNodes = [...pnodes]
        .sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp)
        .slice(0, 40);

      const geolocated: GeolocatedPNode[] = [];

      // Process in batches of 10 to avoid rate limiting
      for (let i = 0; i < sortedNodes.length; i += 10) {
        const batch = sortedNodes.slice(i, i + 10);

        const batchResults = await Promise.all(
          batch.map(async (node) => {
            const ip = node.address.split(":")[0];
            const geo = await fetchGeoLocation(ip);

            if (geo) {
              return {
                ...node,
                lat: geo.lat,
                lng: geo.lng,
                city: geo.city,
                country: geo.country,
              } as GeolocatedPNode;
            }
            return null;
          })
        );

        const validNodes = batchResults.filter(
          (n): n is GeolocatedPNode => n !== null
        );
        geolocated.push(...validNodes);
        setGeolocatedNodes([...geolocated]); // Update progressively

        // Small delay between batches (ip-api.com allows 45 req/min)
        if (i + 10 < sortedNodes.length) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      setLoading(false);
    };

    geolocateNodes();
  }, []); // Only run once on mount

  // Group nodes by location to show clusters
  const markers = React.useMemo(() => {
    const locationMap = new Map<
      string,
      { nodes: GeolocatedPNode[]; lat: number; lng: number }
    >();

    geolocatedNodes.forEach((node) => {
      // Round to 1 decimal to group nearby nodes
      const key = `${node.lat.toFixed(1)},${node.lng.toFixed(1)}`;

      if (!locationMap.has(key)) {
        locationMap.set(key, {
          nodes: [],
          lat: node.lat,
          lng: node.lng,
        });
      }

      locationMap.get(key)!.nodes.push(node);
    });

    return Array.from(locationMap.values()).map(({ nodes, lat, lng }) => {
      const mostRecent = nodes.reduce((prev, curr) =>
        curr.last_seen_timestamp > prev.last_seen_timestamp ? curr : prev
      );

      const city = nodes[0].city || "Unknown";
      const country = nodes[0].country || "Unknown";

      return {
        lat,
        lng,
        size: Math.min(1.5, 0.6 + nodes.length * 0.1),
        label: `${city}, ${country}`,
        count: nodes.length,
        color: getNodeColor(mostRecent.last_seen_timestamp),
      };
    });
  }, [geolocatedNodes]);

  const { points, processedMarkers, xStep, yToRowIndex } = React.useMemo(() => {
    const mapData = createMap({
      width: 150,
      height: 75,
      mapSamples: 10000,
    });
    const pts = mapData.points;
    const processed = mapData.addMarkers(markers);

    const sorted = [...pts].sort((a, b) => a.y - b.y || a.x - b.x);
    const rowMap = new Map<number, number>();
    let step = 0;
    let prevY = Number.NaN;
    let prevXInRow = Number.NaN;

    for (const p of sorted) {
      if (p.y !== prevY) {
        prevY = p.y;
        prevXInRow = Number.NaN;
        if (!rowMap.has(p.y)) rowMap.set(p.y, rowMap.size);
      }
      if (!Number.isNaN(prevXInRow)) {
        const delta = p.x - prevXInRow;
        if (delta > 0) step = step === 0 ? delta : Math.min(step, delta);
      }
      prevXInRow = p.x;
    }

    return {
      points: pts,
      processedMarkers: processed,
      xStep: step || 1,
      yToRowIndex: rowMap,
    };
  }, [markers]);

  const stats = React.useMemo(() => {
    const healthy = pnodes.filter(
      (n) => getNodeStatus(n.last_seen_timestamp) === "healthy"
    ).length;
    const degraded = pnodes.filter(
      (n) => getNodeStatus(n.last_seen_timestamp) === "degraded"
    ).length;
    const offline = pnodes.filter(
      (n) => getNodeStatus(n.last_seen_timestamp) === "offline"
    ).length;

    return { healthy, degraded, offline };
  }, [pnodes]);

  return (
    <div
      className={cn(
        "bg-cyber-card/80 backdrop-blur rounded-lg border border-cyber-border overflow-hidden",
        className
      )}
    >
      <div className="p-4 border-b border-cyber-border">
        <h3 className="text-lg font-semibold text-white mb-3">
          Global Network
        </h3>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyber-mint animate-pulse"></div>
            <span className="text-gray-300">{stats.healthy}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyber-purple animate-pulse"></div>
            <span className="text-gray-300">{stats.degraded}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-cyber-pink"></div>
            <span className="text-gray-300">{stats.offline}</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="relative bg-gradient-to-br from-cyber-dark via-cyber-card to-cyber-dark p-6">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-dark/80 backdrop-blur z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyber-cyan mx-auto mb-2"></div>
              <p className="text-xs text-gray-400">
                Mapping {geolocatedNodes.length}/40 nodes...
              </p>
            </div>
          </div>
        )}

        <svg
          viewBox="0 0 150 75"
          className="w-full h-auto"
          style={{ minHeight: "350px" }}
        >
          {/* Background dots */}
          {points.map((point, index) => {
            const rowIndex = yToRowIndex.get(point.y) ?? 0;
            const offsetX = rowIndex % 2 === 1 ? xStep / 2 : 0;
            return (
              <circle
                cx={point.x + offsetX}
                cy={point.y}
                r={0.22}
                fill="#475569"
                opacity="0.5"
                key={`dot-${index}`}
              />
            );
          })}

          {/* Marker dots with BLINKING effect */}
          {processedMarkers.map((marker, index) => {
            const rowIndex = yToRowIndex.get(marker.y) ?? 0;
            const offsetX = rowIndex % 2 === 1 ? xStep / 2 : 0;
            const original = markers[index];
            const color = original?.color || "#00D9FF";
            const tooltipText = original?.label
              ? `${original.label} - ${original.count} node${
                  original.count! > 1 ? "s" : ""
                }`
              : undefined;

            // Random animation delay for natural effect
            const animationDelay = `${Math.random() * 2}s`;

            return (
              <g key={`marker-${index}`}>
                {/* Outer glow - pulsing */}
                <circle
                  cx={marker.x + offsetX}
                  cy={marker.y}
                  r={(marker.size ?? 0.6) * 6}
                  fill={color}
                  opacity="0"
                  style={{
                    animation: `pulse 2s ease-in-out infinite`,
                    animationDelay,
                  }}
                >
                  <animate
                    attributeName="opacity"
                    values="0;0.3;0"
                    dur="2s"
                    repeatCount="indefinite"
                    begin={animationDelay}
                  />
                  <animate
                    attributeName="r"
                    values={`${(marker.size ?? 0.6) * 4};${
                      (marker.size ?? 0.6) * 7
                    };${(marker.size ?? 0.6) * 4}`}
                    dur="2s"
                    repeatCount="indefinite"
                    begin={animationDelay}
                  />
                </circle>

                {/* Middle glow */}
                <circle
                  cx={marker.x + offsetX}
                  cy={marker.y}
                  r={(marker.size ?? 0.6) * 3}
                  fill={color}
                  opacity="0.4"
                />

                {/* Main marker - BLINKING */}
                <circle
                  cx={marker.x + offsetX}
                  cy={marker.y}
                  r={marker.size ?? 0.6}
                  fill={color}
                  opacity="1"
                  className="cursor-pointer"
                  style={{
                    filter: `drop-shadow(0 0 3px ${color})`,
                  }}
                >
                  {tooltipText && <title>{tooltipText}</title>}
                  <animate
                    attributeName="opacity"
                    values="1;0.3;1"
                    dur="1.5s"
                    repeatCount="indefinite"
                    begin={animationDelay}
                  />
                </circle>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer link */}
      <div className="p-4 border-t border-cyber-border bg-cyber-card/50">
        <a
          href="/map"
          className="text-cyber-cyan hover:text-cyber-mint text-sm flex items-center justify-center gap-1 transition-colors"
        >
          <span>View Interactive Map</span>
          <span>→</span>
        </a>
      </div>
    </div>
  );
}
