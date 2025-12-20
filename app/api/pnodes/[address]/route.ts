import { NextResponse } from "next/server";
import { pnodeClient } from "@/lib/pnode-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { address } = await params;

    // Decode the address (in case it has special characters)
    const decodedAddress = decodeURIComponent(address);

    console.log(`[API] Fetching stats for ${decodedAddress}`);

    const stats = await pnodeClient.getPNodeStats(decodedAddress);

    if (!stats) {
      return NextResponse.json(
        { success: false, error: "Failed to fetch pNode stats" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching pNode stats:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
