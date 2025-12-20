import { NextResponse } from "next/server";
import { pnodeClient } from "@/lib/pnode-client";
import { analyzeNetwork } from "@/lib/network-analytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pnodes = await pnodeClient.getAllPNodes();
    const analytics = analyzeNetwork(pnodes);

    return NextResponse.json({
      success: true,
      data: {
        ...analytics,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error analyzing network:", error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze network" },
      { status: 500 }
    );
  }
}

export const revalidate = 30; // Cache for 30 seconds
