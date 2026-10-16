#!/usr/bin/env python3
"""
Download a complete Google Drive folder (recursively) by folder ID or URL.

Usage:
  python gdrive_folder_download.py <FOLDER_ID_OR_URL> [-o OUTPUT_DIR]
"""

import argparse
import hashlib
import io
import json
import os
import re
import shutil
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
VIDEO_EXTS = {".mp4", ".mov", ".m4v", ".avi", ".mkv", ".wmv"}
IGNORED_FOLDER = re.compile(r"videos\s+for\s+georgette", re.I)

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
                fields="nextPageToken, files(id, name, mimeType, size, md5Checksum, modifiedTime, shortcutDetails)",
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


def is_image(item):
    name = item.get("name", "").lower()
    mime = item.get("mimeType", "")
    return mime.startswith("image/") or os.path.splitext(name)[1] in {
        ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"
    }


def is_video(item):
    return item.get("mimeType", "").startswith("video/") or os.path.splitext(item.get("name", ""))[1].lower() in VIDEO_EXTS


def fresh_photo_source(service, product, children):
    """Return the selected source and its fresh Drive file listing."""
    subfolders = [x for x in children if x.get("mimeType") == FOLDER_MIME and not IGNORED_FOLDER.search(x["name"])]
    named = {x["name"].strip().lower(): x for x in subfolders}
    ai = next((v for k, v in named.items() if re.fullmatch(r"ai\s*photos?", k)), None)
    original = next((v for k, v in named.items() if re.fullmatch(r"original\s*photos?", k)), None)
    ai_files = list_children(service, ai["id"]) if ai else []
    original_files = list_children(service, original["id"]) if original else []
    if ai and any(is_image(x) for x in ai_files):
        return "ai", ai_files
    if original and any(is_image(x) for x in original_files):
        return "original", original_files
    direct = [x for x in children if x.get("mimeType") != FOLDER_MIME]
    if not ai and not original and any(is_image(x) for x in direct):
        return "direct", direct
    return None, []


def folder_key(name):
    return re.sub(r"[\s-]+", " ", name.strip()).casefold()


def download_product_photos(service, photos_folder_id, local_dir, stats, only_names=None):
    """Download each product's preferred photo source, without other Drive content."""
    os.makedirs(local_dir, exist_ok=True)
    products = list_children(service, photos_folder_id)
    normalized_names = {folder_key(name) for name in only_names or []}
    for product in products:
        if product.get("mimeType") != FOLDER_MIME:
            continue
        if normalized_names:
            normalized_product_name = folder_key(product["name"])
            if not any(
                normalized_product_name == name or normalized_product_name.startswith(name + " ")
                for name in normalized_names
            ):
                continue
        children = list_children(service, product["id"])
        subfolders = [x for x in children if x.get("mimeType") == FOLDER_MIME]
        named = {x["name"].strip().lower(): x for x in subfolders}
        ai = next((v for k, v in named.items() if re.fullmatch(r"ai\s*photos?", k)), None)
        original = next((v for k, v in named.items() if re.fullmatch(r"original\s*photos?", k)), None)
        ai_images = list_children(service, ai["id"]) if ai else []
        original_images = list_children(service, original["id"]) if original else []
        chosen = None
        source = "direct"
        if ai and any(is_image(x) for x in ai_images):
            chosen, source = ai, "ai"
        elif original and any(is_image(x) for x in original_images):
            chosen, source = original, "original"
        elif not ai and not original and any(is_image(x) for x in children if x.get("mimeType") != FOLDER_MIME):
            chosen = product
        if not chosen:
            print(f"[missing] {product['name']}: no usable AI, Original, or direct images")
            stats["missing"] += 1
            continue
        destination = os.path.join(local_dir, safe_name(product["name"]))
        if os.path.isdir(destination):
            shutil.rmtree(destination)
        os.makedirs(destination, exist_ok=True)
        print(f"[source:{source}] {product['name']}")
        taken = set()
        for item in list_children(service, chosen["id"]):
            if is_image(item):
                source_dir = os.path.join(destination, source)
                os.makedirs(source_dir, exist_ok=True)
                path = unique_path(os.path.join(source_dir, safe_name(item["name"])), taken)
                download_file(service, item, path, stats)


