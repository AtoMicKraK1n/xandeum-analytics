"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface PNode {
  address: string;
  version: string;
  pubkey: string | null;
  last_seen_timestamp: number;
}

function getNodeStatus(lastSeenTimestamp: number) {
  const now = Date.now() / 1000;
  const diff = now - lastSeenTimestamp;

  if (diff < 300)
    return { status: "online", color: "bg-green-500", text: "Online" };
  if (diff < 3600)
    return { status: "recent", color: "bg-yellow-500", text: "Recent" };
  return { status: "offline", color: "bg-gray-500", text: "Offline" };
}

function formatTimeAgo(timestamp: number) {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function PNodesTable({ initialPnodes }: { initialPnodes: PNode[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [versionFilter, setVersionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"address" | "version" | "lastSeen">(
    "lastSeen"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const versions = useMemo(() => {
    const versionSet = new Set(initialPnodes.map((p) => p.version));
    return Array.from(versionSet);
  }, [initialPnodes]);

  const filteredAndSortedNodes = useMemo(() => {
    let filtered = initialPnodes;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (p) =>
          p.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.pubkey?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Version filter
    if (versionFilter !== "all") {
      filtered = filtered.filter((p) => p.version === versionFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((p) => {
        const status = getNodeStatus(p.last_seen_timestamp).status;
        return status === statusFilter;
      });
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortBy === "address") {
        comparison = a.address.localeCompare(b.address);
      } else if (sortBy === "version") {
        comparison = a.version.localeCompare(b.version);
      } else if (sortBy === "lastSeen") {
        comparison = a.last_seen_timestamp - b.last_seen_timestamp;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [
    initialPnodes,
    searchTerm,
    versionFilter,
    statusFilter,
    sortBy,
    sortOrder,
  ]);

  const toggleSort = (field: "address" | "version" | "lastSeen") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <>
      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Search</label>
            <input
              type="text"
              placeholder="Address or pubkey..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Version Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Version</label>
            <select
              value={versionFilter}
              onChange={(e) => setVersionFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Versions</option>
              {versions.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="online">Online</option>
              <option value="recent">Recent</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setVersionFilter("all");
                setStatusFilter("all");
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-4 text-sm text-gray-400">
          Showing {filteredAndSortedNodes.length} of {initialPnodes.length}{" "}
          pNodes
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">pNodes Table</h2>
          <Link
            href="/map"
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
          >
            <span>View on map</span>
            <span>→</span>
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => toggleSort("address")}
                >
                  Address{" "}
                  {sortBy === "address" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => toggleSort("version")}
                >
                  Version{" "}
                  {sortBy === "version" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Pubkey
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white"
                  onClick={() => toggleSort("lastSeen")}
                >
                  Last Seen{" "}
                  {sortBy === "lastSeen" && (sortOrder === "asc" ? "↑" : "↓")}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAndSortedNodes.map((pnode) => {
                const nodeStatus = getNodeStatus(pnode.last_seen_timestamp);
                return (
                  <tr key={pnode.address} className="hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${nodeStatus.color}`}
                        />
                        <span className="text-xs text-gray-400">
                          {nodeStatus.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-blue-400">
                      {pnode.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                        {pnode.version}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-400">
                      {pnode.pubkey || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatTimeAgo(pnode.last_seen_timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Link
                        href={`/pnode/${encodeURIComponent(pnode.address)}`}
                        className="text-blue-400 hover:text-blue-300 transition"
                      >
                        View Details →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
