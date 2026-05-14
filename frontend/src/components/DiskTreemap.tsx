"use client";

import { ResponsiveContainer, Treemap, Tooltip } from "recharts";
import type { FolderInfo } from "@/types";

const COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#ef4444", "#14b8a6", "#f97316", "#84cc16",
  "#a855f7", "#06b6d4", "#d97706", "#16a34a", "#dc2626",
];

const FOLDER_COLORS: Record<string, string> = {
  Windows: "#dc2626",
  Users: "#2563eb",
  "Program Files": "#16a34a",
  "Program Files (x86)": "#15803d",
  ProgramData: "#7c3aed",
};

interface Props {
  folders: FolderInfo[];
}

const CustomContent = (props: any) => {
  const { x, y, width, height, name, value, index } = props;
  if (!name || width < 8 || height < 8) return null;

  const color = FOLDER_COLORS[name] ?? COLORS[index % COLORS.length];
  const sizeGB = value ? (value / 1024 ** 3).toFixed(2) : "0";
  const showLabel = width > 55 && height > 28;
  const showSize = width > 65 && height > 50;
  const maxChars = Math.max(4, Math.floor(width / 9));

  return (
    <g>
      <rect
        x={x} y={y}
        width={width} height={height}
        fill={color}
        stroke="#0a0f1e"
        strokeWidth={2}
        rx={3}
      />
      {showLabel && (
        <text
          x={x + width / 2}
          y={y + height / 2 + (showSize ? -9 : 0)}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={Math.min(13, Math.max(9, width / 9))}
          fontWeight="600"
        >
          {name.length > maxChars ? name.slice(0, maxChars - 1) + "…" : name}
        </text>
      )}
      {showSize && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 9}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.75)"
          fontSize={Math.min(11, Math.max(8, width / 11))}
        >
          {sizeGB} GB
        </text>
      )}
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white">{d.name}</p>
      <p className="text-indigo-300">{(d.size_bytes / 1024 ** 3).toFixed(3)} GB</p>
    </div>
  );
};

export default function DiskTreemap({ folders }: Props) {
  const data = folders.map((f) => ({
    name: f.name,
    size: f.size_bytes,
    size_bytes: f.size_bytes,
  }));

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">
        各フォルダの面積がディスク使用量を表しています
      </p>
      <ResponsiveContainer width="100%" height={420}>
        <Treemap
          data={data}
          dataKey="size"
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
