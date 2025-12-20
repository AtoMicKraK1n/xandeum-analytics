"use client";

import { useState, useEffect } from "react";
import { NetworkMap2D } from "@/components/NetworkMap2D";
import { PageWrapper } from "@/components/PageWrapper";

export default function NetworkMapPage() {
  const [pnodes, setPnodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/pnodes", { cache: "no-store" });
        const data = await res.json();
        setPnodes(data?.data || []);
      } catch (error) {
        console.error("Error fetching pnodes:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <PageWrapper>
        <div className="min-h-screen bg-space-dark flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-neo-teal border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white text-xl">Loading Network Map...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className="min-h-screen bg-space-dark">
        {/* Header */}
        <header className="border-b border-space-border bg-space-card/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">Network Map</h1>
            <p className="text-gray-400">
              Global distribution and real-time status of all pNodes
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <NetworkMap2D pnodes={pnodes} />
        </main>
      </div>
    </PageWrapper>
  );
}
