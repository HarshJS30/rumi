"""Build catalogue.json with Python's standards-compliant csv parser."""
import csv
import json
import re
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "website-sheet.csv"
MANIFEST = ROOT / "data" / "photoshoot.json"
FOLDER_OVERRIDES = ROOT / "data" / "folder-overrides.json"
PRICE_OVERRIDES = ROOT / "data" / "price-overrides.json"
OUT = ROOT / "data" / "catalogue.json"
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}


def tidy(value):
    value = re.sub(r"\s+", " ", (value or "").strip())
    value = re.sub(r"\bBliue\b", "Blue", value, flags=re.I)
    value = re.sub(r"\bMehdni\b", "Mehndi", value, flags=re.I)
    value = re.sub(r"\bDuptatta\b", "Dupatta", value, flags=re.I)
    value = re.sub(r"\bMens\b", "Men", value, flags=re.I)
    value = value.replace(" I ", " | ")
    return value.strip()


def slug(value):
    value = value.replace("’", " ").replace("'", " ")
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", value)) or "item"


def norm(value):
    return re.sub(r"[\s-]+", " ", tidy(value)).casefold().strip()


def number(value):
    match = re.search(r"\d+(?:\.\d+)?", value or "")
    return int(float(match.group())) if match else None


def category_of(silhouette, options):
    s = silhouette.casefold()
    for part, label in [("anarkali", "Anarkali"), ("angrakha", "Angrakha"), ("kaftan", "Kaftan"), ("kurti", "Kurti"), ("pants", "Pants"), ("a line", "A-Line Kurta")]:
        if part in s:
            return label
    if s == "na":
        return options[0]["name"] if options else None
    return "Straight Kurta" if s else None


with CSV.open("r", newline="", encoding="utf-8-sig") as stream:
    reader = csv.DictReader(stream)
    rows = list(reader)

manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
photo_groups = manifest.get("products", {})
photo_sources = manifest.get("sources", {})
folder_overrides = json.loads(FOLDER_OVERRIDES.read_text(encoding="utf-8")) if FOLDER_OVERRIDES.exists() else {}
price_overrides = json.loads(PRICE_OVERRIDES.read_text(encoding="utf-8")) if PRICE_OVERRIDES.exists() else {}
folders = []
for folder in (ROOT / "raw-photos").iterdir():
    if folder.is_dir():
        folders.append({"name": folder.name, "slug": slug(folder.name), "path": folder})

