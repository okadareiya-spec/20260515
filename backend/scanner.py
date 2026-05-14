import asyncio
import os
import shutil
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any


async def scan_directory(path: str) -> dict[str, Any]:
    try:
        disk = shutil.disk_usage(path)
        total_gb = disk.total / (1024**3)
        used_gb = disk.used / (1024**3)
        free_gb = disk.free / (1024**3)
    except Exception:
        total_gb = used_gb = free_gb = 0.0

    folders = await _scan_with_du(path)
    if not folders:
        folders = _scan_with_os(path)

    return {
        "path": path,
        "disk_info": {
            "total_gb": round(total_gb, 1),
            "used_gb": round(used_gb, 1),
            "free_gb": round(free_gb, 1),
            "used_percent": round((used_gb / total_gb * 100) if total_gb > 0 else 0, 1),
        },
        "folders": folders,
    }


async def _scan_with_du(path: str) -> list[dict[str, Any]]:
    """Fast scan using the `du` command (Linux/macOS/WSL only)."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "du", "-sb", "--max-depth=1", path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=300)
        return _parse_du_output(stdout.decode(errors="replace"), path)
    except (asyncio.TimeoutError, FileNotFoundError, Exception):
        return []


def _parse_du_output(output: str, root_path: str) -> list[dict[str, Any]]:
    folders = []
    norm_root = os.path.normpath(root_path)

    for line in output.strip().split("\n"):
        if not line:
            continue
        parts = line.split("\t", 1)
        if len(parts) != 2:
            continue
        try:
            size_bytes = int(parts[0])
        except ValueError:
            continue

        folder_path = parts[1].rstrip("/")
        if os.path.normpath(folder_path) == norm_root:
            continue

        folder_name = os.path.basename(folder_path)
        if not folder_name:
            continue

        folders.append({
            "name": folder_name,
            "path": folder_path,
            "size_bytes": size_bytes,
            "size_gb": round(size_bytes / (1024**3), 3),
            "size_mb": round(size_bytes / (1024**2), 1),
        })

    folders.sort(key=lambda x: x["size_bytes"], reverse=True)
    return folders


def _get_dir_size(path: str) -> int:
    total = 0
    try:
        with os.scandir(path) as it:
            for entry in it:
                try:
                    if entry.is_file(follow_symlinks=False):
                        total += entry.stat(follow_symlinks=False).st_size
                    elif entry.is_dir(follow_symlinks=False):
                        total += _get_dir_size(entry.path)
                except (PermissionError, OSError):
                    pass
    except (PermissionError, OSError):
        pass
    return total


def _scan_with_os(root: str) -> list[dict[str, Any]]:
    """Threaded fallback scanner using os.scandir (works on Windows)."""
    try:
        with os.scandir(root) as it:
            entries = [e for e in it if e.is_dir(follow_symlinks=False)]
    except (PermissionError, OSError):
        return []

    results: list[dict[str, Any]] = []

    def process_entry(entry: os.DirEntry) -> dict[str, Any]:
        size = _get_dir_size(entry.path)
        return {
            "name": entry.name,
            "path": entry.path,
            "size_bytes": size,
            "size_gb": round(size / (1024**3), 3),
            "size_mb": round(size / (1024**2), 1),
        }

    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(process_entry, e): e for e in entries}
        for future in as_completed(futures):
            try:
                results.append(future.result())
            except Exception:
                pass

    results.sort(key=lambda x: x["size_bytes"], reverse=True)
    return results
