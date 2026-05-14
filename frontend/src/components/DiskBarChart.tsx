"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { FolderInfo } from "@/types";

const COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#f43f5e",
  "#f97316", "#f59e0b", "#84cc16", "#10b981", "#14b8a6",
];

interface Props {
  folders: FolderInfo[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      <p className="text-indigo-300">{payload[0].value.toFixed(2)} GB</p>
    </div>
  );
};

export default function DiskBarChart({ folders }: Props) {
  const top15 = folders.slice(0, 15).map((f) => ({
    name: f.name,
    size_gb: f.size_gb,
  }));

  return (
    <div>
      <p className="text-xs text-gray-500 mb-3">上位 {top15.length} フォルダ（GB）</p>
      <ResponsiveContainer width="100%" height={420}>
        <BarChart data={top15} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "#9ca3af", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#374151" }}
            unit=" GB"
          />
          <YAxis
            type="category"
            dataKey="name"
            width={130}
            tick={{ fill: "#d1d5db", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.08)" }} />
          <Bar dataKey="size_gb" radius={[0, 4, 4, 0]}>
            {top15.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
