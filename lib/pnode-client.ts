import { PNodeInfo, PNodeStats, PNodeListResponse } from "@/types/pnode";
import http from "http";

// Best pNode IPs to use as entry points
const SEED_PNODES = [
  "173.212.203.145",
  "173.212.220.65",
  "161.97.97.41",
  "192.190.136.36",
  "192.190.136.37",
  "192.190.136.38",
  "192.190.136.28",
  "192.190.136.29",
  "207.244.255.1",
];

interface JsonRpcRequest {
  jsonrpc: string;
  method: string;
  id: number;
}

interface JsonRpcResponse<T> {
  jsonrpc: string;
  result: T;
  error: any;
  id: number;
}

export class PNodeClient {
  private basePort = 6000;

  private async callRpc<T>(ip: string, method: string): Promise<T | null> {
    const payload: JsonRpcRequest = {
      jsonrpc: "2.0",
      method,
      id: 1,
    };

    console.log(
      `[PNodeClient] Calling ${method} on http://${ip}:${this.basePort}/rpc`
    );

    return new Promise((resolve) => {
      const postData = JSON.stringify(payload);

      const options = {
        hostname: ip,
        port: this.basePort,
        path: "/rpc",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 10000,
      };

      const req = http.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const response: JsonRpcResponse<T> = JSON.parse(data);

            if (response.error) {
              console.error(`[PNodeClient] RPC error:`, response.error);
              resolve(null);
              return;
            }

            console.log(`[PNodeClient] ✓ Success from ${ip}`);
            resolve(response.result);
          } catch (error) {
            console.error(`[PNodeClient] Failed to parse response:`, error);
            resolve(null);
          }
        });
      });

      req.on("error", (error) => {
        console.error(`[PNodeClient] Request error for ${ip}:`, error.message);
        resolve(null);
      });

      req.on("timeout", () => {
        console.error(`[PNodeClient] Request timeout for ${ip}`);
        req.destroy();
        resolve(null);
      });

      req.write(postData);
      req.end();
    });
  }

  /**
   * Get list of all pNodes in the network by querying multiple seed nodes
   * and merging their results
   */
  async getAllPNodes(): Promise<PNodeInfo[]> {
    console.log("[PNodeClient] Starting getAllPNodes...");
    console.log("[PNodeClient] Querying ALL seed pNodes:", SEED_PNODES);

    // Query ALL seed pNodes in parallel
    const results = await Promise.all(
      SEED_PNODES.map(async (seedIp) => {
        console.log(`[PNodeClient] Fetching from ${seedIp}...`);
        const result = await this.callRpc<PNodeListResponse>(
          seedIp,
          "get-pods"
        );

        if (result && result.pods) {
          console.log(
            `[PNodeClient] ✓ Got ${result.pods.length} pNodes from ${seedIp}`
          );
          return result.pods;
        }

        console.log(`[PNodeClient] ✗ No pods from ${seedIp}`);
        return [];
      })
    );

    // Merge all results and deduplicate by address
    const allPNodes = results.flat();
    const uniquePNodes = new Map<string, PNodeInfo>();

    allPNodes.forEach((pnode) => {
      // Keep the most recent last_seen_timestamp for each address
      const existing = uniquePNodes.get(pnode.address);
      if (
        !existing ||
        pnode.last_seen_timestamp > existing.last_seen_timestamp
      ) {
        uniquePNodes.set(pnode.address, pnode);
      }
    });

    const finalList = Array.from(uniquePNodes.values());
    console.log(`[PNodeClient] ✓ Total unique pNodes: ${finalList.length}`);

    return finalList;
  }

  /**
   * Get stats for a specific pNode
   * @param address - Address like "173.212.203.145:9001"
   */
  async getPNodeStats(address: string): Promise<PNodeStats | null> {
    // Extract IP from address (remove :9001 port)
    const ip = address.split(":")[0];

    return this.callRpc<PNodeStats>(ip, "get-stats");
  }

  /**
   * Get version of a specific pNode
   */
  async getPNodeVersion(address: string): Promise<string | null> {
    const ip = address.split(":")[0];
    const result = await this.callRpc<{ version: string }>(ip, "get-version");
    return result?.version || null;
  }
}

// Export singleton instance
export const pnodeClient = new PNodeClient();