products = {}
missing_fields = []
for index, row in enumerate(rows, 1):
    website = tidy(row.get("Website Name"))
    if not website:
        continue
    match = re.match(r"^(\d+)\s*(?:\||I)\s*(.*)$", website, flags=re.I)
    identifier = match.group(1) if match else None
    name = tidy(match.group(2) if match else website)
    article = tidy(row.get("Article")) or None
    new_article = tidy(row.get("New Article Number")) or None
    raw_status = tidy(row.get(""))
    status = "sold" if raw_status.casefold() == "sold" else "available"
    website_name = f"{identifier} | {name}" if identifier else website

    # Split an item into an identity and its variant colour, using the old sheet Article.
    color = tidy(row.get("Standard Colours"))
    candidates = []
    if article:
        for folder in folders:
            folder_match = re.match(r"^\s*(\d+)\s*(?:-|$)", folder["name"])
            if not folder_match or folder_match.group(1) != article:
                continue
            f_norm, n_norm = norm(folder["name"]), norm(name)
            color_words = [w for w in re.findall(r"[a-z]+", norm(color)) if len(w) > 2 and w not in {"and"}]
            overlap = sum(w in f_norm and w in n_norm for w in color_words)
            shared = len(set(n_norm.split()) & set(f_norm.split()))
            folder_sold = bool(re.search(r"\bsold\b", f_norm))
            extra_words = len(set(f_norm.split()) - set(n_norm.split()) - {"sold"})
            candidates.append((folder_sold == (status == "sold"), overlap, shared, -extra_words, folder))
    best_folder = None
    override_name = folder_overrides.get(f"rumi-{index:03d}")
    if override_name:
        best_folder = next((folder for folder in folders if folder["name"] == override_name), None)
    if candidates:
        article_folders = [folder for folder in folders if re.match(r"^\s*(\d+)\s*(?:-|$)", folder["name"]) and re.match(r"^\s*(\d+)\s*(?:-|$)", folder["name"]).group(1) == article]
        article_products = {tidy(item.get("Website Name")).casefold() for item in rows if tidy(item.get("Article")) == article}
        if best_folder:
            pass
        elif len(article_folders) == 1 and len(article_products) == 1:
            best_folder = article_folders[0]
        else:
            candidates.sort(key=lambda item: (item[0], item[1], item[2], item[3]), reverse=True)
            if len(candidates) == 1 or candidates[0][:4] != candidates[1][:4]:
                best_folder = candidates[0][4]
    photo_key = best_folder["slug"] if best_folder else None
    images = photo_groups.get(photo_key, []) if photo_key else []

    sizes = []
    raw_size = tidy(row.get("Size"))
    size_value = raw_size.replace(" I ", " | ")
    if size_value and size_value.casefold() not in {"na", "freesize"}:
        try:
            sizes = sorted({int(s.strip()) for s in size_value.split("|") if s.strip().isdigit()})
        except ValueError:
            sizes = []
    set_options = []
    for i in (1, 2):
        option_name = tidy(row.get(f"Set Option {i}"))
        price = number(row.get(f"Price Option {i}"))
        if option_name and price is not None:
            set_options.append({"id": slug(option_name), "name": option_name, "price": price})
    collection_text = tidy(row.get("Collection Tagging")).casefold()
    tags = []
    if "best seller" in collection_text or "best-seller" in collection_text:
        tags.append("best-seller")
    if "new arrival" in collection_text or "new-arrival" in collection_text:
        tags.append("new-arrival")
    if "men" in collection_text:
        tags.append("men")
    colors = [tidy(part) for part in re.split(r"\s+and\s+", tidy(row.get("Standard Colours")), flags=re.I) if tidy(part)]
    for field in ["Article", "New Article Number", "Website Name", "Standard Colours", "Size", "MRP", "Fabric", "Silhouette", "Pattern", "Length"]:
        if not tidy(row.get(field)):
            missing_fields.append({"row": index, "field": field, "websiteName": website})

    key = website.casefold()
    product = products.get(key)
    if not product:
        product = {
            "id": f"rumi-{index:03d}",
            "slug": slug(name),
            "identifier": identifier,
            "newArticleNumber": new_article,
            "websiteName": website_name,
            "name": name,
            "status": status,
            "available": status == "available",
            "images": images,
            "hasPhotos": bool(images),
            "color": tidy(row.get("Colour")) or None,
            "colorGroup": colors or None,
            "fabric": tidy(row.get("Fabric")) or None,
            "silhouette": tidy(row.get("Silhouette")) or None,
            "pattern": tidy(row.get("Pattern")) or None,
            "dyeable": (True if tidy(row.get("Dyeable")).casefold() == "yes" else False if tidy(row.get("Dyeable")).casefold() == "no" else None),
            "length": tidy(row.get("Length")) or None,
            "size": size_value or None,
            "sizes": sizes,
            "mrp": number(row.get("MRP")),
            "setOptions": set_options,
            "category": category_of(tidy(row.get("Silhouette")), set_options),
            "tags": tags,
            "collections": [],
            "photoSource": photo_sources.get(photo_key) if photo_key else None,
            "photoFolder": best_folder["name"] if best_folder else None,
        }
        products[key] = product
    else:
        was_available = product["available"]
        if not product.get("newArticleNumber") and new_article:
            product["newArticleNumber"] = new_article
        product["status"] = "available" if product["available"] or status == "available" else "sold"
        product["available"] = product["status"] == "available"
        combined_sizes = list(dict.fromkeys([*((product.get("size") or "").split(" | ")), *size_value.split(" | ")]))
        meaningful_sizes = [value for value in combined_sizes if value and value.casefold() != "na"]
        product["size"] = " | ".join(meaningful_sizes or combined_sizes) or None
        product["sizes"] = sorted(set(product["sizes"] + sizes))
        product["tags"] = list(dict.fromkeys(product["tags"] + tags))
        product["colorGroup"] = list(dict.fromkeys((product.get("colorGroup") or []) + colors)) or None
        if images and (not product["images"] or (not was_available and status == "available")):
            product["images"] = images
            product["hasPhotos"] = bool(images)
            product["photoSource"] = photo_sources.get(photo_key) if photo_key else None
            product["photoFolder"] = best_folder["name"] if best_folder else None
        if article and article != product.get("article"):
            product.setdefault("article", article)
    if article and not product.get("article"):
        product["article"] = article

