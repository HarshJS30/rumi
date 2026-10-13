#!/usr/bin/env python3
"""
Download a complete Google Drive folder (recursively) by folder ID or URL.

Usage:
  python gdrive_folder_download.py <FOLDER_ID_OR_URL> [-o OUTPUT_DIR]
"""

import argparse
import io
import os
import re
import sys
import time

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
FOLDER_MIME = "application/vnd.google-apps.folder"
SHORTCUT_MIME = "application/vnd.google-apps.shortcut"

EXPORT_MAP = {
    "application/vnd.google-apps.document": (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".docx",
    ),
    "application/vnd.google-apps.spreadsheet": (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".xlsx",
    ),
    "application/vnd.google-apps.presentation": (
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".pptx",
    ),
    "application/vnd.google-apps.drawing": ("image/png", ".png"),
}


def extract_id(value: str) -> str:
    m = re.search(r"/folders/([A-Za-z0-9_-]+)", value) or re.search(
        r"[?&]id=([A-Za-z0-9_-]+)", value
    )
    return m.group(1) if m else value.strip()


def get_service(credentials_file: str, token_file: str):
    creds = None
    if os.path.exists(token_file):
        creds = Credentials.from_authorized_user_file(token_file, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(credentials_file):
                sys.exit(f"Missing {credentials_file}.")
            flow = InstalledAppFlow.from_client_secrets_file(credentials_file, SCOPES)
            creds = flow.run_local_server(port=0)
        with open(token_file, "w") as f:
            f.write(creds.to_json())
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def safe_name(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", name).strip().rstrip(".")
    return name or "unnamed"


def unique_path(path: str, taken: set) -> str:
    base, ext = os.path.splitext(path)
    candidate, i = path, 1
    while candidate.lower() in taken:
        candidate = f"{base} ({i}){ext}"
        i += 1
    taken.add(candidate.lower())
    return candidate


def with_retry(fn, retries=5):
    for attempt in range(retries):
        try:
            return fn()
        except HttpError as e:
            status = getattr(e.resp, "status", None)
            if status in (429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise
        except (ConnectionError, TimeoutError):
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise


def list_children(service, folder_id):
    items, page_token = [], None
    while True:
        resp = with_retry(
            lambda: service.files()
            .list(
                q=f"'{folder_id}' in parents and trashed = false",
                fields="nextPageToken, files(id, name, mimeType, size, shortcutDetails)",
                pageSize=1000,
                pageToken=page_token,
                supportsAllDrives=True,
                includeItemsFromAllDrives=True,
            )
            .execute()
        )
        items.extend(resp.get("files", []))
        page_token = resp.get("nextPageToken")
        if not page_token:
            return items


def download_file(service, file, dest, stats):
    mime = file["mimeType"]
    if mime in EXPORT_MAP:
        export_mime, ext = EXPORT_MAP[mime]
        if not dest.lower().endswith(ext):
            dest += ext
        request = service.files().export_media(fileId=file["id"], mimeType=export_mime)
    elif mime.startswith("application/vnd.google-apps."):
        print(f"  [skip] unsupported Google type ({mime}): {file['name']}")
        stats["skipped"] += 1
        return
    else:
        if os.path.exists(dest) and str(os.path.getsize(dest)) == str(file.get("size")):
            print(f"  [have] {dest}")
            stats["skipped"] += 1
            return
        request = service.files().get_media(fileId=file["id"], supportsAllDrives=True)

    tmp = dest + ".part"
    try:
        with io.FileIO(tmp, "wb") as fh:
            downloader = MediaIoBaseDownload(fh, request, chunksize=8 * 1024 * 1024)
            done = False
            while not done:
                status, done = with_retry(downloader.next_chunk)
                if status and file.get("size"):
                    print(f"\r  {file['name']}: {int(status.progress() * 100)}%", end="")
        os.replace(tmp, dest)
        print(f"\r  [ok]   {dest}" + " " * 20)
        stats["files"] += 1
    except HttpError as e:
        if os.path.exists(tmp):
            os.remove(tmp)
        reason = "too large to export" if "exportSizeLimitExceeded" in str(e) else str(e)
        print(f"\n  [fail] {file['name']}: {reason}")
        stats["failed"] += 1


def download_folder(service, folder_id, local_dir, stats, visited):
    if folder_id in visited:
        return
    visited.add(folder_id)
    os.makedirs(local_dir, exist_ok=True)
    print(f"[dir]  {local_dir}")

    taken = set()
    for item in list_children(service, folder_id):
        if item["mimeType"] == SHORTCUT_MIME:
            details = item.get("shortcutDetails") or {}
            target_id = details.get("targetId")
            target_mime = details.get("targetMimeType")
            if not target_id:
                continue
            item = {"id": target_id, "name": item["name"], "mimeType": target_mime}
            if target_mime != FOLDER_MIME:
                meta = with_retry(
                    lambda: service.files()
                    .get(fileId=target_id, fields="size", supportsAllDrives=True)
                    .execute()
                )
                item["size"] = meta.get("size")

        path = unique_path(os.path.join(local_dir, safe_name(item["name"])), taken)
        if item["mimeType"] == FOLDER_MIME:
            download_folder(service, item["id"], path, stats, visited)
        else:
            download_file(service, item, path, stats)


def main():
    p = argparse.ArgumentParser(description="Recursively download a Google Drive folder.")
    p.add_argument("folder", help="Drive folder ID or URL")
    p.add_argument("-o", "--output", default=None, help="Output directory (default: folder name)")
    p.add_argument("--credentials", default="credentials.json", help="OAuth client file")
    p.add_argument("--token", default="token.json", help="Cached login token file")
    args = p.parse_args()

    service = get_service(args.credentials, args.token)
    folder_id = extract_id(args.folder)

    meta = with_retry(
        lambda: service.files()
        .get(fileId=folder_id, fields="id, name, mimeType", supportsAllDrives=True)
        .execute()
    )
    if meta["mimeType"] != FOLDER_MIME:
        sys.exit(f"'{meta['name']}' is not a folder (type: {meta['mimeType']}).")

    out = args.output or safe_name(meta["name"])
    stats = {"files": 0, "skipped": 0, "failed": 0}
    download_folder(service, folder_id, out, stats, set())

    print(
        f"\nDone. Downloaded: {stats['files']}, skipped: {stats['skipped']}, "
        f"failed: {stats['failed']}. Saved to: {os.path.abspath(out)}"
    )


if __name__ == "__main__":
    main()