interface PNode {
  address: string;
  version: string;
  pubkey: string | null;
  last_seen_timestamp: number;
}

interface PNodeStats {
  active_streams: number;
  cpu_percent: number;
  current_index: number;
  file_size: number;
  last_updated: number;
  packets_received: number;
  packets_sent: number;
  ram_total: number;
  ram_used: number;
  total_bytes: number;
  total_pages: number;
  uptime: number;
}

export type NodeHealth = "healthy" | "degraded" | "offline";

export interface NetworkAnalytics {
  totals: {
    total: number;
    healthy: number;
    degraded: number;
    offline: number;
  };
  health: {
    score: number; // 0-100
    healthyPercentage: number;
    degradedPercentage: number;
    offlinePercentage: number;
  };
  versions: {
    latest: string;
    distribution: Record<string, number>;
    outdatedCount: number;
    outdatedPercentage: number;
  };
  storage: {
    totalCapacity: number;
    totalUsed: number;
    averagePerNode: number;
    utilizationPercentage: number;
  };
  performance: {
    averageCPU: number;
    averageRAM: number;
    averageUptime: number;
  };
  risks: {
    singleVersionDominance: boolean;
    lowHealthNodes: number;
    staleNodes: number;
  };
}

export function getNodeHealth(
  lastSeenTimestamp: number,
  now?: number
): {
  status: NodeHealth;
  color: string;
  text: string;
  icon: string;
} {
  const currentTime = now || Date.now() / 1000;
  const delta = currentTime - lastSeenTimestamp;

  if (delta < 300) {
    return {
      status: "healthy",
      color: "bg-green-500",
      text: "Healthy",
      icon: "🟢",
    };
  }
  if (delta < 3600) {
    return {
      status: "degraded",
      color: "bg-yellow-500",
      text: "Degraded",
      icon: "🟡",
    };
  }
  return {
    status: "offline",
    color: "bg-red-500",
    text: "Offline",
    icon: "🔴",
  };
}

function parseVersion(version: string): number[] {
  // Handle "unknown" or invalid versions
  if (!version || version === "unknown") return [0, 0, 0];

  const parts = version.split(".").map(Number);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function compareVersions(a: string, b: string): number {
  const [aMajor, aMinor, aPatch] = parseVersion(a);
  const [bMajor, bMinor, bPatch] = parseVersion(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
}

function getLatestVersion(versions: string[]): string {
  const validVersions = versions.filter((v) => v && v !== "unknown");
  if (validVersions.length === 0) return "unknown";

  return validVersions.reduce((latest, current) => {
    return compareVersions(current, latest) > 0 ? current : latest;
  });
}

export function analyzeNetwork(
  pnodes: PNode[],
  pnodeStats?: Map<string, PNodeStats>
): NetworkAnalytics {
  const now = Date.now() / 1000;

  // Health analysis
  const healthCounts = { healthy: 0, degraded: 0, offline: 0 };
  pnodes.forEach((node) => {
    const health = getNodeHealth(node.last_seen_timestamp, now);
    healthCounts[health.status]++;
  });

  // Version analysis
  const versionDistribution: Record<string, number> = {};
  pnodes.forEach((node) => {
    const version = node.version || "unknown";
    versionDistribution[version] = (versionDistribution[version] || 0) + 1;
  });

  const latestVersion = getLatestVersion(Object.keys(versionDistribution));
  const outdatedNodes = pnodes.filter(
    (node) => node.version !== latestVersion && node.version !== "unknown"
  );

  // Storage analysis (from pNode stats if available)
  let totalCapacity = 0;
  let totalUsed = 0;
  let validStatsCount = 0;

  if (pnodeStats) {
    pnodeStats.forEach((stats) => {
      totalCapacity += stats.file_size;
      totalUsed += stats.total_bytes;
      validStatsCount++;
    });
  }

  // Performance analysis
  let totalCPU = 0;
  let totalRAM = 0;
  let totalUptime = 0;
  let perfCount = 0;

  if (pnodeStats) {
    pnodeStats.forEach((stats) => {
      totalCPU += stats.cpu_percent;
      totalRAM += (stats.ram_used / stats.ram_total) * 100;
      totalUptime += stats.uptime;
      perfCount++;
    });
  }

  // Calculate health score (0-100)
  const healthScore = Math.round(
    (healthCounts.healthy / pnodes.length) * 60 + // 60% weight on healthy nodes
      (1 - outdatedNodes.length / pnodes.length) * 30 + // 30% weight on up-to-date versions
      (healthCounts.degraded / pnodes.length) * 10 // 10% for degraded (partial credit)
  );

  // Risk analysis
  const dominantVersion = Object.entries(versionDistribution).reduce((a, b) =>
    a[1] > b[1] ? a : b
  );
  const singleVersionDominance = dominantVersion[1] / pnodes.length > 0.8;

  return {
    totals: {
      total: pnodes.length,
      healthy: healthCounts.healthy,
      degraded: healthCounts.degraded,
      offline: healthCounts.offline,
    },
    health: {
      score: healthScore,
      healthyPercentage: (healthCounts.healthy / pnodes.length) * 100,
      degradedPercentage: (healthCounts.degraded / pnodes.length) * 100,
      offlinePercentage: (healthCounts.offline / pnodes.length) * 100,
    },
    versions: {
      latest: latestVersion,
      distribution: versionDistribution,
      outdatedCount: outdatedNodes.length,
      outdatedPercentage: (outdatedNodes.length / pnodes.length) * 100,
    },
    storage: {
      totalCapacity,
      totalUsed,
      averagePerNode: validStatsCount > 0 ? totalCapacity / validStatsCount : 0,
      utilizationPercentage:
        totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0,
    },
    performance: {
      averageCPU: perfCount > 0 ? totalCPU / perfCount : 0,
      averageRAM: perfCount > 0 ? totalRAM / perfCount : 0,
      averageUptime: perfCount > 0 ? totalUptime / perfCount : 0,
    },
    risks: {
      singleVersionDominance,
      lowHealthNodes: healthCounts.degraded + healthCounts.offline,
      staleNodes: healthCounts.offline,
    },
  };
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.join(" ") || "0m";
}
