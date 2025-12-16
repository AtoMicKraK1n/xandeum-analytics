"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { GeoPermissibleObjects } from "d3";

interface PNode {
  address: string;
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

interface Globe3DProps {
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

interface NodeMarker {
  lng: number;
  lat: number;
  color: string;
  opacity: number;
  city?: string;
  country?: string;
  address: string;
}

function getNodeColor(lastSeenTimestamp: number): {
  color: string;
  opacity: number;
} {
  const now = Date.now() / 1000;
  const diff = now - lastSeenTimestamp;

  if (diff < 300) return { color: "#14F1C6", opacity: 1.0 }; // healthy
  if (diff < 3600) return { color: "#14F1C6", opacity: 0.5 }; // degraded
  return { color: "#14F1C6", opacity: 0.2 }; // offline
}

export function Globe3D({ pnodes }: Globe3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [geolocatedNodes, setGeolocatedNodes] = useState<GeolocatedPNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCount, setActiveCount] = useState(0);

  const width = 500;
  const height = 500;

  // Fetch geolocation for nodes
  useEffect(() => {
    const fetchGeolocations = async () => {
      setLoading(true);
      const sortedNodes = [...pnodes]
        .sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp)
        .slice(0, 40);

      const geolocated: GeolocatedPNode[] = [];

      for (let i = 0; i < sortedNodes.length; i += 10) {
        const batch = sortedNodes.slice(i, i + 10);

        const results = await Promise.all(
          batch.map(async (node) => {
            const ip = node.address.split(":")[0];
            try {
              const res = await fetch(
                `http://ip-api.com/json/${ip}?fields=status,lat,lon,city,country`
              );
              const data = await res.json();

              if (data.status === "success" && data.lat && data.lon) {
                return {
                  ...node,
                  lat: data.lat,
                  lng: data.lon,
                  city: data.city,
                  country: data.country,
                } as GeolocatedPNode;
              }
            } catch (error) {
              console.error("Geolocation error:", error);
            }
            return null;
          })
        );

        const validNodes = results.filter(
          (n): n is GeolocatedPNode => n !== null
        );
        geolocated.push(...validNodes);
        setGeolocatedNodes([...geolocated]);

        if (i + 10 < sortedNodes.length) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      const active = geolocated.filter((n) => {
        const diff = Date.now() / 1000 - n.last_seen_timestamp;
        return diff < 300;
      }).length;

      setActiveCount(active);
      setLoading(false);
    };

    fetchGeolocations();
  }, [pnodes]);

