import { NextResponse } from "next/server";
import { pnodeClient } from "@/lib/pnode-client";

export async function GET() {
  try {
    const pnodes = await pnodeClient.getAllPNodes();

    return NextResponse.json({
      success: true,
      data: pnodes,
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
