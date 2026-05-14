# -*- mode: python ; coding: utf-8 -*-
import os

# SPECPATH = directory containing this spec file (project root)
frontend_out = os.path.join(SPECPATH, "frontend", "out")

# Collect all Next.js build files recursively into 'static/' inside the bundle
datas = []
if os.path.isdir(frontend_out):
    for root, dirs, files in os.walk(frontend_out):
        rel = os.path.relpath(root, frontend_out)
        dest = os.path.join("static", rel) if rel != "." else "static"
        for fname in files:
            datas.append((os.path.join(root, fname), dest))
else:
    import sys
    print(
        "\n[WARNING] frontend/out/ が見つかりません。\n"
        "先に 'cd frontend && npm run build' を実行してください。\n",
        file=sys.stderr,
    )

# SSL certificates required by anthropic/httpx
try:
    from PyInstaller.utils.hooks import collect_data_files
    datas += collect_data_files("certifi")
except Exception:
    pass

block_cipher = None

hiddenimports = [
    "scanner",
    # uvicorn internals
    "uvicorn.logging",
    "uvicorn.loops",
    "uvicorn.loops.auto",
    "uvicorn.loops.asyncio",
    "uvicorn.protocols",
    "uvicorn.protocols.http",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.http.h11_impl",
    "uvicorn.lifespan",
    "uvicorn.lifespan.on",
    "uvicorn.lifespan.off",
    # starlette / fastapi internals
    "starlette.routing",
    "starlette.middleware",
    "starlette.middleware.cors",
    "starlette.responses",
    "starlette.staticfiles",
    # async / http stack
    "anyio",
    "anyio._backends._asyncio",
    "h11",
    "httpx",
    "httpcore",
    "httpcore._async",
    "httpcore._sync",
    # email (used by httpx internally)
    "email.mime.text",
    "email.mime.multipart",
]

a = Analysis(
    ["backend/main.py"],
    pathex=[os.path.join(SPECPATH, "backend")],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["tkinter", "matplotlib", "PIL", "numpy", "pandas", "scipy"],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name="DiskAdvisor",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,   # shows a terminal window so users can see startup / errors
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)
