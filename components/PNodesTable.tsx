"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { getNodeHealth } from "@/lib/network-analytics";

interface PNode {
  address: string;
  version: string;
  last_seen_timestamp: number;
  total_bytes?: number;
  uptime?: number;
  cpu_percent?: number;
  ram_used?: number;
  ram_total?: number;
}

interface PNodesTableProps {
  initialPnodes: PNode[];
}

type SortField = "address" | "version" | "last_seen";
type SortOrder = "asc" | "desc";

export function PNodesTable({ initialPnodes }: PNodesTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [healthFilter, setHealthFilter] = useState<
    "all" | "healthy" | "degraded" | "offline"
  >("all");
  const [sortField, setSortField] = useState<SortField>("last_seen");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const filteredAndSortedPnodes = useMemo(() => {
    let filtered = initialPnodes.filter((pnode) => {
      const matchesSearch =
        pnode.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pnode.version?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (healthFilter === "all") return true;

      const health = getNodeHealth(pnode.last_seen_timestamp);
      return health.status === healthFilter;
    });

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "address":
          aValue = a.address;
          bValue = b.address;
          break;
        case "version":
          aValue = a.version || "";
          bValue = b.version || "";
          break;
        case "last_seen":
          aValue = a.last_seen_timestamp;
          bValue = b.last_seen_timestamp;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [initialPnodes, searchTerm, healthFilter, sortField, sortOrder]);

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div className="bg-space-card/80 backdrop-blur rounded-lg border border-space-border">
      {/* Header */}
      <div className="p-6 border-b border-space-border">
        <h2 className="text-2xl font-bold text-white mb-4">pNodes Overview</h2>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by address or version..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-space-dark border border-space-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neo-teal transition-colors"
            />
          </div>

          {/* Health Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setHealthFilter("all")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                healthFilter === "all"
                  ? "bg-neo-teal text-space-dark"
                  : "bg-space-dark text-gray-400 border border-space-border hover:border-neo-teal/50"
              }`}
            >
              All ({initialPnodes.length})
            </button>
            <button
              onClick={() => setHealthFilter("healthy")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                healthFilter === "healthy"
                  ? "bg-neo-teal text-space-dark"
                  : "bg-space-dark text-gray-400 border border-space-border hover:border-neo-teal/50"
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full bg-neo-teal mr-2"
                style={{ opacity: 1.0 }}
              ></span>
              Healthy
            </button>
            <button
              onClick={() => setHealthFilter("degraded")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                healthFilter === "degraded"
                  ? "bg-neo-teal text-space-dark"
                  : "bg-space-dark text-gray-400 border border-space-border hover:border-neo-teal/50"
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full bg-neo-teal mr-2"
                style={{ opacity: 0.5 }}
              ></span>
              Degraded
            </button>
            <button
              onClick={() => setHealthFilter("offline")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                healthFilter === "offline"
                  ? "bg-neo-teal text-space-dark"
                  : "bg-space-dark text-gray-400 border border-space-border hover:border-neo-teal/50"
              }`}
            >
              <span
                className="inline-block w-2 h-2 rounded-full bg-neo-teal mr-2"
                style={{ opacity: 0.2 }}
              ></span>
              Offline
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-space-dark/50 border-b border-space-border">
            <tr>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort("address")}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-neo-teal transition-colors"
                >
                  Status & Address
                  {sortField === "address" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort("version")}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-neo-teal transition-colors"
                >
                  Version
                  {sortField === "version" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-left">
                <button
                  onClick={() => handleSort("last_seen")}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-neo-teal transition-colors"
                >
                  Last Seen
                  {sortField === "last_seen" && (
                    <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                  )}
                </button>
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-space-border">
            {filteredAndSortedPnodes.map((pnode) => {
              const health = getNodeHealth(pnode.last_seen_timestamp);
              return (
                <tr
                  key={pnode.address}
                  className="hover:bg-space-dark/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full bg-neo-teal"
                        style={{ opacity: health.opacity }}
                        title={health.text}
                      />
                      <div>
                        <div className="text-sm font-mono text-white">
                          {pnode.address}
                        </div>
                        <div className="text-xs text-gray-500">
                          {health.text}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-300 font-mono">
                      {pnode.version || "Unknown"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-400">
                      {formatTimestamp(pnode.last_seen_timestamp)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/pnode/${encodeURIComponent(pnode.address)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-neo-teal/10 border border-neo-teal/30 text-neo-teal rounded-lg hover:bg-neo-teal/20 hover:border-neo-teal transition-all text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredAndSortedPnodes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">
              No pNodes found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-space-border bg-space-dark/30">
        <p className="text-sm text-gray-500 text-center">
          Showing {filteredAndSortedPnodes.length} of {initialPnodes.length}{" "}
          pNodes
        </p>
      </div>
    </div>
  );
}
