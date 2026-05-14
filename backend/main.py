import json
import os
import socket
import sys
import threading
import time
import webbrowser

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from scanner import scan_directory


# ─── helpers ─────────────────────────────────────────────────────────────────

def _get_static_dir() -> str:
    if hasattr(sys, "_MEIPASS"):
        return os.path.join(sys._MEIPASS, "static")
    return os.path.normpath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend", "out")
    )


def _load_env_file() -> None:
    """Load .env from the same directory as the exe (or script in dev mode)."""
    if hasattr(sys, "_MEIPASS"):
        env_dir = os.path.dirname(sys.executable)
    else:
        env_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(env_dir, ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path, encoding="utf-8") as f:
        for raw in f:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            os.environ.setdefault(k.strip(), v.strip())


def _find_free_port(start: int = 8000) -> int:
    for port in range(start, start + 100):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                continue
    return start


static_dir = _get_static_dir()

# ─── app ─────────────────────────────────────────────────────────────────────

app = FastAPI(title="Disk Advisor API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── API routes (must be registered before the SPA catch-all) ────────────────

@app.get("/api/disk-usage")
async def get_disk_usage(path: str = "C:\\"):
    return await scan_directory(path)


class FolderInfo(BaseModel):
    name: str
    path: str
    size_bytes: int
    size_gb: float
    size_mb: float


class AdviceRequest(BaseModel):
    folders: list[FolderInfo]
    total_size_gb: float


@app.post("/api/advice")
async def get_advice(request: AdviceRequest):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail=(
                "ANTHROPIC_API_KEY が設定されていません。"
                "EXEと同じフォルダに .env ファイルを作成し "
                "ANTHROPIC_API_KEY=sk-ant-... を記載してください。"
            ),
        )

    client = anthropic.Anthropic(api_key=api_key)

    top_folders = sorted(request.folders, key=lambda f: f.size_bytes, reverse=True)[:20]
    folder_lines = "\n".join(f"- {f.name}: {f.size_gb:.2f} GB" for f in top_folders)

    user_prompt = f"""CドライブのWindowsパソコンのフォルダ別使用容量データです。

合計使用容量: {request.total_size_gb:.1f} GB

【フォルダ別容量（大きい順）】
{folder_lines}

このデータをもとに以下の内容をアドバイスしてください：

## 1. 削除・整理を優先すべきフォルダ
各フォルダについて理由も添えて説明してください。

## 2. 安全に削除できるデータ
一般的にWindowsで安全に削除できる種類のデータを具体的に挙げてください。

## 3. 注意が必要なフォルダ
削除前に確認が必要なもの、誤って削除すると問題が起きるものを説明してください。

## 4. 具体的な節約アクション
今すぐ実行できるディスク節約の手順を番号付きで教えてください。

日本語で具体的かつ実践的にお願いします。"""

    async def stream_response():
        with client.messages.stream(
            model="claude-sonnet-4-6",
            max_tokens=2048,
            system=[
                {
                    "type": "text",
                    "text": (
                        "あなたはWindowsのディスク管理の専門家です。"
                        "ユーザーのCドライブ使用状況を分析し、安全で実践的な整理アドバイスを日本語で提供します。"
                        "Windowsシステムファイル（Windows、System32など）の削除は絶対に推奨しません。"
                        "ユーザーデータ、一時ファイル、キャッシュの整理を優先してアドバイスします。"
                    ),
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": user_prompt}],
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'text': text})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        stream_response(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.get("/api/health")
async def health():
    return {"status": "ok"}


# ─── SPA static file serving (catch-all — must be last) ──────────────────────

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if not os.path.isdir(static_dir):
        return {
            "message": "フロントエンドがビルドされていません。build.bat を実行してください。",
            "static_dir": static_dir,
        }

    # Security: prevent path traversal
    target = os.path.realpath(os.path.join(static_dir, full_path or ""))
    if not target.startswith(os.path.realpath(static_dir)):
        raise HTTPException(status_code=403, detail="Forbidden")

    if os.path.isfile(target):
        return FileResponse(target)

    # SPA fallback: return index.html for unknown paths
    index = os.path.join(static_dir, "index.html")
    if os.path.isfile(index):
        return FileResponse(index)

    raise HTTPException(status_code=404, detail="Not found")


# ─── entry point ─────────────────────────────────────────────────────────────

def main() -> None:
    _load_env_file()
    port = _find_free_port(8000)

    def _open_browser() -> None:
        time.sleep(1.5)
        webbrowser.open(f"http://127.0.0.1:{port}")

    threading.Thread(target=_open_browser, daemon=True).start()

    import uvicorn

    print("=" * 50)
    print(f"  Disk Advisor 起動中")
    print(f"  http://127.0.0.1:{port}")
    print("  終了するにはこのウィンドウを閉じてください")
    print("=" * 50)
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")


if __name__ == "__main__":
    main()
