"use client";

import { useEffect } from "react";

interface AutoRefreshProps {
  interval?: number;
  onRefresh?: () => void;
}

export function AutoRefresh({ interval = 60000, onRefresh }: AutoRefreshProps) {
  useEffect(() => {
    const timer = setInterval(() => {
      if (onRefresh) {
        onRefresh();
      } else {
        // Fallback: reload the page
        window.location.reload();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [interval, onRefresh]);

  return null;
}
