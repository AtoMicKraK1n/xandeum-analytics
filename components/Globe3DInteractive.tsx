"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import type { GeoPermissibleObjects } from "d3";
import { NodePopup } from "./NodePopup";

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

interface Globe3DInteractiveProps {
  pnodes: PNode[];
  width?: number;
  height?: number;
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
  version: string;
  last_seen_timestamp: number;
}

function getNodeColor(lastSeenTimestamp: number): {
  color: string;
  opacity: number;
} {
  const now = Date.now() / 1000;
  const diff = now - lastSeenTimestamp;

  if (diff < 300) return { color: "#14F1C6", opacity: 1.0 };
  if (diff < 3600) return { color: "#14F1C6", opacity: 0.5 };
  return { color: "#14F1C6", opacity: 0.2 };
}

export function Globe3DInteractive({
  pnodes,
  width = 700,
  height = 700,
}: Globe3DInteractiveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [geolocatedNodes, setGeolocatedNodes] = useState<GeolocatedPNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GeolocatedPNode | null>(
    null
  );
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const hasInitialized = useRef(false);
  const projectionRef = useRef<d3.GeoProjection | null>(null);

  useEffect(() => {
    if (pnodes.length === 0) {
      hasInitialized.current = false;
      return;
    }

    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const fetchGeolocations = async () => {
      setLoading(true);

      const publicNodes = pnodes
        .filter((node) => {
          const ip = node.address.split(":")[0];
          return (
            !ip.startsWith("192.168.") &&
            !ip.startsWith("10.") &&
            !ip.startsWith("172.16.") &&
            !ip.startsWith("172.17.") &&
            !ip.startsWith("172.18.") &&
            !ip.startsWith("172.19.") &&
            !ip.startsWith("172.20.") &&
            !ip.startsWith("172.21.") &&
            !ip.startsWith("172.22.") &&
            !ip.startsWith("172.23.") &&
            !ip.startsWith("172.24.") &&
            !ip.startsWith("172.25.") &&
            !ip.startsWith("172.26.") &&
            !ip.startsWith("172.27.") &&
            !ip.startsWith("172.28.") &&
            !ip.startsWith("172.29.") &&
            !ip.startsWith("172.30.") &&
            !ip.startsWith("172.31.") &&
            !ip.startsWith("127.")
          );
        })
        .sort((a, b) => b.last_seen_timestamp - a.last_seen_timestamp)
        .slice(0, 50);

      const geolocated: GeolocatedPNode[] = [];

      for (let i = 0; i < publicNodes.length; i += 5) {
        const batch = publicNodes.slice(i, i + 5);

        const results = await Promise.all(
          batch.map(async (node) => {
            const ip = node.address.split(":")[0];
            try {
              const res = await fetch(
                `/api/geolocation?ip=${encodeURIComponent(ip)}`
              );

              if (res.ok) {
                const data = await res.json();

                if (data.lat && data.lng) {
                  return {
                    ...node,
                    lat: data.lat,
                    lng: data.lng,
                    city: data.city,
                    country: data.country,
                  } as GeolocatedPNode;
                }
              }
            } catch (error) {
              console.error(`Failed to get location for ${ip}:`, error);
            }
            return null;
          })
        );

        const validNodes = results.filter(
          (n): n is GeolocatedPNode => n !== null
        );
        geolocated.push(...validNodes);
      }

      setGeolocatedNodes(geolocated);
      setLoading(false);
    };

    fetchGeolocations();
  }, [pnodes]);

  useEffect(() => {
    if (!canvasRef.current || loading) return;

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

    projectionRef.current = projection;

    const path = d3.geoPath().projection(projection).context(context);

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
        version: node.version,
        last_seen_timestamp: node.last_seen_timestamp,
      };
    });

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

      context.strokeStyle = "#333333";
      context.lineWidth = 1.5 * scaleFactor;
      context.stroke();

      if (landFeatures) {
        const graticule = d3.geoGraticule();
        context.beginPath();
        path(graticule());
        context.strokeStyle = "#444444";
        context.lineWidth = 0.5 * scaleFactor;
        context.globalAlpha = 0.3;
        context.stroke();
        context.globalAlpha = 1;

        context.beginPath();
        landFeatures.features.forEach((feature) => {
          path(feature as GeoPermissibleObjects);
        });
        context.strokeStyle = "#666666";
        context.lineWidth = 0.8 * scaleFactor;
        context.stroke();

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

        animationTime += 0.05;
        nodeMarkers.forEach((marker, index) => {
          const projected = projection([marker.lng, marker.lat]);
          if (projected) {
            const blinkSpeed = 1 + Math.sin(index * 0.5) * 0.5;
            const baseOpacity = marker.opacity;
            const blinkingOpacity =
              baseOpacity * (0.5 + Math.sin(animationTime * blinkSpeed) * 0.5);

            context.beginPath();
            context.arc(
              projected[0],
              projected[1],
              6 * scaleFactor,
              0,
              2 * Math.PI
            );
            context.fillStyle = marker.color;
            context.globalAlpha = blinkingOpacity * 0.3;
            context.fill();

            context.beginPath();
            context.arc(
              projected[0],
              projected[1],
              4 * scaleFactor,
              0,
              2 * Math.PI
            );
            context.globalAlpha = blinkingOpacity * 0.5;
            context.fill();

            context.beginPath();
            context.arc(
              projected[0],
              projected[1],
              2 * scaleFactor,
              0,
              2 * Math.PI
            );
            context.fillStyle = marker.color;
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

    // Click handler for markers
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if click is near any marker
      for (const node of geolocatedNodes) {
        const projected = projection([node.lng, node.lat]);
        if (projected) {
          const distance = Math.sqrt(
            Math.pow(x - projected[0], 2) + Math.pow(y - projected[1], 2)
          );

          if (distance < 10) {
            setSelectedNode(node);
            setPopupPosition({
              x: event.clientX,
              y: event.clientY,
            });
            return;
          }
        }
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("click", handleClick);

    loadWorldData();

    return () => {
      rotationTimer.stop();
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("click", handleClick);
    };
  }, [geolocatedNodes, loading, width, height]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-space-card/50 rounded-lg p-8">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        className="bg-black rounded-2xl border border-space-border overflow-hidden"
      >
        <div
          className="relative bg-black flex items-center justify-center"
          style={{ height }}
        >
          {loading ? (
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-neo-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">Loading globe...</p>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="cursor-pointer touch-none"
              style={{ width, height }}
            />
          )}
        </div>
      </div>

      {selectedNode && (
        <NodePopup
          node={selectedNode}
          position={popupPosition}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </>
  );
}
