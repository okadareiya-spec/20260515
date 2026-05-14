"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import DiskStats from "@/components/DiskStats";
import AIAdvice from "@/components/AIAdvice";
import type { DiskUsageData } from "@/types";

const DiskTreemap = dynamic(() => import("@/components/DiskTreemap"), { ssr: false });
const DiskBarChart = dynamic(() => import("@/components/DiskBarChart"), { ssr: false });

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type Tab = "treemap" | "barchart";

export default function Home() {
  const [scanPath, setScanPath] = useState(
    process.env.NODE_ENV === "production" ? "C:\\" : "/mnt/c"
  );
  const [isScanning, setIsScanning] = useState(false);
  const [diskData, setDiskData] = useState<DiskUsageData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("treemap");
  const [error, setError] = useState<string | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setError(null);
    setDiskData(null);

    try {
      const res = await fetch(
        `${API_URL}/api/disk-usage?path=${encodeURIComponent(scanPath)}`
      );
      if (!res.ok) throw new Error(`スキャン失敗 (${res.status})`);
      const data: DiskUsageData = await res.json();
      setDiskData(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "バックエンドに接続できません。http://localhost:8000 が起動しているか確認してください。"
      );
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main className="min-h-screen" style={{ background: "#0a0f1e" }}>
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <HardDriveIcon />
          <div>
            <h1 className="text-xl font-bold text-white leading-none">Disk Advisor</h1>
            <p className="text-xs text-indigo-400 mt-0.5">Cドライブ容量分析 × AI アドバイス</p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-5">
        {/* Scan Panel */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            ディスクスキャン
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={scanPath}
              onChange={(e) => setScanPath(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="/mnt/c"
              disabled={isScanning}
            />
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg font-medium text-sm transition-colors whitespace-nowrap"
            >
              {isScanning ? (
                <>
                  <SpinnerIcon />
                  スキャン中...
                </>
              ) : (
                "スキャン開始"
              )}
            </button>
          </div>

          {isScanning && (
            <p className="mt-3 text-yellow-400 text-xs">
              スキャン中です。Cドライブ全体の場合は数分かかることがあります...
            </p>
          )}
          {error && (
            <p className="mt-3 text-red-400 text-xs bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Results */}
        {diskData && (
          <>
            <DiskStats diskInfo={diskData.disk_info} />

            {/* Chart Card */}
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              {/* Tab Bar */}
              <div className="flex border-b border-gray-800 px-2">
                {(
                  [
                    { key: "treemap", label: "ツリーマップ" },
                    { key: "barchart", label: "棒グラフ" },
                  ] as { key: Tab; label: string }[]
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === key
                        ? "border-indigo-500 text-indigo-400"
                        : "border-transparent text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <span className="ml-auto self-center pr-4 text-xs text-gray-600">
                  {diskData.folders.length} フォルダ
                </span>
              </div>

              <div className="p-6">
                {activeTab === "treemap" ? (
                  <DiskTreemap folders={diskData.folders} />
                ) : (
                  <DiskBarChart folders={diskData.folders} />
                )}
              </div>
            </div>

            <AIAdvice
              folders={diskData.folders}
              totalSizeGb={diskData.disk_info.used_gb}
            />
          </>
        )}
      </div>
    </main>
  );
}

function HardDriveIcon() {
  return (
    <svg
      className="h-8 w-8 text-indigo-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625H3.75"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
