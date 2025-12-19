"use client";

import { useEffect, useRef } from "react";

interface VersionData {
  version: string;
  count: number;
  percentage: string;
  isLatest: boolean;
}

interface VersionDistributionChartProps {
  versions: VersionData[];
}

export function VersionDistributionChart({
  versions,
}: VersionDistributionChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = 1200;
    const height = 400;
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
    const barWidth = (width - padding * 2) / versions.length - 20;
    const maxCount = Math.max(...versions.map((v) => v.count));

    // Draw bars
    versions.forEach((version, index) => {
      const x = padding + index * (barWidth + 20);
      const barHeight = (version.count / maxCount) * (height - 120);
      const y = height - 80 - barHeight;

      // Bar gradient
      const gradient = ctx.createLinearGradient(x, y, x, height - 80);
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
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(version.count.toString(), x + barWidth / 2, y - 10);

      // Draw version label
      ctx.fillStyle = version.isLatest ? "#14F1C6" : "#888888";
      ctx.font = version.isLatest ? "bold 14px monospace" : "12px monospace";
      ctx.fillText(version.version, x + barWidth / 2, height - 50);

      // Draw percentage
      ctx.fillStyle = "#666666";
      ctx.font = "11px sans-serif";
      ctx.fillText(`${version.percentage}%`, x + barWidth / 2, height - 30);

      // Latest indicator
      if (version.isLatest) {
        ctx.fillStyle = "#14F1C6";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("✨ LATEST", x + barWidth / 2, height - 10);
      }
    });

    // Draw baseline
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, height - 80);
    ctx.lineTo(width - padding, height - 80);
    ctx.stroke();
  }, [versions]);

  return (
    <div className="bg-space-card/80 backdrop-blur rounded-xl p-8 border border-space-border">
      <h2 className="text-2xl font-bold text-white mb-6">
        Visual Distribution Chart
      </h2>
      <div className="overflow-x-auto">
        <canvas
          ref={canvasRef}
          style={{ width: "1200px", height: "400px" }}
          className="mx-auto"
        />
      </div>
    </div>
  );
}
