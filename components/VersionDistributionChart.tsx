"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface VersionData {
  version: string;
  count: number;
  percentage: string;
  isLatest: boolean;
}

interface VersionDistributionChartProps {
  versions: VersionData[];
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  version: string;
  count: number;
  percentage: string;
  isLatest: boolean;
}

export function VersionDistributionChart({
  versions,
}: VersionDistributionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    version: "",
    count: 0,
    percentage: "",
    isLatest: false,
  });

  const truncateVersion = (version: string, maxLength: number = 12): string => {
    if (version.length <= maxLength) return version;
    return version.substring(0, maxLength - 3) + "...";
  };

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = Math.max(1200, versions.length * 100);
    const height = 450;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate bar dimensions
    const padding = 60;
    const bottomPadding = 80;
    const barGap = 25;
    const barWidth = Math.min(
      70,
      (width - padding * 2) / versions.length - barGap
    );
    const maxCount = Math.max(...versions.map((v) => v.count));
    const chartHeight = height - bottomPadding - 60;

    // Store label positions for click detection
    const labelPositions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      version: VersionData;
      centerX: number;
      labelY: number;
    }> = [];

    // Draw bars
    versions.forEach((version, index) => {
      const x = padding + index * (barWidth + barGap);
      const barHeight = (version.count / maxCount) * chartHeight;
      const y = height - bottomPadding - barHeight;

      // Store label position for click detection
      const labelY = height - 50;
      labelPositions.push({
        x: x - 10, // Expand clickable area
        y: labelY - 10,
        width: barWidth + 20,
        height: 50, // Height of label area
        version,
        centerX: x + barWidth / 2,
        labelY: labelY,
      });

      // Bar gradient
      const gradient = ctx.createLinearGradient(
        x,
        y,
        x,
        height - bottomPadding
      );
      if (version.isLatest) {
        gradient.addColorStop(0, "#14F1C6");
        gradient.addColorStop(1, "#14F1C680");
      } else {
        gradient.addColorStop(0, "#14F1C680");
        gradient.addColorStop(1, "#14F1C620");
      }

      // Draw bar
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw bar border
      ctx.strokeStyle = version.isLatest ? "#14F1C6" : "#14F1C640";
      ctx.lineWidth = version.isLatest ? 2 : 1;
      ctx.strokeRect(x, y, barWidth, barHeight);

      // Draw count on top of bar
      ctx.fillStyle = "#14F1C6";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(version.count.toString(), x + barWidth / 2, y - 10);

      // Draw truncated version label
      const truncated = truncateVersion(version.version, 12);
      ctx.fillStyle = version.isLatest ? "#14F1C6" : "#888888";
      ctx.font = version.isLatest ? "bold 11px monospace" : "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(truncated, x + barWidth / 2, height - 50);

      // Draw percentage
      ctx.fillStyle = "#666666";
      ctx.font = "10px sans-serif";
      ctx.fillText(`${version.percentage}%`, x + barWidth / 2, height - 35);

      // Latest indicator
      if (version.isLatest) {
        ctx.fillStyle = "#14F1C6";
        ctx.font = "bold 9px sans-serif";
        ctx.fillText("✨ LATEST", x + barWidth / 2, height - 18);
      }
    });

    // Draw baseline
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding - 10, height - bottomPadding);
    ctx.lineTo(width - padding + 10, height - bottomPadding);
    ctx.stroke();

    return labelPositions;
  }, [versions]);

  useEffect(() => {
    const labelPositions = drawChart();

    const canvas = canvasRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!canvas || !scrollContainer || !labelPositions) return;

    const handleClick = (e: MouseEvent) => {
      const canvasRect = canvas.getBoundingClientRect();

      // Mouse position relative to canvas
      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;

      // Check if click is on any label
      for (const label of labelPositions) {
        if (
          mouseX >= label.x &&
          mouseX <= label.x + label.width &&
          mouseY >= label.y &&
          mouseY <= label.y + label.height
        ) {
          // Toggle tooltip - close if clicking same label
          if (tooltip.visible && tooltip.version === label.version.version) {
            setTooltip((prev) => ({ ...prev, visible: false }));
          } else {
            // Show tooltip above the label
            const scrollLeft = scrollContainer.scrollLeft;
            const screenX = canvasRect.left + label.centerX - scrollLeft;
            const screenY = canvasRect.top + label.labelY - 20;

            setTooltip({
              visible: true,
              x: screenX,
              y: screenY,
              version: label.version.version,
              count: label.version.count,
              percentage: label.version.percentage,
              isLatest: label.version.isLatest,
            });
          }
          return;
        }
      }

      // Click outside labels - close tooltip
      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    const handleMouseMove = (e: MouseEvent) => {
      const canvasRect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;

      // Change cursor when hovering over labels
      let overLabel = false;
      for (const label of labelPositions) {
        if (
          mouseX >= label.x &&
          mouseX <= label.x + label.width &&
          mouseY >= label.y &&
          mouseY <= label.y + label.height
        ) {
          overLabel = true;
          break;
        }
      }

      canvas.style.cursor = overLabel ? "pointer" : "default";
    };

    const handleScroll = () => {
      // Hide tooltip on scroll
      setTooltip((prev) => ({ ...prev, visible: false }));
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);
    scrollContainer.addEventListener("scroll", handleScroll);

    return () => {
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      scrollContainer.removeEventListener("scroll", handleScroll);
    };
  }, [drawChart, tooltip.visible, tooltip.version]);

  // Close tooltip when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const canvasRect = canvas.getBoundingClientRect();
      const clickedInside =
        e.clientX >= canvasRect.left &&
        e.clientX <= canvasRect.right &&
        e.clientY >= canvasRect.top &&
        e.clientY <= canvasRect.bottom;

      if (!clickedInside && tooltip.visible) {
        setTooltip((prev) => ({ ...prev, visible: false }));
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [tooltip.visible]);

  return (
    <div
      ref={containerRef}
      className="bg-space-card/80 backdrop-blur rounded-xl p-8 border border-space-border relative"
    >
      <h2 className="text-2xl font-bold text-white mb-6">
        Visual Distribution Chart
      </h2>
      <div ref={scrollContainerRef} className="overflow-x-auto">
        <canvas
          ref={canvasRef}
          style={{
            width: `${Math.max(1200, versions.length * 100)}px`,
            height: "450px",
            maxWidth: "100%",
          }}
          className="mx-auto"
        />
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 animate-fade-in"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="relative">
            <div className="bg-space-card/95 backdrop-blur-xl border-2 border-neo-teal/60 rounded-lg p-4 shadow-2xl shadow-neo-teal/30 min-w-[220px]">
              {tooltip.isLatest && (
                <div className="flex items-center justify-center gap-2 mb-2 pb-2 border-b border-neo-teal/30">
                  <span className="text-xs font-bold text-neo-teal">
                    ✨ LATEST VERSION
                  </span>
                </div>
              )}
              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-400 block mb-1">
                    Version:
                  </span>
                  <div
                    className="text-sm font-mono font-bold break-all"
                    style={{
                      color: tooltip.isLatest ? "#14F1C6" : "#888888",
                    }}
                  >
                    {tooltip.version}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neo-teal/20">
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">
                      Nodes:
                    </span>
                    <div className="text-xl font-bold text-neo-teal">
                      {tooltip.count}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-1">
                      Share:
                    </span>
                    <div className="text-xl font-bold text-white">
                      {tooltip.percentage}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Close hint */}
              <div className="mt-3 pt-2 border-t border-space-border">
                <p className="text-xs text-gray-500 text-center">
                  Click again to close
                </p>
              </div>
            </div>

            {/* Arrow */}
            <div
              className="absolute left-1/2 -translate-x-1/2"
              style={{
                bottom: "-8px",
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderTop: "8px solid rgba(20, 241, 198, 0.6)",
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translate(-50%, -95%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}
