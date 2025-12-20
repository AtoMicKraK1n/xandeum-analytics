"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PNodesTable } from "@/components/PNodesTable";
import { Globe3D } from "@/components/Globe3D";
import { PageWrapper } from "@/components/PageWrapper";

export default function Home() {
  const [stats, setStats] = useState<any>(null);
  const [pnodes, setPnodes] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pnodesLoading, setPnodesLoading] = useState(true);

  useEffect(() => {
    // Fetch stats and pnodes in parallel
    async function fetchData() {
      try {
        // Start both requests at the same time
        const [statsPromise, pnodesPromise] = [
          fetch("/api/network/overview", { cache: "no-store" }),
          fetch("/api/pnodes", { cache: "no-store" }),
        ];

        // Handle stats response
        statsPromise
          .then(async (statsRes) => {
            if (statsRes.ok) {
              const statsData = await statsRes.json();
              setStats(statsData?.data);
            }
            setStatsLoading(false);
          })
          .catch(() => setStatsLoading(false));

        // Handle pnodes response
        pnodesPromise
          .then(async (pnodesRes) => {
            if (pnodesRes.ok) {
              const pnodesData = await pnodesRes.json();
              setPnodes(pnodesData?.data || []);
            }
            setPnodesLoading(false);
          })
          .catch(() => setPnodesLoading(false));
      } catch (error) {
        console.error("Error fetching data:", error);
        setStatsLoading(false);
        setPnodesLoading(false);
      }
    }

    fetchData();
  }, []);

  const loading = statsLoading || pnodesLoading;

  return (
    <PageWrapper>
      <div className="min-h-screen bg-space-dark">
        <AutoRefresh interval={60000} />

        {/* Header - Shows immediately */}
        <header className="border-b border-space-border bg-space-card/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src="/logo_edited.avif"
                  alt="Xandeum Logo"
                  width={170}
                  height={170}
                  className="rounded-lg"
                  priority
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Xandeum Analytics
                </h1>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Health Score + Globe - Shows loading skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 bg-gradient-to-br from-neo-teal/5 via-neo-teal/10 to-neo-teal/5 rounded-xl p-8 border-2 border-neo-teal/30 backdrop-blur-sm hover:border-neo-teal/50 transition-all">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Network Health Score
                  </h2>
                  <p className="text-gray-300">
                    Overall network performance and reliability
                  </p>
                </div>
                <div className="text-center">
                  {statsLoading ? (
                    <div className="w-24 h-24 rounded-full border-4 border-neo-teal/20 border-t-neo-teal animate-spin"></div>
                  ) : (
                    <>
                      <div className="text-7xl font-bold text-neo-teal animate-pulse-slow">
                        {stats?.health?.score || 0}
                      </div>
                      <div className="text-xl text-gray-400 mt-2">/ 100</div>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {statsLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-space-card/60 backdrop-blur rounded-lg p-4 text-center border border-space-border animate-pulse"
                      >
                        <div className="h-8 bg-neo-teal/20 rounded mb-2"></div>
                        <div className="h-4 bg-gray-700 rounded"></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className="bg-space-card/60 backdrop-blur rounded-lg p-4 text-center border border-neo-teal/20 hover:border-neo-teal/40 transition-all">
                      <div
                        className="text-neo-teal text-3xl font-bold"
                        style={{ opacity: 1.0 }}
                      >
                        {stats?.health?.healthyPercentage?.toFixed(1) || 0}%
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        Healthy Nodes
                      </div>
                    </div>
                    <div className="bg-space-card/60 backdrop-blur rounded-lg p-4 text-center border border-neo-teal/20 hover:border-neo-teal/40 transition-all">
                      <div
                        className="text-neo-teal text-3xl font-bold"
                        style={{ opacity: 0.5 }}
                      >
                        {stats?.health?.degradedPercentage?.toFixed(1) || 0}%
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        Degraded Nodes
                      </div>
                    </div>
                    <div className="bg-space-card/60 backdrop-blur rounded-lg p-4 text-center border border-neo-teal/20 hover:border-neo-teal/40 transition-all">
                      <div
                        className="text-neo-teal text-3xl font-bold"
                        style={{ opacity: 0.2 }}
                      >
                        {stats?.health?.offlinePercentage?.toFixed(1) || 0}%
                      </div>
                      <div className="text-gray-400 text-sm mt-1">
                        Offline Nodes
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-6 border-t border-neo-teal/20">
                <div className="grid grid-cols-4 gap-6">
                  {statsLoading ? (
                    <>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="text-center animate-pulse">
                          <div className="h-12 bg-neo-teal/20 rounded mb-2"></div>
                          <div className="h-4 bg-gray-700 rounded"></div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="text-center py-12">
                        <div className="w-4 h-4 rounded-full"></div>
                        <div className="text-5xl font-bold text-neo-teal mb-2">
                          {stats?.totals?.total || 0}
                        </div>
                        <div className="text-sm text-gray-400">
                          Total pNodes
                        </div>
                      </div>
                      <div className="text-center py-12">
                        <div className="flex items-center justify-center mb-3">
                          <div
                            className="w-4 h-4 rounded-full bg-neo-teal"
                            style={{ opacity: 1.0 }}
                          ></div>
                        </div>
                        <div
                          className="text-5xl font-bold text-neo-teal mb-2"
                          style={{ opacity: 1.0 }}
                        >
                          {stats?.totals?.healthy || 0}
                        </div>
                        <div className="text-sm text-gray-400">Healthy</div>
                      </div>
                      <div className="text-center py-12">
                        <div className="flex items-center justify-center mb-3">
                          <div
                            className="w-4 h-4 rounded-full bg-neo-teal"
                            style={{ opacity: 0.5 }}
                          ></div>
                        </div>
                        <div
                          className="text-5xl font-bold text-neo-teal mb-2"
                          style={{ opacity: 0.5 }}
                        >
                          {stats?.totals?.degraded || 0}
                        </div>
                        <div className="text-sm text-gray-400">Degraded</div>
                      </div>
                      <div className="text-center py-12">
                        <div className="flex items-center justify-center mb-3">
                          <div
                            className="w-4 h-4 rounded-full bg-neo-teal"
                            style={{ opacity: 0.2 }}
                          ></div>
                        </div>
                        <div
                          className="text-5xl font-bold text-neo-teal mb-2"
                          style={{ opacity: 0.2 }}
                        >
                          {stats?.totals?.offline || 0}
                        </div>
                        <div className="text-sm text-gray-400">Offline</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              {pnodesLoading ? (
                <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border h-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-neo-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-400 text-sm">Loading globe...</p>
                  </div>
                </div>
              ) : (
                <Globe3D pnodes={pnodes} />
              )}
            </div>
          </div>

          {pnodesLoading ? (
            <div className="bg-space-card/80 backdrop-blur rounded-lg p-8 border border-space-border">
              <div className="animate-pulse">
                <div className="h-8 bg-neo-teal/20 rounded w-1/4 mb-6"></div>
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-800/50 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <PNodesTable initialPnodes={pnodes} />
          )}

          <div className="mt-8 text-center text-gray-500 text-sm">
            Last updated:{" "}
            {stats?.lastUpdated
              ? new Date(stats.lastUpdated).toLocaleString()
              : "Loading..."}
          </div>
        </main>
      </div>
    </PageWrapper>
  );
}
