"use client";

import { MapPin, SquareStack, Globe, Plug } from "lucide-react";
import { useEffect, useState } from "react";

interface NodePopupProps {
  node: {
    address: string;
    version: string;
    last_seen_timestamp: number;
    city?: string;
    country?: string;
    lat: number;
    lng: number;
  };
  position: { x: number; y: number };
  onClose: () => void;
}

function getNodeHealth(lastSeenTimestamp: number) {
  const now = Date.now() / 1000;
  const diff = now - lastSeenTimestamp;

  if (diff < 300) return { status: "Healthy", color: "#14F1C6", opacity: 1.0 };
  if (diff < 3600)
    return { status: "Degraded", color: "#14F1C6", opacity: 0.5 };
  return { status: "Offline", color: "#14F1C6", opacity: 0.2 };
}

export function NodePopup({ node, position, onClose }: NodePopupProps) {
  const health = getNodeHealth(node.last_seen_timestamp);
  const ip = node.address.split(":")[0];
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [placement, setPlacement] = useState<"top" | "bottom">("top");

  useEffect(() => {
    const popupWidth = 320;
    const popupHeight = 280; // Approximate height of popup
    const padding = 20; // Distance from edges
    const arrowOffset = 40; // Distance from click point

    let x = position.x;
    let y = position.y;
    let newPlacement: "top" | "bottom" = "top";

    // Check vertical placement
    if (position.y - popupHeight - arrowOffset < padding) {
      // Not enough space above, show below
      newPlacement = "bottom";
      y = position.y + arrowOffset;
    } else {
      // Show above
      newPlacement = "top";
      y = position.y - arrowOffset;
    }

    // Check horizontal boundaries
    const halfWidth = popupWidth / 2;
    if (x - halfWidth < padding) {
      // Too close to left edge
      x = halfWidth + padding;
    } else if (x + halfWidth > window.innerWidth - padding) {
      // Too close to right edge
      x = window.innerWidth - halfWidth - padding;
    }

    setAdjustedPosition({ x, y });
    setPlacement(newPlacement);
  }, [position]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Popup */}
      <div
        className="fixed z-50 bg-space-card/95 backdrop-blur-xl border-2 border-neo-teal/40 rounded-xl p-6 shadow-2xl shadow-neo-teal/20 animate-fade-in"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          transform:
            placement === "top"
              ? "translate(-50%, -100%)"
              : "translate(-50%, 0%)",
          minWidth: "320px",
          maxWidth: "90vw",
        }}
      >
        {/* Arrow pointer */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            [placement === "top" ? "bottom" : "top"]: "-10px",
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            [placement === "top" ? "borderTop" : "borderBottom"]:
              "10px solid rgba(20, 241, 198, 0.4)",
          }}
        />

        {/* Status Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neo-teal/20">
          <div
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
            style={{
              borderColor: health.color,
              backgroundColor: `${health.color}20`,
              opacity: health.opacity,
            }}
          >
            <svg
              className="w-3 h-3"
              style={{ color: health.color }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <span
            className="font-semibold text-lg"
            style={{ color: health.color, opacity: health.opacity }}
          >
            {health.status}
          </span>
        </div>

        {/* Node Info */}
        <div className="space-y-3">
          {/* Location */}
          {node.city && node.country && (
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-neo-teal mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-400 mb-0.5">Location</div>
                <div className="text-white font-medium truncate">
                  {node.city}, {node.country}
                </div>
              </div>
            </div>
          )}

          {/* IP Address */}
          <div className="flex items-start gap-3">
            <Plug className="w-4 h-4 text-neo-teal mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 mb-0.5">IP Address</div>
              <div className="text-white font-mono text-sm break-all">{ip}</div>
            </div>
          </div>

          {/* Version */}
          <div className="flex items-start gap-3">
            <SquareStack className="w-4 h-4 text-neo-teal mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 mb-0.5">Version</div>
              <div className="text-white font-medium">{node.version}</div>
            </div>
          </div>

          {/* Coordinates */}
          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-neo-teal mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-400 mb-0.5">Coordinates</div>
              <div className="text-white font-mono text-xs">
                {node.lat.toFixed(4)}, {node.lng.toFixed(4)}
              </div>
            </div>
          </div>
        </div>

        {/* Close hint */}
        <div className="mt-4 pt-3 border-t border-space-border">
          <p className="text-xs text-gray-500 text-center">
            Click outside to close
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
