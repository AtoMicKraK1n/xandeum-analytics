import Link from "next/link";
import { getNodeHealth } from "@/lib/network-analytics";

async function getPNodeStats(address: string) {
  const res = await fetch(
    `http://localhost:3000/api/pnodes/${encodeURIComponent(address)}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;
  return res.json();
}

async function getGeoLocation(ip: string) {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city,regionName,isp,lat,lon,org`
    );
    const data = await res.json();
    if (data.status === "success") return data;
  } catch (error) {
    console.error("Geolocation error:", error);
  }
  return null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatUptime(seconds: number): string {
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
  const stats = response?.data;

  if (!stats) {
    return (
      <div className="min-h-screen bg-space-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            pNode Not Found
          </h1>
          <Link
            href="/"
            className="text-neo-teal hover:text-neo-teal/80 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const ip = decodedAddress.split(":")[0];
  const geoData = await getGeoLocation(ip);
  const health = getNodeHealth(stats.last_updated);

  return (
    <div className="min-h-screen bg-space-dark">
      {/* Header */}
      <header className="border-b border-space-border bg-space-card/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/"
            className="text-neo-teal hover:text-neo-teal/80 text-sm mb-3 inline-flex items-center gap-2 transition-colors"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Node Details
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-gray-400 text-sm bg-space-dark px-3 py-1 rounded border border-space-border">
                  {decodedAddress}
                </code>
                <span
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold bg-neo-teal/10 border border-neo-teal/30"
                  style={{ opacity: health.opacity }}
                >
                  <span className="w-2 h-2 rounded-full bg-neo-teal"></span>
                  {health.text}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon="💾"
            label="Storage Used"
            value={formatBytes(stats.total_bytes)}
          />
          <StatCard
            icon="📊"
            label="Total Pages"
            value={stats.total_pages.toLocaleString()}
          />
          <StatCard
            icon="⚡"
            label="Active Streams"
            value={stats.active_streams.toString()}
          />
          <StatCard
            icon="⏱️"
            label="Uptime"
            value={formatUptime(stats.uptime)}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Node Information */}
          <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <span className="text-2xl">🖥️</span>
                Node Information
              </h2>
              <span className="text-xs text-neo-teal bg-neo-teal/10 px-3 py-1 rounded-full border border-neo-teal/30">
                REAL-TIME
              </span>
            </div>

            <div className="space-y-4">
              <InfoRow
                label="Gossip Address"
                value={decodedAddress}
                icon="🌐"
              />
              <InfoRow label="RPC Address" value={`${ip}:6000`} icon="🔌" />
              <InfoRow
                label="Version"
                value={stats.version || "Unknown"}
                icon="📦"
              />
              <InfoRow
                label="CPU Usage"
                value={`${stats.cpu_percent.toFixed(1)}%`}
                icon="🖥️"
              />
              <InfoRow
                label="RAM Usage"
                value={`${formatBytes(stats.ram_used)} / ${formatBytes(
                  stats.ram_total
                )}`}
                icon="💾"
              />
              <InfoRow
                label="Packets Received"
                value={`${stats.packets_received}/s`}
                icon="📥"
              />
              <InfoRow
                label="Packets Sent"
                value={`${stats.packets_sent}/s`}
                icon="📤"
              />
            </div>
          </div>

          {/* Location */}
          {geoData && (
            <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <span className="text-2xl">🌍</span>
                  Location
                </h2>
                <span className="text-xs text-neo-teal bg-neo-teal/10 px-3 py-1 rounded-full border border-neo-teal/30">
                  FROM IP
                </span>
              </div>

              <div className="space-y-4">
                <InfoRow label="Country" value={geoData.country} icon="🌐" />
                <InfoRow label="City" value={geoData.city} icon="🏙️" />
                <InfoRow label="Region" value={geoData.regionName} icon="📍" />
                <InfoRow label="ISP" value={geoData.isp} icon="🔗" />
                <InfoRow label="Organization" value={geoData.org} icon="🏢" />
                <InfoRow
                  label="Coordinates"
                  value={`${geoData.lat}, ${geoData.lon}`}
                  icon="📌"
                />
              </div>
            </div>
          )}

          {/* Storage Stats */}
          <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">💿</span>
              Storage Statistics
            </h2>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Storage Utilization</span>
                  <span>
                    {((stats.total_bytes / stats.file_size) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-space-dark rounded-full h-3 border border-space-border overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-neo-teal transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (stats.total_bytes / stats.file_size) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-space-dark/50 rounded-lg border border-space-border">
                  <div className="text-2xl font-bold text-neo-teal">
                    {formatBytes(stats.total_bytes)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Used</div>
                </div>
                <div className="text-center p-4 bg-space-dark/50 rounded-lg border border-space-border">
                  <div
                    className="text-2xl font-bold text-neo-teal"
                    style={{ opacity: 0.6 }}
                  >
                    {formatBytes(stats.file_size)}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Capacity</div>
                </div>
              </div>
            </div>
          </div>

          {/* Network Activity */}
          <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <span className="text-2xl">📶</span>
              Network Activity
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-space-dark/50 rounded-lg border border-space-border">
                  <div className="text-3xl font-bold text-neo-teal">
                    {stats.active_streams}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Active Streams
                  </div>
                </div>
                <div className="text-center p-4 bg-space-dark/50 rounded-lg border border-space-border">
                  <div
                    className="text-3xl font-bold text-neo-teal"
                    style={{ opacity: 0.8 }}
                  >
                    {stats.packets_received}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">RX/s</div>
                </div>
                <div className="text-center p-4 bg-space-dark/50 rounded-lg border border-space-border">
                  <div
                    className="text-3xl font-bold text-neo-teal"
                    style={{ opacity: 0.6 }}
                  >
                    {stats.packets_sent}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">TX/s</div>
                </div>
              </div>

              <div className="bg-space-dark/50 rounded-lg p-4 border border-space-border">
                <div className="text-sm text-gray-400 mb-2">Last Updated</div>
                <div className="text-lg font-semibold text-white">
                  {new Date(stats.last_updated * 1000).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="mt-6 bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <span className="text-2xl">📈</span>
            Performance Metrics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>CPU Usage</span>
                <span>{stats.cpu_percent.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-space-dark rounded-full h-2 border border-space-border overflow-hidden">
                <div
                  className="h-2 rounded-full bg-neo-teal transition-all"
                  style={{ width: `${Math.min(stats.cpu_percent, 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>RAM Usage</span>
                <span>
                  {((stats.ram_used / stats.ram_total) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-space-dark rounded-full h-2 border border-space-border overflow-hidden">
                <div
                  className="h-2 rounded-full bg-neo-teal transition-all"
                  style={{
                    width: `${Math.min(
                      (stats.ram_used / stats.ram_total) * 100,
                      100
                    )}%`,
                    opacity: 0.7,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Network Load</span>
                <span>Active</span>
              </div>
              <div className="w-full bg-space-dark rounded-full h-2 border border-space-border overflow-hidden">
                <div
                  className="h-2 rounded-full bg-neo-teal transition-all animate-pulse"
                  style={{ width: "65%", opacity: 0.8 }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-2">{label}</p>
          <p className="text-3xl font-bold text-neo-teal">{value}</p>
        </div>
        <div className="text-4xl opacity-60">{icon}</div>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-space-border last:border-0">
      <span className="text-gray-400 text-sm flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        {label}
      </span>
      <span className="text-white font-mono text-sm text-right break-all max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
