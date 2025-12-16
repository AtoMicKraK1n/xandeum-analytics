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
                Xandeum pNode Analytics
              </h1>
              <p className="text-gray-400 mt-1">
                Real-time monitoring of the Xandeum storage network
              </p>
            </div>
            <Link
              href="/map"
              className="flex items-center gap-2 px-6 py-3 bg-neo-teal text-space-dark font-bold rounded-lg transition-all hover:scale-105 hover:shadow-lg hover:shadow-neo-teal/50"
            >
              🗺️ <span>Network Map</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Health Score + Globe Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Health Score - Takes 2 columns */}
          <div className="lg:col-span-2 bg-gradient-to-br from-neo-teal/5 via-neo-teal/10 to-neo-teal/5 rounded-xl p-8 border-2 border-neo-teal/30 backdrop-blur-sm hover:border-neo-teal/50 transition-all">
            <div className="flex items-center justify-between">
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

            {/* Health breakdown */}
            <div className="grid grid-cols-3 gap-4 mt-6">
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
          </div>

          {/* Globe - Takes 1 column */}
          <div className="lg:col-span-1">
            <Globe3D pnodes={pnodes} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total pNodes"
            value={stats?.totals?.total || 0}
            icon="🌐"
            opacity={1.0}
          />
          <StatCard
            title="Healthy"
            value={stats?.totals?.healthy || 0}
            icon="●"
            opacity={1.0}
          />
          <StatCard
            title="Degraded"
            value={stats?.totals?.degraded || 0}
            icon="●"
            opacity={0.5}
          />
          <StatCard
            title="Offline"
            value={stats?.totals?.offline || 0}
            icon="●"
            opacity={0.2}
          />
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

          {/* Outdated nodes warning */}
          {stats?.versions?.outdatedCount > 0 && (
            <div className="bg-neo-teal/10 border border-neo-teal/50 rounded-lg p-4 flex items-center gap-3 backdrop-blur">
              <span className="text-3xl">⚠️</span>
              <div>
                <p className="text-neo-teal font-semibold">
                  {stats.versions.outdatedCount} nodes running outdated versions
                </p>
                <p className="text-gray-400 text-sm">
                  {stats.versions.outdatedPercentage.toFixed(1)}% of the network
                  should upgrade to {stats.versions.latest}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Storage Metrics Widget */}
        {stats?.storage && (
          <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 mb-8 border border-space-border hover:border-neo-teal/30 transition-all">
            <h2 className="text-xl font-semibold text-white mb-4">
              Storage Overview
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-neo-teal">
                  {formatBytes(stats.storage.totalCapacity)}
                </div>
                <div className="text-sm text-gray-400 mt-1">Total Capacity</div>
              </div>

              <div className="text-center">
                <div
                  className="text-4xl font-bold text-neo-teal"
                  style={{ opacity: 0.8 }}
                >
                  {formatBytes(stats.storage.totalUsed)}
                </div>
                <div className="text-sm text-gray-400 mt-1">Used Storage</div>
              </div>

              <div className="text-center">
                <div
                  className="text-4xl font-bold text-neo-teal"
                  style={{ opacity: 0.6 }}
                >
                  {formatBytes(stats.storage.averagePerNode)}
                </div>
                <div className="text-sm text-gray-400 mt-1">Avg per Node</div>
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-neo-teal">
                  {stats.storage.utilizationPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-400 mt-1">Utilization</div>
              </div>
            </div>

            {/* Storage bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Storage Utilization</span>
                <span>{stats.storage.utilizationPercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-space-card rounded-full h-4 border border-space-border overflow-hidden">
                <div
                  className="h-4 rounded-full transition-all duration-500 bg-neo-teal"
                  style={{
                    width: `${Math.min(
                      stats.storage.utilizationPercentage,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions Banner */}
        <div className="bg-gradient-to-r from-neo-teal/10 via-neo-teal/5 to-neo-teal/10 rounded-lg p-6 mb-8 border border-neo-teal/30 backdrop-blur">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                Explore the Network
              </h3>
              <p className="text-gray-300 text-sm">
                Visualize {stats?.totals?.total || 0} pNodes across the globe
              </p>
            </div>
            <Link
              href="/map"
              className="px-8 py-3 bg-neo-teal text-space-dark font-bold rounded-lg hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-neo-teal/30"
            >
              🌍 View Interactive Map
            </Link>
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

function StatCard({
  title,
  value,
  icon,
  opacity = 1.0,
}: {
  title: string;
  value: number;
  icon: string;
  opacity?: number;
}) {
  return (
    <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p
            className="text-4xl font-bold text-neo-teal mt-2"
            style={{ opacity }}
          >
            {value}
          </p>
        </div>
        <div className="text-5xl text-neo-teal" style={{ opacity }}>
          {icon}
        </div>
      </div>
    </div>
  );
}
