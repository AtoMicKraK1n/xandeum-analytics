import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PNodesTable } from "@/components/PNodesTable";
import { Globe3D } from "@/components/Globe3D";

async function getNetworkStats() {
  const res = await fetch("http://localhost:3000/api/network/overview", {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function getPNodeList() {
  const res = await fetch("http://localhost:3000/api/pnodes", {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export default async function Home() {
  const [statsResponse, pnodesResponse] = await Promise.all([
    getNetworkStats(),
    getPNodeList(),
  ]);

  const stats = statsResponse?.data;
  const pnodes = pnodesResponse?.data || [];

  return (
    <div className="min-h-screen bg-space-dark">
      <AutoRefresh interval={60000} />

      {/* Header */}
      <header className="border-b border-space-border bg-space-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Xandeum Analytics
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Health Score + Globe Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Health Score - Takes 2 columns */}
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
                <div className="text-7xl font-bold text-neo-teal animate-pulse-slow">
                  {stats?.health?.score || 0}
                </div>
                <div className="text-xl text-gray-400 mt-2">/ 100</div>
              </div>
            </div>

            {/* Health breakdown percentages */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-space-card/60 backdrop-blur rounded-lg p-4 text-center border border-neo-teal/20 hover:border-neo-teal/40 transition-all">
                <div
                  className="text-neo-teal text-3xl font-bold"
                  style={{ opacity: 1.0 }}
                >
                  {stats?.health?.healthyPercentage?.toFixed(1) || 0}%
                </div>
                <div className="text-gray-400 text-sm mt-1">Healthy Nodes</div>
              </div>
              <div className="bg-space-card/60 backdrop-blur rounded-lg p-4 text-center border border-neo-teal/20 hover:border-neo-teal/40 transition-all">
                <div
                  className="text-neo-teal text-3xl font-bold"
                  style={{ opacity: 0.5 }}
                >
                  {stats?.health?.degradedPercentage?.toFixed(1) || 0}%
                </div>
                <div className="text-gray-400 text-sm mt-1">Degraded Nodes</div>
              </div>
              <div className="bg-space-card/60 backdrop-blur rounded-lg p-4 text-center border border-neo-teal/20 hover:border-neo-teal/40 transition-all">
                <div
                  className="text-neo-teal text-3xl font-bold"
                  style={{ opacity: 0.2 }}
                >
                  {stats?.health?.offlinePercentage?.toFixed(1) || 0}%
                </div>
                <div className="text-gray-400 text-sm mt-1">Offline Nodes</div>
              </div>
            </div>

            {/* Node counts - NEW SECTION */}
            <div className="grid grid-cols-4 gap-4 pt-6 border-t border-neo-teal/20">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="text-3xl">🌐</div>
                </div>
                <div className="text-3xl font-bold text-neo-teal">
                  {stats?.totals?.total || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">Total pNodes</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full bg-neo-teal"
                    style={{ opacity: 1.0 }}
                  ></div>
                </div>
                <div
                  className="text-3xl font-bold text-neo-teal"
                  style={{ opacity: 1.0 }}
                >
                  {stats?.totals?.healthy || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">Healthy</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full bg-neo-teal"
                    style={{ opacity: 0.5 }}
                  ></div>
                </div>
                <div
                  className="text-3xl font-bold text-neo-teal"
                  style={{ opacity: 0.5 }}
                >
                  {stats?.totals?.degraded || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">Degraded</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full bg-neo-teal"
                    style={{ opacity: 0.2 }}
                  ></div>
                </div>
                <div
                  className="text-3xl font-bold text-neo-teal"
                  style={{ opacity: 0.2 }}
                >
                  {stats?.totals?.offline || 0}
                </div>
                <div className="text-xs text-gray-400 mt-1">Offline</div>
              </div>
            </div>
          </div>

          {/* Globe - Takes 1 column */}
          <div className="lg:col-span-1">
            <Globe3D pnodes={pnodes} />
          </div>
        </div>

        {/* Version Intelligence Widget */}
        <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 mb-8 border border-space-border hover:border-neo-teal/30 transition-all">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Version Intelligence
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Latest:</span>
              <span className="px-3 py-1 bg-neo-teal text-space-dark rounded-lg font-semibold">
                {stats?.versions?.latest || "N/A"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {stats?.versions?.distribution &&
              Object.entries(stats.versions.distribution).map(
                ([version, count]) => (
                  <div
                    key={version}
                    className={`text-center p-4 rounded-lg backdrop-blur transition-all ${
                      version === stats.versions.latest
                        ? "bg-neo-teal/20 border-2 border-neo-teal shadow-lg shadow-neo-teal/20"
                        : "bg-space-card/40 border border-space-border hover:border-neo-teal/30"
                    }`}
                  >
                    <div className="text-3xl font-bold text-neo-teal">
                      {count as number}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">{version}</div>
                    {version === stats.versions.latest && (
                      <div className="text-xs text-neo-teal mt-1 font-semibold">
                        ✨ Latest
                      </div>
                    )}
                  </div>
                )
              )}
          </div>
        </div>

        {/* pNodes Table with Filters */}
        <PNodesTable initialPnodes={pnodes} />

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          Last updated:{" "}
          {stats?.lastUpdated
            ? new Date(stats.lastUpdated).toLocaleString()
            : "Never"}
        </div>
      </main>
    </div>
  );
}
