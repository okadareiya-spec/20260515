import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Disk Advisor - Cドライブ容量分析",
  description: "AIがCドライブの容量を分析してアドバイスするWebアプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
