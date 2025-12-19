"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { GeoPermissibleObjects } from "d3";

interface PNode {
  address: string;
  last_seen_timestamp: number;
  version?: string;
}

interface GeolocatedNode {
  address: string;
  lat: number;
  lng: number;
  city?: string;
  country?: string;
  health: {
    status: "healthy" | "degraded" | "offline";
    opacity: number;
  };
}

interface NetworkMap2DProps {
  pnodes: PNode[];
}

interface PolygonGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

interface MultiPolygonGeometry {
  type: "MultiPolygon";
  coordinates: number[][][][];
}

interface GeoFeature {
  type: string;
  geometry: PolygonGeometry | MultiPolygonGeometry;
  properties?: Record<string, unknown>;
}

interface GeoFeatureCollection {
  type: "FeatureCollection";
  features: GeoFeature[];
}

function getNodeHealth(lastSeenTimestamp: number) {
  const now = Date.now() / 1000;
  const diff = now - lastSeenTimestamp;

  if (diff < 300) return { status: "healthy" as const, opacity: 1.0 };
  if (diff < 3600) return { status: "degraded" as const, opacity: 0.5 };
  return { status: "offline" as const, opacity: 0.2 };
}

export function NetworkMap2D({ pnodes }: NetworkMap2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [geolocatedNodes, setGeolocatedNodes] = useState<GeolocatedNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const hasInitialized = useRef(false);

  const width = 1200;
  const height = 700;

  // Fetch geolocation for ALL nodes
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const fetchGeolocations = async () => {
      setLoading(true);
      const sortedNodes = [...pnodes].sort(
        (a, b) => b.last_seen_timestamp - a.last_seen_timestamp
      );

      setProgress({ current: 0, total: sortedNodes.length });

      const geolocated: GeolocatedNode[] = [];

      // Process in batches of 10 to avoid overwhelming the API
      for (let i = 0; i < sortedNodes.length; i += 10) {
        const batch = sortedNodes.slice(i, i + 10);

        const results = await Promise.all(
          batch.map(async (node) => {
            const ip = node.address.split(":")[0];
            try {
              const res = await fetch(
                `/api/geolocation?ip=${encodeURIComponent(ip)}`
              );

              if (!res.ok) {
                if (res.status === 429) {
                  console.warn(`Rate limited for ${ip}, skipping...`);
                }
                return null;
              }

              const data = await res.json();

              if (data.lat && data.lng) {
                return {
                  address: node.address,
                  lat: data.lat,
                  lng: data.lng,
                  city: data.city,
                  country: data.country,
                  health: getNodeHealth(node.last_seen_timestamp),
                };
              }
            } catch (error) {
              console.error(`Geolocation error for ${ip}:`, error);
            }
            return null;
          })
        );

        const validNodes = results.filter(
          (n): n is Exclude<(typeof results)[number], null> => n !== null
        );
        geolocated.push(...validNodes);

        setProgress({ current: i + batch.length, total: sortedNodes.length });

        // Add delay between batches to respect rate limits
        if (i + 10 < sortedNodes.length) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      setGeolocatedNodes(geolocated);
      setLoading(false);
    };

    fetchGeolocations();
  }, [pnodes]);

  // D3.js 2D Map Setup
  useEffect(() => {
    if (!canvasRef.current || loading) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);

    // Mercator projection for 2D world map
    const projection = d3
      .geoMercator()
      .scale(180)
      .translate([width / 2, height / 1.5]);

    const path = d3.geoPath().projection(projection).context(context);

    // Point in polygon helper
    const pointInPolygon = (
      point: [number, number],
      polygon: number[][]
    ): boolean => {
      const [x, y] = point;
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i];
        const [xj, yj] = polygon[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    };

    const pointInFeature = (
      point: [number, number],
      feature: GeoFeature
    ): boolean => {
      const geometry = feature.geometry;
      if (geometry.type === "Polygon") {
        const coordinates = geometry.coordinates;
        if (!pointInPolygon(point, coordinates[0])) return false;
        for (let i = 1; i < coordinates.length; i++) {
          if (pointInPolygon(point, coordinates[i])) return false;
        }
        return true;
      } else if (geometry.type === "MultiPolygon") {
        for (const polygon of geometry.coordinates) {
          if (pointInPolygon(point, polygon[0])) {
            let inHole = false;
            for (let i = 1; i < polygon.length; i++) {
              if (pointInPolygon(point, polygon[i])) {
                inHole = true;
                break;
              }
            }
            if (!inHole) return true;
          }
        }
        return false;
      }
      return false;
    };

    const generateDotsInPolygon = (feature: GeoFeature, dotSpacing = 8) => {
      const dots: [number, number][] = [];
      const bounds = d3.geoBounds(feature as GeoPermissibleObjects);
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;

      const stepSize = dotSpacing * 0.1;

      for (let lng = minLng; lng <= maxLng; lng += stepSize) {
        for (let lat = minLat; lat <= maxLat; lat += stepSize) {
          const point: [number, number] = [lng, lat];
          if (pointInFeature(point, feature)) {
            dots.push(point);
          }
        }
      }
      return dots;
    };

    interface DotData {
      lng: number;
      lat: number;
    }
    const allDots: DotData[] = [];
    let landFeatures: GeoFeatureCollection;
    let animationTime = 0;

    const render = () => {
      context.clearRect(0, 0, width, height);

      // Dark background
      context.fillStyle = "#0a0a0f";
      context.fillRect(0, 0, width, height);

      if (landFeatures) {
        // Draw land outlines
        context.beginPath();
        landFeatures.features.forEach((feature) => {
          path(feature as GeoPermissibleObjects);
        });
        context.strokeStyle = "#333333";
        context.lineWidth = 0.5;
        context.stroke();

        // Draw halftone dots for land
        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat]);
          if (projected) {
            context.beginPath();
            context.arc(projected[0], projected[1], 0.6, 0, 2 * Math.PI);
            context.fillStyle = "#ffffff";
            context.globalAlpha = 0.3;
            context.fill();
          }
        });

        context.globalAlpha = 1;

        // Draw node markers with BLINKING effect
        animationTime += 0.05;
        geolocatedNodes.forEach((node, index) => {
          const projected = projection([node.lng, node.lat]);
          if (projected) {
            const blinkSpeed = 1 + Math.sin(index * 0.5) * 0.5;
            const baseOpacity = node.health.opacity;
            const blinkingOpacity =
              baseOpacity * (0.5 + Math.sin(animationTime * blinkSpeed) * 0.5);

            // Draw outer glow
            context.beginPath();
            context.arc(projected[0], projected[1], 8, 0, 2 * Math.PI);
            context.fillStyle = "#14F1C6";
            context.globalAlpha = blinkingOpacity * 0.2;
            context.fill();

            // Draw middle glow
            context.beginPath();
            context.arc(projected[0], projected[1], 5, 0, 2 * Math.PI);
            context.globalAlpha = blinkingOpacity * 0.4;
            context.fill();

            // Draw main marker
            context.beginPath();
            context.arc(projected[0], projected[1], 3, 0, 2 * Math.PI);
            context.fillStyle = "#14F1C6";
            context.globalAlpha = baseOpacity;
            context.fill();

            context.globalAlpha = 1;
          }
        });
      }
    };

    const loadWorldData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/martynafford/natural-earth-geojson/refs/heads/master/110m/physical/ne_110m_land.json"
        );
        if (!response.ok) throw new Error("Failed to load land data");

        landFeatures = await response.json();

        landFeatures.features.forEach((feature) => {
          const dots = generateDotsInPolygon(feature, 8);
          dots.forEach(([lng, lat]) => {
            allDots.push({ lng, lat });
          });
        });

        // Start animation loop
        const animate = () => {
          render();
          requestAnimationFrame(animate);
        };
        animate();
      } catch (err) {
        setError("Failed to load map data");
        console.error(err);
      }
    };

    loadWorldData();
  }, [loading, geolocatedNodes]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-space-card/50 rounded-lg p-8">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-space-card/80 backdrop-blur rounded-2xl border border-space-border overflow-hidden">
      <div className="p-6 border-b border-space-border">
        <h2 className="text-2xl font-bold text-white mb-2">
          Global Network Map
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Real-time visualization of all pNodes worldwide
          </p>
          {loading ? (
            <div className="text-sm text-neo-teal">
              Loading nodes: {progress.current} / {progress.total}
            </div>
          ) : (
            <div className="text-sm text-neo-teal">
              {geolocatedNodes.length} nodes mapped
            </div>
          )}
        </div>
      </div>

      <div className="relative bg-space-dark p-6">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-space-dark/90 z-10">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-neo-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white font-semibold">Mapping Network...</p>
              <p className="text-gray-400 text-sm mt-2">
                {progress.current} / {progress.total} nodes processed
              </p>
            </div>
          </div>
        )}
        <canvas ref={canvasRef} style={{ width, height }} className="mx-auto" />
      </div>

      {/* Stats Footer */}
      <div className="p-4 border-t border-space-border bg-space-dark/30">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-neo-teal">
              {
                geolocatedNodes.filter((n) => n.health.status === "healthy")
                  .length
              }
            </div>
            <div className="text-xs text-gray-400">Healthy</div>
          </div>
          <div>
            <div
              className="text-2xl font-bold text-neo-teal"
              style={{ opacity: 0.5 }}
            >
              {
                geolocatedNodes.filter((n) => n.health.status === "degraded")
                  .length
              }
            </div>
            <div className="text-xs text-gray-400">Degraded</div>
          </div>
          <div>
            <div
              className="text-2xl font-bold text-neo-teal"
              style={{ opacity: 0.2 }}
            >
              {
                geolocatedNodes.filter((n) => n.health.status === "offline")
                  .length
              }
            </div>
            <div className="text-xs text-gray-400">Offline</div>
          </div>
        </div>
      </div>
    </div>
  );
}
