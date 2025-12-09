import Link from "next/link";
import { AutoRefresh } from "@/components/AutoRefresh";
import { PNodesTable } from "@/components/PNodesTable";

async function getNetworkStats() {
  const res = await fetch("http://localhost:3000/api/pnodes/network-stats", {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function getPNodeList() {
  const res = await fetch("http://localhost:3000/api/pnodes/list", {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function Home() {
  const [statsResponse, pnodesResponse] = await Promise.all([
    getNetworkStats(),
    getPNodeList(),
  ]);

  const stats = statsResponse?.data;
  const pnodes = pnodesResponse?.data || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <AutoRefresh interval={60000} />

      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur">
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
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all hover:scale-105"
            >
              🗺️ <span>Network Map</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total pNodes" value={stats?.total || 0} icon="🌐" />
          <StatCard
            title="Online"
            value={stats?.online || 0}
            icon="✅"
            color="text-green-400"
          />
          <StatCard
            title="Offline"
            value={stats?.offline || 0}
            icon="⚠️"
            color="text-yellow-400"
          />
          <StatCard
            title="Versions"
            value={Object.keys(stats?.versions || {}).length}
            icon="📦"
          />
        </div>

        {/* Quick Actions Banner */}
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-6 mb-8 border border-blue-700/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-1">
                Explore the Network
              </h3>
              <p className="text-gray-300 text-sm">
                Visualize {stats?.total || 0} pNodes across the globe
              </p>
            </div>
            <Link
              href="/map"
              className="px-8 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-all hover:scale-105 flex items-center gap-2"
            >
              🌍 View Interactive Map
            </Link>
          </div>
        </div>

        {/* Version Distribution */}
        {stats?.versions && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Version Distribution
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(stats.versions).map(([version, count]) => (
                <div key={version} className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {count as number}
                  </div>
                  <div className="text-sm text-gray-400">{version}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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
  color = "text-blue-400",
}: {
  title: string;
  value: number;
  icon: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-3xl font-bold ${color} mt-2`}>{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