def inspect_product_folders(service, photos_folder_id, terms=None, compare_local=False):
    """Print a fresh inventory of product folder contents, without local cache."""
    products = list_children(service, photos_folder_id)
    rows = []
    raw_root = os.path.abspath("raw-photos")
    local_dirs = {
        folder_key(name): name
        for name in os.listdir(raw_root)
        if os.path.isdir(os.path.join(raw_root, name))
    } if compare_local and os.path.isdir(raw_root) else {}
    for product in products:
        if product.get("mimeType") != FOLDER_MIME:
            continue
        if IGNORED_FOLDER.search(product["name"]):
            continue
        if terms and not any(term.casefold() in product["name"].casefold() for term in terms):
            continue
        children = list_children(service, product["id"])
        subfolders = [x for x in children if x.get("mimeType") == FOLDER_MIME]
        detail = {"name": product["name"], "looseImages": 0, "looseVideos": 0, "subfolders": {}}
        for item in children:
            if item.get("mimeType") == FOLDER_MIME and not IGNORED_FOLDER.search(item["name"]):
                nested = list_children(service, item["id"])
                detail["subfolders"][item["name"]] = {
                    "images": sum(1 for x in nested if is_image(x)),
                    "videos": sum(1 for x in nested if is_video(x)),
                    "files": len(nested),
                }
            else:
                detail["looseImages"] += int(is_image(item))
                detail["looseVideos"] += int(is_video(item))
        if compare_local:
            source, remote = fresh_photo_source(service, product, children)
            remote_images = [item for item in remote if is_image(item)]
            local_name = local_dirs.get(folder_key(product["name"]))
            local_product = os.path.join(raw_root, local_name) if local_name else None
            local_source = os.path.join(local_product, source) if local_product and source else None
            local_files = {}
            if local_source and os.path.isdir(local_source):
                for name in os.listdir(local_source):
                    full_path = os.path.join(local_source, name)
                    if not os.path.isfile(full_path):
                        continue
                    canonical = re.sub(r" \(\d+\)(?=\.[^.]+$)", "", name).casefold()
                    local_files.setdefault(canonical, []).append(full_path)
            changes = {"new": [], "changed": [], "unchanged": [], "localOnly": []}
            matched_local = set()
            for item in remote_images:
                filename = item["name"]
                key = re.sub(r" \(\d+\)(?=\.[^.]+$)", "", safe_name(filename)).casefold()
                candidates = [path for path in local_files.get(key, []) if path not in matched_local]
                if not candidates:
                    changes["new"].append(filename)
                    continue
                remote_md5 = item.get("md5Checksum")
                local_path = None
                same_content = False
                for candidate in candidates:
                    same_size = str(os.path.getsize(candidate)) == str(item.get("size", ""))
                    digest_match = False
                    if same_size and remote_md5:
                        digest = hashlib.md5()
                        with open(candidate, "rb") as stream:
                            for chunk in iter(lambda: stream.read(1024 * 1024), b""):
                                digest.update(chunk)
                        digest_match = digest.hexdigest().casefold() == remote_md5.casefold()
                    if digest_match or (same_size and not remote_md5):
                        local_path = candidate
                        same_content = True
                        break
                    if local_path is None:
                        local_path = candidate
                if local_path is None:
                    changes["new"].append(filename)
                    continue
                matched_local.add(local_path)
                if same_content:
                    changes["unchanged"].append(filename)
                else:
                    changes["changed"].append(filename)
            changes["localOnly"] = sorted(os.path.basename(path) for paths in local_files.values() for path in paths if path not in matched_local)
            detail["localComparison"] = {
                "source": source,
                "localFolderFound": bool(local_product),
                **changes,
            }
        rows.append(detail)
    result = {"folders": rows} if compare_local else rows
    return result


def main():
    p = argparse.ArgumentParser(description="Recursively download a Google Drive folder.")
    p.add_argument("folder", help="Drive folder ID or URL")
    p.add_argument("-o", "--output", default=None, help="Output directory (default: folder name)")
    p.add_argument("--credentials", default="credentials.json", help="OAuth client file")
    p.add_argument("--token", default="token.json", help="Cached login token file")
    p.add_argument("--photos-for-website", action="store_true", help="Download only selected product photo sources from the named folder")
    p.add_argument("--inspect-photo-changes", action="store_true", help="Read the named photo-change Google Doc in the selected folder's parent")
    p.add_argument("--list-photo-products", action="store_true", help="Freshly list product photo folder contents from Drive")
    p.add_argument("--compare-local", action="store_true", help="Compare fresh Drive image listings with raw-photos without downloading")
    p.add_argument("--report-json", default=None, help="Save a fresh listing report as UTF-8 JSON")
    p.add_argument("--match-term", action="append", dest="match_terms", help="Limit fresh listing to product folder names containing this term")
    p.add_argument("--product-folder", action="append", dest="product_folders", help="Download only this exact product folder name (repeatable)")
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

    if args.inspect_photo_changes:
        parents = meta.get("parents")
        if parents is None:
            meta = with_retry(lambda: service.files().get(fileId=folder_id, fields="parents", supportsAllDrives=True).execute())
            parents = meta.get("parents", [])
        query = (f"'{parents[0]}' in parents and " if parents else "") + "trashed = false and name = 'PHOTO CHANGES ARTICLE WISE'"
        docs = with_retry(lambda: service.files().list(
            q=query,
            fields="files(id,name,mimeType)", pageSize=100, supportsAllDrives=True, includeItemsFromAllDrives=True,
        ).execute()).get("files", [])
        doc = next((item for item in docs if item.get("mimeType") == "application/vnd.google-apps.document"), None)
        if not doc:
            sys.exit("No matching Google Doc was found in the parent folder.")
        request = service.files().export_media(fileId=doc["id"], mimeType="text/plain")
        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = with_retry(downloader.next_chunk)
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        print(buffer.getvalue().decode("utf-8", errors="replace"))
        return

    out = args.output or safe_name(meta["name"])
    stats = {"files": 0, "skipped": 0, "failed": 0, "missing": 0}
    if args.photos_for_website:
        children = list_children(service, folder_id)
        photo_folder = next((x for x in children if x.get("mimeType") == FOLDER_MIME and x["name"].strip().lower() == "photos for website"), None)
        if not photo_folder:
            sys.exit("The selected Drive folder has no 'Photos for website' subfolder.")
        if args.list_photo_products:
            report = inspect_product_folders(service, photo_folder["id"], args.match_terms, args.compare_local)
            if args.report_json:
                with open(args.report_json, "w", encoding="utf-8") as stream:
                    json.dump(report, stream, ensure_ascii=False, indent=2)
                    stream.write("\n")
                print(f"Wrote fresh listing report to {args.report_json}")
            else:
                print(json.dumps(report, ensure_ascii=False, indent=2))
            return
        download_product_photos(service, photo_folder["id"], out, stats, set(args.product_folders or []))
    else:
        download_folder(service, folder_id, out, stats, set())

    print(
        f"\nDone. Downloaded: {stats['files']}, skipped: {stats['skipped']}, "
        f"failed: {stats['failed']}, missing product sources: {stats['missing']}. Saved to: {os.path.abspath(out)}"
    )


if __name__ == "__main__":
    main()
