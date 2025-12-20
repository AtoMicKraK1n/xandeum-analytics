"use client";

import { useState, useEffect } from "react";
import { Globe3DInteractive } from "@/components/Globe3DInteractive";
import { PageWrapper } from "@/components/PageWrapper";

export default function NetworkMapPage() {
  const [pnodes, setPnodes] = useState<any[]>([]);
  const [totalNodes, setTotalNodes] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/pnodes", { cache: "no-store" });
        const data = await res.json();
        const allNodes = data?.data || [];

        setPnodes(allNodes);
        setTotalNodes(allNodes.length);
      } catch (error) {
        console.error("Error fetching pnodes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-space-dark">
        {/* Header */}
        <header className="border-b border-space-border bg-space-card/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Network Map</h1>
            <p className="text-gray-400 mb-4">
              Interactive globe showing global pNode distribution
            </p>

            {/* Stats */}
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-neo-teal/10 border border-neo-teal/30 rounded-lg">
                <p className="text-sm text-gray-300">
                  Showing <span className="font-bold text-neo-teal">50</span> of{" "}
                  <span className="font-bold text-neo-teal">{totalNodes}</span>{" "}
                  public nodes
                </p>
              </div>
              <div className="px-4 py-2 bg-space-card border border-space-border rounded-lg">
                <p className="text-xs text-gray-400">
                  Limited to prevent API rate limits
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div
              className="flex items-center justify-center"
              style={{ height: "700px" }}
            >
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-neo-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-white text-xl">Loading Network Map...</p>
              </div>
            </div>
          ) : (
            <>
              <Globe3DInteractive pnodes={pnodes} width={700} height={700} />

              {/* Legend */}
              <div className="mt-6 flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full bg-neo-teal"
                    style={{ opacity: 1.0 }}
                  ></div>
                  <span className="text-sm text-gray-300">Healthy</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full bg-neo-teal"
                    style={{ opacity: 0.5 }}
                  ></div>
                  <span className="text-sm text-gray-300">Degraded</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full bg-neo-teal"
                    style={{ opacity: 0.2 }}
                  ></div>
                  <span className="text-sm text-gray-300">Offline</span>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </PageWrapper>
  );
}
