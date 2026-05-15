# Disk Advisor

CドライブのディスクをスキャンしてAIがアドバイスするWebアプリ。
**単一の Windows EXE** として配布・実行できます。

## プロジェクト構成

```
disk-advisor/
├── build.bat              # Windows CMD で実行できない。理由は、Linuxで作成したため、文字コードが異なった。build2.batが修正版。
├── build2.bat              # Windows EXE ビルドスクリプト（Windows CMD で実行）
├── build.sh               # Linux/WSL ビルドスクリプト（Linux バイナリ生成）
├── disk_advisor.spec      # PyInstaller 設定ファイル
├── CLAUDE.md
├── backend/
│   ├── main.py            # FastAPI アプリ（静的ファイル配信 + API + ブラウザ自動起動）
│   ├── scanner.py         # ディスクスキャン（du コマンド / os.scandir スレッド並列）
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    └── src/
        ├── app/
        │   ├── page.tsx           # メインページ（スキャン・グラフ・AI）
        │   └── layout.tsx / globals.css
        ├── components/
        │   ├── DiskStats.tsx      # 合計/使用済み/空き容量カード
        │   ├── DiskTreemap.tsx    # recharts Treemap
        │   ├── DiskBarChart.tsx   # recharts 横棒グラフ
        │   └── AIAdvice.tsx       # SSE ストリーミングで AI アドバイス表示
        └── types/index.ts
```

---

## EXE のビルド手順（Windows）

> **前提**: Windows に [Node.js](https://nodejs.org/) と [Python 3.11+](https://www.python.org/) がインストール済みであること。

1. **Windows の CMD / PowerShell** を開く（WSL ではない）

2. プロジェクトフォルダへ移動:
   ```
   cd C:\Users\wackman\disk-advisor
   ```

3. ビルド実行:
   ```
   build.bat
   ```
   ビルドは 3 ステップ（npm build → pip install → pyinstaller）で自動完了します。

4. 完成物: `dist\DiskAdvisor.exe`

---

## EXE の実行手順

1. `dist\DiskAdvisor.exe` と同じフォルダに `.env` ファイルを作成:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
   ```

2. `DiskAdvisor.exe` をダブルクリック

3. ターミナル画面が開き、約 1.5 秒後にブラウザが自動で起動します

4. ブラウザで「スキャン開始」→「AIアドバイスを取得」

---

## EXE の仕組み

```
DiskAdvisor.exe
  └─ 起動
      ├─ .env 読み込み（ANTHROPIC_API_KEY）
      ├─ 空きポート探索（8000〜8099）
      ├─ FastAPI サーバー起動（127.0.0.1:PORT）
      │    ├─ GET /api/disk-usage   ← ディスクスキャン
      │    ├─ POST /api/advice      ← AI アドバイス（SSE）
      │    └─ GET /*                ← Next.js 静的ファイル配信
      └─ ブラウザ自動起動（http://127.0.0.1:PORT）
```

- **PyInstaller `--onefile`** で単一 exe に圧縮
- 同梱物: Python ランタイム + FastAPI/uvicorn + Next.js ビルド済み静的ファイル
- **Node.js / Python の別途インストール不要**（exe を渡せばすぐ動く）

---

## 開発モード（dev）

### バックエンド起動（WSL / ターミナル1）
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
ANTHROPIC_API_KEY=sk-ant-... uvicorn main:app --reload --port 8000
```

### フロントエンド起動（ターミナル2）
```bash
cd frontend
npm install
npm run dev   # http://localhost:3000
```

---

## API エンドポイント

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/disk-usage?path=C:\` | ディレクトリスキャン（JSON） |
| POST | `/api/advice` | AI アドバイス（SSE ストリーミング） |
| GET | `/api/health` | ヘルスチェック |
| GET | `/*` | Next.js 静的ファイル配信（exe 時のみ） |

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| Backend | FastAPI 0.115 / Python 3.11+ |
| Scanner | `du -sb` (Linux/WSL) / `os.scandir` + ThreadPoolExecutor (Windows) |
| Frontend | Next.js 14 App Router / TypeScript / Tailwind CSS |
| Charts | recharts 2.13（Treemap + 横棒グラフ） |
| AI | claude-sonnet-4-6 / Prompt Caching / SSE ストリーミング |
| Bundler | PyInstaller `--onefile` |
