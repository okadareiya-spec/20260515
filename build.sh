#!/usr/bin/env bash
# Linux/WSL 用ビルドスクリプト（Linux バイナリを生成します）
# Windows EXE を作成するには build.bat を Windows 上で実行してください。
set -euo pipefail

echo ""
echo "========================================================"
echo "  Disk Advisor - Linux ビルドスクリプト"
echo "  ※ Windows EXE は build.bat を Windows CMD で実行"
echo "========================================================"
echo ""

# ── ステップ 1: フロントエンドビルド ─────────────────────────
echo "[1/3] フロントエンドをビルド中..."
cd frontend
npm install
NEXT_PUBLIC_API_URL="" npm run build
cd ..
echo "[1/3] 完了"
echo ""

# ── ステップ 2: Python 依存ライブラリ ────────────────────────
echo "[2/3] Python ライブラリをインストール中..."
pip3 install -r backend/requirements.txt
pip3 install pyinstaller
echo "[2/3] 完了"
echo ""

# ── ステップ 3: PyInstaller ───────────────────────────────────
echo "[3/3] 実行ファイルをビルド中..."
pyinstaller disk_advisor.spec --clean --noconfirm
echo "[3/3] 完了"
echo ""

echo "========================================================"
echo "  ビルド成功！ dist/DiskAdvisor が作成されました。"
echo ""
echo "  実行前に同じフォルダに .env を作成してください:"
echo "    ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx"
echo ""
echo "  起動: ./dist/DiskAdvisor"
echo "========================================================"
