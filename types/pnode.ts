export interface PNodeInfo {
  address: string;
  last_seen_timestamp: number;
  pubkey: string | null;
  version: string;
}

export interface PNodeStats {
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

export interface PNodeListResponse {
  pods: PNodeInfo[];
  total_count: number;
}
