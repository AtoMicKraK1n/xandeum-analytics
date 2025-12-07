import { NextResponse } from "next/server";
import { pnodeClient } from "@/lib/pnode-client";

export async function GET() {
  try {
    const pnodes = await pnodeClient.getAllPNodes();

    // Calculate network statistics
    const now = Date.now() / 1000; // Current time in seconds
    const oneHourAgo = now - 3600; // 1 hour threshold instead of 5 minutes

    const onlineNodes = pnodes.filter(
      (p) => p.last_seen_timestamp > oneHourAgo
    );

    const offlineNodes = pnodes.filter(
      (p) => p.last_seen_timestamp <= oneHourAgo
    );

    // Version distribution
    const versionCounts: Record<string, number> = {};
    pnodes.forEach((p) => {
      const version = p.version || "unknown";
      versionCounts[version] = (versionCounts[version] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      data: {
        total: pnodes.length,
        online: onlineNodes.length,
        offline: offlineNodes.length,
        versions: versionCounts,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching network stats:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch network stats" },
      { status: 500 }
    );
  }
}
