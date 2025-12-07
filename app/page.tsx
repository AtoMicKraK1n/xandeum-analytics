import Link from "next/link";

function getNodeStatus(lastSeenTimestamp: number) {
  const now = Date.now() / 1000;
  const diff = now - lastSeenTimestamp;

  if (diff < 300)
    return { status: "online", color: "bg-green-500", text: "Online" }; // < 5 min
  if (diff < 3600)
    return { status: "recent", color: "bg-yellow-500", text: "Recent" }; // < 1 hour
  return { status: "offline", color: "bg-gray-500", text: "Offline" }; // > 1 hour
}

function formatTimeAgo(timestamp: number) {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

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
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">
            Xandeum pNode Analytics
          </h1>
          <p className="text-gray-400 mt-1">
            Real-time monitoring of the Xandeum storage network
          </p>
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

        {/* pNodes Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">
              All pNodes ({pnodes.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Pubkey
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Last Seen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {pnodes.map((pnode: any) => {
                  const nodeStatus = getNodeStatus(pnode.last_seen_timestamp);
                  return (
                    <tr key={pnode.address} className="hover:bg-gray-750">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${nodeStatus.color}`}
                          />
                          <span className="text-xs text-gray-400">
                            {nodeStatus.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400">
                        {pnode.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                          {pnode.version}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                        {pnode.pubkey
                          ? `${pnode.pubkey.slice(0, 8)}...${pnode.pubkey.slice(
                              -8
                            )}`
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {formatTimeAgo(pnode.last_seen_timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/pnode/${encodeURIComponent(pnode.address)}`}
                          className="text-blue-400 hover:text-blue-300 transition"
                        >
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

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
