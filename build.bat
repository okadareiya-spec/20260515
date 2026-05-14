@echo off
setlocal EnableDelayedExpansion
title Disk Advisor - Build

echo.
echo ========================================================
echo   Disk Advisor - Windows EXE ビルドスクリプト
echo ========================================================
echo.

:: ── 前提チェック ────────────────────────────────────────────
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js が見つかりません。
    echo         https://nodejs.org/ からインストールしてください。
    pause & exit /b 1
)

where python >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python が見つかりません。
    echo         https://www.python.org/ からインストールしてください。
    pause & exit /b 1
)

:: ── ステップ 1: Next.js フロントエンドをビルド ───────────────
echo [1/3] フロントエンドをビルド中...
cd frontend

call npm install
if errorlevel 1 ( echo [ERROR] npm install 失敗 & pause & exit /b 1 )

:: 本番ビルド: API URL を空にして相対パスで動作させる
set NEXT_PUBLIC_API_URL=
call npm run build
if errorlevel 1 ( echo [ERROR] npm run build 失敗 & pause & exit /b 1 )

cd ..
echo [1/3] フロントエンドビルド完了
echo.

:: ── ステップ 2: Python 依存ライブラリをインストール ──────────
echo [2/3] Python ライブラリをインストール中...
pip install -r backend\requirements.txt
if errorlevel 1 ( echo [ERROR] pip install 失敗 & pause & exit /b 1 )

pip install pyinstaller
if errorlevel 1 ( echo [ERROR] pyinstaller インストール失敗 & pause & exit /b 1 )

echo [2/3] ライブラリインストール完了
echo.

:: ── ステップ 3: PyInstaller で EXE をビルド ──────────────────
echo [3/3] EXE をビルド中（数分かかります）...
pyinstaller disk_advisor.spec --clean --noconfirm
if errorlevel 1 ( echo [ERROR] PyInstaller ビルド失敗 & pause & exit /b 1 )

echo [3/3] EXE ビルド完了
echo.

:: ── 完了 ────────────────────────────────────────────────────
echo ========================================================
echo   ビルド成功！
echo.
echo   dist\DiskAdvisor.exe が作成されました。
echo.
echo   【実行前の準備】
echo   DiskAdvisor.exe と同じフォルダに .env ファイルを作成し
echo   以下の内容を記載してください:
echo.
echo     ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx
echo.
echo   その後 DiskAdvisor.exe をダブルクリックで起動します。
echo   ブラウザが自動で開きます。
echo ========================================================
echo.
pause
