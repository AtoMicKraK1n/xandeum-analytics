import Link from "next/link";
import { notFound } from "next/navigation";

async function getPNodeStats(address: string) {
  try {
    const res = await fetch(
      `http://localhost:3000/api/pnodes/${encodeURIComponent(address)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    return null;
  }
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0m";
}

export default async function PNodeDetailPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  const decodedAddress = decodeURIComponent(address);

  const response = await getPNodeStats(decodedAddress);

  if (!response || !response.success) {
    // pNode might not have RPC accessible, show limited info
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur">
          <div className="container mx-auto px-4 py-6">
            <Link
              href="/"
              className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">pNode Details</h1>
            <p className="text-gray-400 mt-1 font-mono">{decodedAddress}</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">
              ⚠️ RPC Not Accessible
            </h2>
            <p className="text-gray-300">
              This pNode's RPC port (6000) is not publicly accessible. The node
              may be:
            </p>
            <ul className="list-disc list-inside text-gray-400 mt-2 space-y-1">
              <li>Behind a firewall</li>
              <li>Only allowing localhost connections</li>
              <li>Temporarily offline</li>
            </ul>
            <p className="text-gray-400 mt-4">
              The node is still visible in the gossip network (port 9001) but
              detailed stats are unavailable.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const stats = response.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 text-sm mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">pNode Details</h1>
          <p className="text-gray-400 mt-1 font-mono">{decodedAddress}</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="CPU Usage"
            value={`${stats.cpu_percent.toFixed(2)}%`}
            icon="🔥"
            color={stats.cpu_percent > 80 ? "text-red-400" : "text-green-400"}
          />
          <MetricCard
            title="RAM Usage"
            value={`${((stats.ram_used / stats.ram_total) * 100).toFixed(1)}%`}
            subtitle={`${formatBytes(stats.ram_used)} / ${formatBytes(
              stats.ram_total
            )}`}
            icon="💾"
          />
          <MetricCard
            title="Uptime"
            value={formatUptime(stats.uptime)}
            icon="⏱️"
            color="text-blue-400"
          />
          <MetricCard
            title="Active Streams"
            value={stats.active_streams.toString()}
            icon="🌊"
            color="text-purple-400"
          />
        </div>

        {/* Network Activity */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Network Activity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">Packets Received</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.packets_received.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Packets Sent</p>
              <p className="text-2xl font-bold text-blue-400">
                {stats.packets_sent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Storage Information */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Storage Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-400 mb-1">File Size</p>
              <p className="text-2xl font-bold text-white">
                {formatBytes(stats.file_size)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Bytes</p>
              <p className="text-2xl font-bold text-white">
                {stats.total_bytes.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Pages</p>
              <p className="text-2xl font-bold text-white">
                {stats.total_pages.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold text-white mb-4">
            Additional Information
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Current Index</span>
              <span className="text-white font-mono">
                {stats.current_index}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-400">Last Updated</span>
              <span className="text-white">
                {new Date(stats.last_updated * 1000).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">RPC Endpoint</span>
              <span className="text-white font-mono">
                {decodedAddress.split(":")[0]}:6000/rpc
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          Data refreshed on page load
        </div>
      </main>
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = "text-blue-400",
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <p className="text-gray-400 text-sm">{title}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}