price_warnings = []
for product in products.values():
    price_override = price_overrides.get(product["websiteName"])
    if price_override:
        conflicts = []
        if product.get("mrp") != price_override.get("mrp"):
            conflicts.append(f"MRP sheet={product.get('mrp')} override={price_override['mrp']}")
            product["mrp"] = price_override["mrp"]
        option1 = product.get("setOptions", [None])[0]
        if option1 and option1.get("price") != price_override.get("priceOption1"):
            conflicts.append(f"Price Option 1 sheet={option1.get('price')} override={price_override['priceOption1']}")
            option1["price"] = price_override["priceOption1"]
        if conflicts:
            warning = {"product": product["websiteName"], "message": "; ".join(conflicts), "overrideFile": "data/price-overrides.json"}
            price_warnings.append(warning)
            print(f"WARNING: {product['websiteName']}: {'; '.join(conflicts)}. Applying data/price-overrides.json.")
    if "unisex" in product["name"].casefold():
        product["collections"] = list(dict.fromkeys(product["tags"] + ["men", "women"]))
    elif "men" in product["tags"]:
        product["collections"] = list(dict.fromkeys(product["tags"]))
    else:
        product["collections"] = list(dict.fromkeys(product["tags"] + ["women"]))
    for key in list(product):
        if product[key] is None:
            del product[key]
    product.pop("article", None)

catalogue = list(products.values())
# Dict insertion order preserves the first row order from the supplier sheet.
used = set()
for product in catalogue:
    slug_value = product["slug"]
    n = 2
    while slug_value in used:
        slug_value = f"{product['slug']}-{n}"
        n += 1
    product["slug"] = slug_value
    used.add(slug_value)

OUT.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
matched = {p.get("photoFolder") for p in catalogue if p.get("photoFolder")}
folder_names = {folder["name"] for folder in folders}
report = {
    "rows": len(rows),
    "products": len(catalogue),
    "mergedDuplicates": {name: sum(1 for row in rows if tidy(row.get("Website Name")).casefold() == name.casefold()) for name in {tidy(row.get("Website Name")) for row in rows} if sum(1 for row in rows if tidy(row.get("Website Name")).casefold() == name.casefold()) > 1},
    "productsWithoutFolder": [p["websiteName"] for p in catalogue if not p.get("photoFolder")],
    "productsWithoutPhotos": [p["websiteName"] for p in catalogue if not p["images"]],
    "foldersWithoutProduct": sorted(folder_names - matched),
    "originalFallbacks": [p["websiteName"] for p in catalogue if p.get("photoSource") == "original"],
    "missingFields": missing_fields,
    "priceWarnings": price_warnings,
}
(ROOT / "data" / "catalogue-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Wrote {len(catalogue)} products from {len(rows)} CSV rows to {OUT}")
print(f"Merged duplicates: {len(report['mergedDuplicates'])}; unmatched products: {len(report['productsWithoutFolder'])}; missing images: {len(report['productsWithoutPhotos'])}; missing fields: {len(missing_fields)}")
