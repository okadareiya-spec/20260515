"use client";

import type { DiskInfo } from "@/types";

interface Props {
  diskInfo: DiskInfo;
}

export default function DiskStats({ diskInfo }: Props) {
  const { total_gb, used_gb, free_gb, used_percent } = diskInfo;

  const barColor =
    used_percent > 90 ? "bg-red-500" : used_percent > 70 ? "bg-yellow-500" : "bg-indigo-500";

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
        ディスク使用状況
      </h2>

      <div className="grid grid-cols-3 gap-4 mb-5">
        <StatCard label="合計容量" value={`${total_gb.toFixed(0)} GB`} color="text-white" />
        <StatCard
          label="使用済み"
          value={`${used_gb.toFixed(1)} GB`}
          sub={`${used_percent}%`}
          color={used_percent > 90 ? "text-red-400" : "text-yellow-400"}
        />
        <StatCard label="空き容量" value={`${free_gb.toFixed(1)} GB`} color="text-emerald-400" />
      </div>

      <div className="w-full bg-gray-800 rounded-full h-3">
        <div
          className={`${barColor} h-3 rounded-full transition-all duration-700`}
          style={{ width: `${Math.min(used_percent, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1.5 text-right">{used_percent}% 使用中</p>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
