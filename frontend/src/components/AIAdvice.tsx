"use client";

import { useState, useRef, useEffect } from "react";
import type { FolderInfo } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Props {
  folders: FolderInfo[];
  totalSizeGb: number;
}

export default function AIAdvice({ folders, totalSizeGb }: Props) {
  const [advice, setAdvice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const adviceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (adviceRef.current) {
      adviceRef.current.scrollTop = adviceRef.current.scrollHeight;
    }
  }, [advice]);

  const handleGetAdvice = async () => {
    setLoading(true);
    setAdvice("");
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/advice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folders: folders.slice(0, 20),
          total_size_gb: totalSizeGb,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail ?? "AIアドバイスの取得に失敗しました");
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") {
            setLoading(false);
            return;
          }
          try {
            const { text } = JSON.parse(raw);
            if (text) setAdvice((prev) => prev + text);
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-white">AI アドバイス</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Claude がディスク使用状況を分析して整理アドバイスを提供します
          </p>
        </div>
        <button
          onClick={handleGetAdvice}
          disabled={loading}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          {loading ? (
            <>
              <Spinner />
              分析中...
            </>
          ) : (
            <>
              <SparkleIcon />
              AIアドバイスを取得
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-300 text-sm">
          {error}
        </div>
      )}

      {(advice || loading) && (
        <div
          ref={adviceRef}
          className="bg-gray-800 rounded-lg p-5 max-h-[520px] overflow-y-auto"
        >
          {advice ? (
            <p className="advice-content text-gray-200 text-sm leading-relaxed">{advice}</p>
          ) : (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Spinner />
              Claude が分析しています...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Spinner() {
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

function SparkleIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
      />
    </svg>
  );
}
