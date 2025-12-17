import { NextResponse } from "next/server";
import { pnodeClient } from "@/lib/pnode-client";
import type { PNodeInfo, PNodeStats } from "@/types/pnode";

// Combined type for frontend
export interface EnrichedPNodeInfo extends PNodeInfo {
  total_bytes?: number;
  total_pages?: number;
  uptime?: number;
  cpu_percent?: number;
  ram_used?: number;
  ram_total?: number;
  active_streams?: number;
  packets_received?: number;
  packets_sent?: number;
  file_size?: number;
}

export async function GET() {
  try {
    const pnodes = await pnodeClient.getAllPNodes();

    // Enrich the first few nodes with stats
    const enrichedPNodes: EnrichedPNodeInfo[] = await Promise.all(
      pnodes.slice(0, 50).map(async (pnode) => {
        try {
          const stats = await pnodeClient.getPNodeStats(pnode.address);

          if (stats) {
            return {
              ...pnode,
              total_bytes: stats.total_bytes,
              total_pages: stats.total_pages,
              uptime: stats.uptime,
              cpu_percent: stats.cpu_percent,
              ram_used: stats.ram_used,
              ram_total: stats.ram_total,
              active_streams: stats.active_streams,
              packets_received: stats.packets_received,
              packets_sent: stats.packets_sent,
              file_size: stats.file_size,
            };
          }
        } catch (error) {
          console.error(`Failed to get stats for ${pnode.address}:`, error);
        }

        return pnode;
      })
    );

    // Add remaining nodes without stats
    const remainingNodes = pnodes.slice(50);

    return NextResponse.json({
      success: true,
      data: [...enrichedPNodes, ...remainingNodes],
      total: pnodes.length,
    });
  } catch (error) {
    console.error("Error fetching pNodes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch pNodes" },
      { status: 500 }
    );
  }
}

export const revalidate = 30; // Cache for 30 seconds