  // D3.js Globe Setup
  useEffect(() => {
    if (!canvasRef.current || geolocatedNodes.length === 0) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const containerWidth = width;
    const containerHeight = height;
    const radius = Math.min(containerWidth, containerHeight) / 2.2;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = `${containerWidth}px`;
    canvas.style.height = `${containerHeight}px`;
    context.scale(dpr, dpr);

    const projection = d3
      .geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90)
      .rotate([0, -20]);

    const path = d3.geoPath().projection(projection).context(context);

    // Convert pNodes to markers
    // Convert pNodes to markers
    const nodeMarkers: NodeMarker[] = geolocatedNodes.map((node) => {
      const nodeColor = getNodeColor(node.last_seen_timestamp);
      return {
        lng: node.lng,
        lat: node.lat,
        color: nodeColor.color,
        opacity: nodeColor.opacity,
        city: node.city,
        country: node.country,
        address: node.address,
      };
    });

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

    const generateDotsInPolygon = (feature: GeoFeature, dotSpacing = 16) => {
      const dots: [number, number][] = [];
      const bounds = d3.geoBounds(feature as GeoPermissibleObjects);
      const [[minLng, minLat], [maxLng, maxLat]] = bounds;

      const stepSize = dotSpacing * 0.15;

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
      context.clearRect(0, 0, containerWidth, containerHeight);

      const currentScale = projection.scale();
      const scaleFactor = currentScale / radius;

      // Draw globe background
      context.beginPath();
      context.arc(
        containerWidth / 2,
        containerHeight / 2,
        currentScale,
        0,
        2 * Math.PI
      );
      context.fillStyle = "#000000";
      context.fill();

      // Globe outline
      context.strokeStyle = "#333333";
      context.lineWidth = 1.5 * scaleFactor;
      context.stroke();

      if (landFeatures) {
        // Draw graticule
        const graticule = d3.geoGraticule();
        context.beginPath();
        path(graticule());
        context.strokeStyle = "#444444";
        context.lineWidth = 0.5 * scaleFactor;
        context.globalAlpha = 0.3;
        context.stroke();
        context.globalAlpha = 1;

        // Draw land outlines
        context.beginPath();
        landFeatures.features.forEach((feature) => {
          path(feature as GeoPermissibleObjects);
        });
        context.strokeStyle = "#666666";
        context.lineWidth = 0.8 * scaleFactor;
        context.stroke();

        // Draw halftone dots for land
        allDots.forEach((dot) => {
          const projected = projection([dot.lng, dot.lat]);
          if (projected) {
            context.beginPath();
            context.arc(
              projected[0],
              projected[1],
              0.8 * scaleFactor,
              0,
              2 * Math.PI
            );
            context.fillStyle = "#ffffff";
            context.fill();
          }
        });

        // Draw node markers with BLINKING effect
        animationTime += 0.05;
        nodeMarkers.forEach((marker, index) => {
          const projected = projection([marker.lng, marker.lat]);
          if (projected) {
            // Calculate blinking opacity
            const blinkSpeed = 1 + Math.sin(index * 0.5) * 0.5;
            const opacity = 0.5 + Math.sin(animationTime * blinkSpeed) * 0.5;

            // Draw outer glow
            context.beginPath();
            context.arc(
              projected[0],
              projected[1],
              6 * scaleFactor,
              0,
              2 * Math.PI
            );
            context.fillStyle = marker.color;
            context.globalAlpha = opacity * 0.3;
            context.fill();

            // Draw middle glow
            context.beginPath();
            context.arc(
              projected[0],
              projected[1],
              4 * scaleFactor,
              0,
              2 * Math.PI
            );
            context.globalAlpha = opacity * 0.5;
            context.fill();

            // Draw main marker (brighter)
            context.beginPath();
            context.arc(
              projected[0],
              projected[1],
              2 * scaleFactor,
              0,
              2 * Math.PI
            );
            context.fillStyle = marker.color;
            context.globalAlpha = 1;
            context.fill();

            // Reset alpha
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
          const dots = generateDotsInPolygon(feature, 12);
          dots.forEach(([lng, lat]) => {
            allDots.push({ lng, lat });
          });
        });

        render();
      } catch (err) {
        setError("Failed to load map data");
        console.error(err);
      }
    };

    // Rotation logic
    const rotation: [number, number] = [0, -20];
    let autoRotate = true;
    const rotationSpeed = 0.3;

    const rotate = () => {
      if (autoRotate) {
        rotation[0] += rotationSpeed;
        projection.rotate(rotation as [number, number]);
        render();
      }
    };

    const rotationTimer = d3.timer(rotate);

    // Mouse interaction
    const handleMouseDown = (event: MouseEvent) => {
      autoRotate = false;
      const startX = event.clientX;
      const startY = event.clientY;
      const startRotation = [...rotation];

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const sensitivity = 0.25;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        rotation[0] = startRotation[0] + dx * sensitivity;
        rotation[1] = Math.max(
          -90,
          Math.min(90, startRotation[1] - dy * sensitivity)
        );

        projection.rotate(rotation as [number, number]);
        render();
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        setTimeout(() => {
          autoRotate = true;
        }, 1000);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    canvas.addEventListener("mousedown", handleMouseDown);

    loadWorldData();

    return () => {
      rotationTimer.stop();
      canvas.removeEventListener("mousedown", handleMouseDown);
    };
  }, [geolocatedNodes]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-cyber-card/50 rounded-lg p-8">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-black rounded-lg border border-cyber-border overflow-hidden">
      <div className="p-4 border-b border-cyber-border">
        <h3 className="text-lg font-semibold text-white">Nodes Distribution</h3>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-cyber-mint animate-pulse"></div>
          <span className="text-sm text-gray-300">{`Active Nodes`}</span>
        </div>
      </div>
      <div
        className="relative bg-black flex items-center justify-center"
        style={{ height: "500px" }}
      >
        <canvas
          ref={canvasRef}
          className="cursor-move touch-none"
          style={{ width, height }}
        />
      </div>{" "}
    </div>
  );
}
