export interface FolderInfo {
  name: string;
  path: string;
  size_bytes: number;
  size_gb: number;
  size_mb: number;
}

export interface DiskInfo {
  total_gb: number;
  used_gb: number;
  free_gb: number;
  used_percent: number;
}

export interface DiskUsageData {
  path: string;
  disk_info: DiskInfo;
  folders: FolderInfo[];
}
