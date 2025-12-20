import { PageWrapper } from "@/components/PageWrapper";
import { VersionDistributionChart } from "@/components/VersionDistributionChart";
import { Package, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { getBaseURL } from "@/lib/api-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getNetworkStats() {
  const baseURL = getBaseURL();
  const res = await fetch(`${baseURL}/api/network/overview`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

async function getPNodeList() {
  const baseURL = getBaseURL();
  const res = await fetch(`${baseURL}/api/pnodes`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function VersionIntelligencePage() {
  const [statsResponse, pnodesResponse] = await Promise.all([
    getNetworkStats(),
    getPNodeList(),
  ]);

  const stats = statsResponse?.data;
  const pnodes = pnodesResponse?.data || [];

  // Calculate version statistics
  const versionStats = stats?.versions?.distribution || {};
  const latestVersion = stats?.versions?.latest || "Unknown";
  const totalNodes = Object.values(versionStats).reduce(
    (a: number, b: any) => a + b,
    0
  ) as number;

  const sortedVersions = Object.entries(versionStats)
    .sort(([, a]: any, [, b]: any) => b - a)
    .map(([version, count]) => ({
      version,
      count: count as number,
      percentage: (((count as number) / totalNodes) * 100).toFixed(1),
      isLatest: version === latestVersion,
    }));

  const nodesOnLatest = sortedVersions.find((v) => v.isLatest)?.count || 0;
  const adoptionRate = ((nodesOnLatest / totalNodes) * 100).toFixed(1);

  return (
    <PageWrapper>
      <div className="min-h-screen bg-space-dark">
        {/* Header */}
        <header className="border-b border-space-border bg-space-card/80 backdrop-blur-xl">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-8 h-8 text-neo-teal" />
              <h1 className="text-3xl font-bold text-white">
                Version Intelligence
              </h1>
            </div>
            <p className="text-gray-400">
              Track pNode version distribution and adoption rates across the
              network
            </p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Latest Version */}
            <div className="bg-gradient-to-br from-neo-teal/20 to-neo-teal/5 backdrop-blur rounded-xl p-6 border-2 border-neo-teal/50 shadow-lg shadow-neo-teal/20">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-neo-teal" />
                <p className="text-sm text-gray-300">Latest Version</p>
              </div>
              <p className="text-4xl font-bold text-neo-teal mb-1">
                {latestVersion}
              </p>
              <p className="text-xs text-gray-400">Current Release</p>
            </div>

            {/* Total Versions */}
            <div className="bg-space-card/80 backdrop-blur rounded-xl p-6 border border-space-border hover:border-neo-teal/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Package
                  className="w-5 h-5 text-neo-teal"
                  style={{ opacity: 0.8 }}
                />
                <p className="text-sm text-gray-300">Active Versions</p>
              </div>
              <p
                className="text-4xl font-bold text-neo-teal"
                style={{ opacity: 0.8 }}
              >
                {sortedVersions.length}
              </p>
              <p className="text-xs text-gray-400">In Production</p>
            </div>

            {/* Adoption Rate */}
            <div className="bg-space-card/80 backdrop-blur rounded-xl p-6 border border-space-border hover:border-neo-teal/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp
                  className="w-5 h-5 text-neo-teal"
                  style={{ opacity: 0.6 }}
                />
                <p className="text-sm text-gray-300">Adoption Rate</p>
              </div>
              <p
                className="text-4xl font-bold text-neo-teal"
                style={{ opacity: 0.6 }}
              >
                {adoptionRate}%
              </p>
              <p className="text-xs text-gray-400">On Latest</p>
            </div>

            {/* Outdated Nodes */}
            <div className="bg-space-card/80 backdrop-blur rounded-xl p-6 border border-space-border hover:border-neo-teal/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle
                  className="w-5 h-5 text-neo-teal"
                  style={{ opacity: 0.4 }}
                />
                <p className="text-sm text-gray-300">Outdated Nodes</p>
              </div>
              <p
                className="text-4xl font-bold text-neo-teal"
                style={{ opacity: 0.4 }}
              >
                {totalNodes - nodesOnLatest}
              </p>
              <p className="text-xs text-gray-400">Need Update</p>
            </div>
          </div>

          {/* Version Distribution Grid */}
          <div className="bg-space-card/80 backdrop-blur rounded-xl p-8 mb-8 border border-space-border">
            <h2 className="text-2xl font-bold text-white mb-6">
              Version Distribution
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sortedVersions.map((versionData, index) => (
                <div
                  key={versionData.version}
                  className={`relative overflow-hidden rounded-xl transition-all duration-300 hover:scale-105 ${
                    versionData.isLatest
                      ? "bg-gradient-to-br from-neo-teal/30 to-neo-teal/10 border-2 border-neo-teal shadow-xl shadow-neo-teal/30"
                      : "bg-space-card/60 border border-space-border hover:border-neo-teal/40"
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="absolute top-3 right-3">
                    <div className="w-8 h-8 rounded-full bg-neo-teal/20 border border-neo-teal/40 flex items-center justify-center">
                      <span className="text-xs font-bold text-neo-teal">
                        #{index + 1}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Version Number */}
                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-1">Version</div>
                      <div className="text-2xl font-bold text-white font-mono">
                        {versionData.version}
                      </div>
                    </div>

                    {/* Node Count */}
                    <div className="mb-4">
                      <div className="text-sm text-gray-400 mb-2">Nodes</div>
                      <div className="text-5xl font-bold text-neo-teal mb-2">
                        {versionData.count}
                      </div>
                      <div className="text-sm text-gray-300">
                        {versionData.percentage}% of network
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="w-full bg-space-dark rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-neo-teal transition-all duration-500 rounded-full"
                          style={{
                            width: `${versionData.percentage}%`,
                            opacity: versionData.isLatest ? 1.0 : 0.6,
                          }}
                        />
                      </div>
                    </div>

                    {/* Latest Badge */}
                    {versionData.isLatest && (
                      <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-neo-teal/30">
                        <CheckCircle className="w-4 h-4 text-neo-teal" />
                        <span className="text-sm font-bold text-neo-teal">
                          ✨ Latest Release
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Decorative Corner */}
                  {versionData.isLatest && (
                    <div className="absolute top-0 left-0 w-20 h-20 bg-neo-teal/10 rounded-br-full" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Visual Chart Section */}
          <VersionDistributionChart versions={sortedVersions} />
        </main>
      </div>
    </PageWrapper>
  );
}
