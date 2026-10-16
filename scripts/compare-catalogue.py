"""Compare the current supplier sheet with its preserved prior version."""
import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_csv(name):
    with (ROOT / "data" / name).open(encoding="utf-8-sig", newline="") as stream:
        return list(csv.DictReader(stream))


def clean(value):
    value = re.sub(r"\s+I\s+", " | ", (value or "").strip(), flags=re.I)
    return re.sub(r"\s+", " ", value).casefold()


def grouped(rows):
    result = {}
    for row in rows:
        name = clean(row.get("Website Name"))
        if name:
            result.setdefault(name, []).append(row)
    return result


def union(rows, field):
    return sorted({(row.get(field) or "").strip() for row in rows if (row.get(field) or "").strip()}, key=str.casefold)


old, new = grouped(read_csv("website-sheet.old.csv")), grouped(read_csv("website-sheet.received.csv"))
effective = grouped(read_csv("website-sheet.csv"))
price_overrides = json.loads((ROOT / "data" / "price-overrides.json").read_text(encoding="utf-8"))
catalogue_before = json.loads((ROOT / "data" / "catalogue-before-reimport.json").read_text(encoding="utf-8"))
catalogue_after = json.loads((ROOT / "data" / "catalogue.json").read_text(encoding="utf-8"))
old_names = {clean(p.get("websiteName")) for p in catalogue_before}
new_names = {clean(p.get("websiteName")) for p in catalogue_after}
row_changes = {}
for key in sorted(old.keys() & new.keys()):
    before, after = old[key], new[key]
    fields = ["MRP", "Price Option 1", "Price Option 2", "", "Standard Colours", "Collection Tagging", "Size", "Dyeable", "Length", "Fabric", "Colour", "Silhouette", "Pattern", "Article", "New Article Number"]
    changes = {}
    for field in fields:
        left, right = union(before, field), union(after, field)
        if left != right:
            label = field or "Stock status"
            changes[label] = {"before": left, "after": right}
    if changes:
        row_changes[key] = changes

price_142 = {
    p["websiteName"]: {
        "sheet": {field: union(effective.get(clean(p["websiteName"]), []), field) for field in ("MRP", "Price Option 1")},
        "override": price_overrides.get(p["websiteName"], {}),
        "catalogue": {"MRP": p.get("mrp"), "Price Option 1": p.get("setOptions", [{}])[0].get("price")},
    }
    for p in catalogue_after if p.get("identifier") == "142"
}
fields_510 = {
    p["websiteName"]: {
        field: union(new.get(clean(p["websiteName"]), []), field) or ["(missing)"]
        for field in ("Article", "New Article Number", "MRP", "Price Option 1", "Price Option 2", "Dyeable", "Length")
    }
    for p in catalogue_after if p.get("identifier") == "510"
}

def catalogue_map(products):
    return {clean(p.get("websiteName")): p for p in products}

before_map, after_map = catalogue_map(catalogue_before), catalogue_map(catalogue_after)
catalogue_changes = {}
for name in sorted(before_map.keys() & after_map.keys()):
    fields = ("mrp", "setOptions", "status", "colorGroup", "tags", "size", "newArticleNumber", "fabric", "color", "silhouette", "pattern", "dyeable", "length", "hasPhotos", "photoSource", "photoFolder", "images")
    changed = {field: {"before": before_map[name].get(field), "after": after_map[name].get(field)} for field in fields if before_map[name].get(field) != after_map[name].get(field)}
    if changed:
        catalogue_changes[name] = changed

report = {
    "csvRows": {"before": sum(map(len, old.values())), "after": sum(map(len, new.values()))},
    "products": {"added": sorted(new.keys() - old.keys()), "removed": sorted(old.keys() - new.keys()), "catalogueAdded": sorted(new_names - old_names), "catalogueRemoved": sorted(old_names - new_names)},
    "csvChanges": row_changes,
    "catalogueChanges": catalogue_changes,
    "article142Prices": price_142,
    "article510Fields": fields_510,
}
(ROOT / "data" / "catalogue-diff-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(json.dumps(report, ensure_ascii=False, indent=2))
