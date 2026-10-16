import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# Explicit removals from the latest PHOTO CHANGES ARTICLE WISE document.
removals = {
    "104 - Red Mul Chikankari Straight Suit ": [r"5513B1A4-F393-45FA-BFFB-64818DF71D06"],
    "137 - Apricot Peach Mul Straight Panel with Chikankari Pearl Cutdana and Lace": [
        r"88017a50-94a8-4179-aaef-95fa44d0fb43",
        r"E7b19e32-5442-470e-b041-8b7efeef876b",
    ],
    "119 - Powder Blue Mul Straight Kurta set with Embellished Neckline ": [r"Copy of IMG_7129"],
    "138 - Purple Mul A- Line Chikankari with Mukaish": [r"68738BE2-7F4A-4140-AB3C-5E48C1B93AE1"],
}
results = {}
for folder, targets in removals.items():
    directory = ROOT / "raw-photos" / folder.rstrip() / "ai"
    removed = []
    for file in directory.iterdir() if directory.exists() else []:
        stem = file.stem
        if any(re.fullmatch(re.escape(target) + r"(?: \(\d+\))?", stem, re.I) for target in targets):
            file.unlink()
            removed.append(file.name)
    results[folder] = removed

csv_path = ROOT / "data" / "website-sheet.csv"
with csv_path.open("r", newline="", encoding="utf-8-sig") as stream:
    reader = csv.DictReader(stream)
    fieldnames = reader.fieldnames
    rows = list(reader)
before = []
changed = 0
for row in rows:
    if (row.get("Article") or "").strip() == "142":
        before.append({"websiteName": row.get("Website Name"), "mrp": row.get("MRP"), "priceOption1": row.get("Price Option 1")})
        row["MRP"] = "7200"
        row["Price Option 1"] = "7200"
        changed += 1
if changed != 4:
    raise SystemExit(f"Expected four Article 142 rows; found {changed}. CSV left unchanged.")
with csv_path.open("w", newline="", encoding="utf-8-sig") as stream:
    writer = csv.DictWriter(stream, fieldnames=fieldnames, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(rows)
print(json.dumps({"removedImages": results, "article142Before": before, "article142RowsChanged": changed}, ensure_ascii=False, indent=2))
