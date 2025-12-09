"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { useMemo } from "react";
import Link from "next/link";

// Create custom colored icons
function createColoredIcon(color: string) {
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
}

interface PNode {
  address: string;
  version: string;
  pubkey: string | null;
  last_seen_timestamp: number;
  lat?: number;
  lng?: number;
  city?: string;
  country?: string;
}

interface PNodeWithLocation extends PNode {
  lat: number;
  lng: number;
  status: "online" | "recent" | "offline";
}

function getNodeStatus(
  lastSeenTimestamp: number
): "online" | "recent" | "offline" {
  const now = Date.now() / 1000;
  const diff = now - lastSeenTimestamp;

  if (diff < 300) return "online";
  if (diff < 3600) return "recent";
  return "offline";
}

function formatTimeAgo(timestamp: number) {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function MapComponent({ pnodes }: { pnodes: PNode[] }) {
  const pnodesWithLocation = useMemo(() => {
    return pnodes
      .filter((pnode) => pnode.lat && pnode.lng) // Only include nodes with valid coordinates
      .map((pnode) => ({
        ...pnode,
        lat: pnode.lat!,
        lng: pnode.lng!,
        status: getNodeStatus(pnode.last_seen_timestamp),
      })) as PNodeWithLocation[];
  }, [pnodes]);

  const getMarkerColor = (status: string) => {
    switch (status) {
      case "online":
        return "#22c55e";
      case "recent":
        return "#eab308";
      case "offline":
        return "#6b7280";
      default:
        return "#3b82f6";
    }
  };

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      className="h-full w-full"
      style={{ background: "#1f2937" }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />

      {pnodesWithLocation.map((node) => (
        <Marker
          key={node.address}
          position={[node.lat, node.lng]}
          icon={createColoredIcon(getMarkerColor(node.status))}
        >
          <Popup>
            <div className="p-2 min-w-[200px]">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getMarkerColor(node.status) }}
                />
                <span className="font-bold text-sm capitalize">
                  {node.status}
                </span>
              </div>

              <div className="space-y-1 text-xs">
                {node.city && node.country && (
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <p className="font-semibold">
                      📍 {node.city}, {node.country}
                    </p>
                  </div>
                )}

                <div>
                  <span className="text-gray-500">Address:</span>
                  <p className="font-mono font-semibold">{node.address}</p>
                </div>

                <div>
                  <span className="text-gray-500">Version:</span>
                  <p className="font-semibold">{node.version}</p>
                </div>

                {node.pubkey && (
                  <div>
                    <span className="text-gray-500">Pubkey:</span>
                    <p className="font-mono text-xs break-all">{node.pubkey}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Last seen:</span>
                  <p>{formatTimeAgo(node.last_seen_timestamp)}</p>
                </div>
              </div>

              <Link
                href={`/pnode/${encodeURIComponent(node.address)}`}
                className="block mt-3 text-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition"
              >
                View Details →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
