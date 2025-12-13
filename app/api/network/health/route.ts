import { NextResponse } from "next/server";
import { pnodeClient } from "@/lib/pnode-client";
import { analyzeNetwork } from "@/lib/network-analytics";

export async function GET() {
  try {
    const pnodes = await pnodeClient.getAllPNodes();
    const analytics = analyzeNetwork(pnodes);

    return NextResponse.json({
      success: true,
      data: {
        score: analytics.health.score,
        totals: analytics.totals,
        health: analytics.health,
        risks: analytics.risks,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error fetching network health:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch network health" },
      { status: 500 }
    );
  }
}

export const revalidate = 30;
