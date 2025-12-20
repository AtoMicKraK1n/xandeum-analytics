import Link from "next/link";
import { getNodeHealth } from "@/lib/network-analytics";
import {
  Server,
  ChartColumnBig,
  Zap,
  Timer,
  Monitor,
  Globe,
  Plug2,
  LayersPlus,
  Cpu,
  MemoryStick,
  HardDriveDownload,
  HardDriveUpload,
  MapPin,
  NotebookPen,
  Network,
  LaptopMinimalCheck,
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { getBaseURL } from "@/lib/api-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getPNodeStats(address: string) {
  const baseURL = getBaseURL();
  const res = await fetch(
    `${baseURL}/api/pnodes/${encodeURIComponent(address)}`,
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

  const ip = decodedAddress.split(":")[0];
  const port = decodedAddress.split(":")[1] || "9001";

  // If stats not available, show error state
  if (!stats) {
    return (
      <div className="min-h-screen bg-space-dark flex flex-col">
        {/* Header */}
        <header className="border-b border-space-border bg-space-card/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-4">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Node Details
              </h1>
              <code className="text-gray-400 text-xs bg-space-dark px-2 py-1 rounded border border-space-border">
                {decodedAddress}
              </code>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="max-w-2xl w-full">
            <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-neo-teal/30">
              <div className="text-center mb-4">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-16 h-16 rounded-full bg-neo-teal/10 border border-neo-teal/30 flex items-center justify-center">
                    <Server className="w-8 h-8 text-neo-teal" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Unable to Fetch Node Details
                </h2>
                <p className="text-gray-400 text-sm">
                  We couldn't retrieve statistics for this pNode
                </p>
              </div>

              <div className="bg-space-dark/50 rounded-lg p-4 border border-space-border mb-4">
                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                  <Plug2 className="w-4 h-4 text-neo-teal" />
                  Connection Details
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400 block mb-1">
                      Node Address:
                    </span>
                    <span className="text-white font-mono text-xs">
                      {decodedAddress}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">
                      IP Address:
                    </span>
                    <span className="text-white font-mono text-xs">{ip}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">
                      Gossip Port:
                    </span>
                    <span className="text-white font-mono text-xs">{port}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">RPC Port:</span>
                    <span className="text-white font-mono text-xs">6000</span>
                  </div>
                </div>
              </div>

              <div className="bg-neo-teal/5 border border-neo-teal/30 rounded-lg p-4">
                <h3 className="text-base font-semibold text-white mb-3">
                  Possible Reasons:
                </h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-neo-teal text-lg mt-0.5">•</span>
                    <div>
                      <strong className="text-white">
                        Port 6000 Not Accessible
                      </strong>
                      <p className="text-xs text-gray-400 mt-0.5">
                        The pNode's RPC port (6000) may not be publicly exposed
                        or accessible from this network
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neo-teal text-lg mt-0.5">•</span>
                    <div>
                      <strong className="text-white">Node is Offline</strong>
                      <p className="text-xs text-gray-400 mt-0.5">
                        The pNode may be temporarily offline or experiencing
                        connectivity issues
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neo-teal text-lg mt-0.5">•</span>
                    <div>
                      <strong className="text-white">
                        Firewall Configuration
                      </strong>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Firewall rules or network configuration may be blocking
                        external RPC requests
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-neo-teal text-lg mt-0.5">•</span>
                    <div>
                      <strong className="text-white">
                        RPC Server Not Running
                      </strong>
                      <p className="text-xs text-gray-400 mt-0.5">
                        The pNode software may not have the RPC server enabled
                        or running
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              <div className="mt-4 text-center">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-neo-teal text-space-dark font-bold rounded-lg hover:scale-105 transition-all text-sm"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Get geolocation
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
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Server className="w-8 h-8" />}
            label="Storage Used"
            value={formatBytes(stats.total_bytes)}
          />
          <StatCard
            icon={<ChartColumnBig className="w-8 h-8" />}
            label="Total Pages"
            value={stats.total_pages.toLocaleString()}
          />
          <StatCard
            icon={<Zap className="w-8 h-8" />}
            label="Active Streams"
            value={stats.active_streams.toString()}
          />
          <StatCard
            icon={<Timer className="w-8 h-8" />}
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
                <Monitor className="w-5 h-5 text-neo-teal" />
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
                icon={<Globe className="w-4 h-4" />}
              />
              <InfoRow
                label="RPC Address"
                value={`${ip}:6000`}
                icon={<Plug2 className="w-4 h-4" />}
              />
              <InfoRow
                label="Version"
                value={stats.version || "Unknown"}
                icon={<LayersPlus className="w-4 h-4" />}
              />
              <InfoRow
                label="CPU Usage"
                value={`${stats.cpu_percent.toFixed(1)}%`}
                icon={<Cpu className="w-4 h-4" />}
              />
              <InfoRow
                label="RAM Usage"
                value={`${formatBytes(stats.ram_used)} / ${formatBytes(
                  stats.ram_total
                )}`}
                icon={<MemoryStick className="w-4 h-4" />}
              />
              <InfoRow
                label="Packets Received"
                value={`${stats.packets_received}/s`}
                icon={<HardDriveDownload className="w-4 h-4" />}
              />
              <InfoRow
                label="Packets Sent"
                value={`${stats.packets_sent}/s`}
                icon={<HardDriveUpload className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Location */}
          {geoData ? (
            <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-neo-teal" />
                  Location
                </h2>
                <span className="text-xs text-neo-teal bg-neo-teal/10 px-3 py-1 rounded-full border border-neo-teal/30">
                  FROM IP
                </span>
              </div>

              <div className="space-y-4">
                <InfoRow
                  label="Country"
                  value={geoData.country}
                  icon={<Globe className="w-4 h-4" />}
                />
                <InfoRow
                  label="City"
                  value={geoData.city}
                  icon={<MapPin className="w-4 h-4" />}
                />
                <InfoRow
                  label="Region"
                  value={geoData.regionName}
                  icon={<MapPin className="w-4 h-4" />}
                />
                <InfoRow
                  label="ISP"
                  value={geoData.isp}
                  icon={<Network className="w-4 h-4" />}
                />
                <InfoRow
                  label="Organization"
                  value={geoData.org}
                  icon={<NotebookPen className="w-4 h-4" />}
                />
                <InfoRow
                  label="Coordinates"
                  value={`${geoData.lat}, ${geoData.lon}`}
                  icon={<MapPin className="w-4 h-4" />}
                />
              </div>
            </div>
          ) : (
            <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-neo-teal" />
                  Location
                </h2>
              </div>
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">
                  Location data unavailable (rate limit or IP lookup failed)
                </p>
              </div>
            </div>
          )}

          {/* Storage Stats */}
          <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <NotebookPen className="w-5 h-5 text-neo-teal" />
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
              <Network className="w-5 h-5 text-neo-teal" />
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
            <LaptopMinimalCheck className="w-5 h-5 text-neo-teal" />
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
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-space-card/80 backdrop-blur rounded-lg p-6 border border-space-border hover:border-neo-teal/30 transition-all hover:scale-105">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white text-md mb-2">{label}</p>
          <p className="text-3xl font-bold text-neo-teal">{value}</p>
        </div>
        <div className="text-neo-teal opacity-60">{icon}</div>
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
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-space-border last:border-0">
      <span className="text-white text-md flex items-center gap-2">
        <span className="text-neo-teal">{icon}</span>
        {label}
      </span>
      <span className="text-gray-300 font-mono text-md text-right break-all max-w-[60%]">
        {value}
      </span>
    </div>
  );
}
