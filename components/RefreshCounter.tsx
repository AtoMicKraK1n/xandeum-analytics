"use client";

import { useState, useEffect } from "react";

interface RefreshCounterProps {
  interval?: number;
  lastUpdated?: string | null;
}

export function RefreshCounter({
  interval = 60000,
  lastUpdated,
}: RefreshCounterProps) {
  const [countdown, setCountdown] = useState(interval / 1000);

  useEffect(() => {
    // Reset countdown when lastUpdated changes
    setCountdown(interval / 1000);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return interval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [interval, lastUpdated]);

  return (
    <div className="text-xs text-gray-500 mt-1">Refreshing in {countdown}s</div>
  );
}
