// Builds data/catalogue.json from the Website Sheet CSV and the photo manifest.
//
//   1. Google Sheet -> File -> Download -> CSV, save as data/website-sheet.csv
//   2. node scripts/optimize-photos.mjs     (writes data/photoshoot.json)
//   3. node scripts/build-catalogue.mjs     (writes data/catalogue.json)

import fs from "node:fs/promises";

const CSV = "data/website-sheet.csv";
const MANIFEST = "data/photoshoot.json";
const OUT = "data/catalogue.json";

// Same slug as optimize-photos.mjs, so folder names line up.
const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      cell = "";
      rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((x) => x.trim()));
}

// Fixes typos that exist in the sheet.
const tidy = (s) =>
  String(s ?? "")
    .replace(/\s+/g, " ")
    .replace(/Duptatta/g, "Dupatta")
    .replace(/Staright|Starigh/g, "Straight")
    .replace(/Mehdni/g, "Mehndi")
    .trim();
const num = (s) => Number(String(s).replace(/[^0-9.]/g, "")) || 0;

const categoryOf = (silhouette, sets) => {
  const s = silhouette.toLowerCase();
  if (s.includes("anarkali")) return "Anarkali";
  if (s.includes("angrakha")) return "Angrakha";
  if (s.includes("kaftan")) return "Kaftan";
  if (s.includes("kurti")) return "Kurti";
  if (s.includes("pants")) return "Pants";
  if (s === "na") return sets[0]?.name ?? "Accessory";
  if (s.includes("a line")) return "A-Line Kurta";
  return "Straight Kurta";
};

const [header, ...body] = parseCsv((await fs.readFile(CSV, "utf8")).replace(/^\uFEFF/, ""));
const H = header.map((h) => h.trim().toLowerCase());
const col = (n) => {
  const i = H.indexOf(n);
  if (i < 0) throw new Error(`Missing column in CSV: ${n}`);
  return i;
};
const C = Object.fromEntries(
  ["article", "website name", "size", "mrp", "set option 1", "price option 1", "set option 2", "price option 2", "fabric", "colour", "silhouette", "pattern", "dyeable", "length"].map((n) => [n, col(n)]),
);
const STATUS = 3; // the unnamed column after Item Name: Avbl / Sold / Photos Missing

const rows = [];
for (const r of body) {
  const get = (n) => tidy(r[C[n]]);
  const websiteName = get("website name");
  if (!websiteName) continue;
  const bar = websiteName.indexOf("|");
  const identifier = get("article") || (bar > -1 ? websiteName.slice(0, bar).trim() : "");
  const name = bar > -1 ? websiteName.slice(bar + 1).trim() : websiteName;
  const rawStatus = tidy(r[STATUS]);
  const status = /sold/i.test(rawStatus) ? "Sold" : /photo/i.test(rawStatus) ? "Photos Missing" : "Avbl";
  const setOptions = [
    [get("set option 1"), num(get("price option 1"))],
    [get("set option 2"), num(get("price option 2"))],
  ]
    .filter(([n, p]) => n && p)
    .map(([n, p]) => ({ id: slug(n), name: n, price: p }));
  const silhouette = get("silhouette");
  rows.push({
    identifier,
    websiteName: `${identifier} | ${name}`,
    name,
    status,
    available: status !== "Sold",
    color: get("colour"),
    fabric: get("fabric"),
    silhouette,
    pattern: get("pattern"),
    dyeable: /^yes$/i.test(get("dyeable")),
    length: get("length"),
    size: get("size") || "NA",
    mrp: num(get("mrp")),
    setOptions,
    category: categoryOf(silhouette, setOptions),
  });
}

// Photos: match folders to rows by leading words.
const manifest = JSON.parse(await fs.readFile(MANIFEST, "utf8"));
const folders = Object.keys(manifest).map((f) => ({ f, t: f.split("-"), sold: /(^|-)sold(-|$)/.test(f), used: false }));
const lead = (a, b) => {
  let n = 0;
  while (n < a.length && n < b.length && a[n] === b[n]) n++;
  return n;
};
const trailing = (a, b) => {
  let n = 0;
  while (n < a.length && n < b.length && a[a.length - 1 - n] === b[b.length - 1 - n]) n++;
  return n;
};

const productKey = (row) => slug(row.websiteName);
const statusPriority = { Avbl: 0, "Photos Missing": 1, Sold: 2 };
const rowsByProduct = new Map();
const productIndexes = new Map();
for (const [index, row] of rows.entries()) {
  const key = productKey(row);
  const existing = rowsByProduct.get(key);
  if (!existing) {
    rowsByProduct.set(key, { ...row });
    productIndexes.set(key, index);
    continue;
  }

  const sizes = [...new Set(`${existing.size}|${row.size}`.split("|").map((size) => size.trim()).filter(Boolean))];
  const offeredSizes = sizes.filter((size) => !/^na$/i.test(size) && !/free/i.test(size));
  existing.size = (offeredSizes.length ? offeredSizes : sizes).join(" | ") || "NA";
  if (statusPriority[row.status] < statusPriority[existing.status]) {
    existing.status = row.status;
    existing.available = row.available;
  }
}
const distinctRows = [...rowsByProduct.values()];
const rowMatches = distinctRows.map((row, index) => {
  const t = slug(row.websiteName).split("-");
  const candidates = [];
  for (const folder of folders) {
    if (folder.t[0] !== t[0]) continue;
    const prefixScore = lead(t, folder.t);
    if (prefixScore < 2) continue;
    candidates.push({ folder, score: prefixScore + 2 * trailing(t, folder.t) });
  }
  const statusCandidates = candidates.filter(
    ({ folder }) => folder.sold === (row.status === "Sold"),
  );
  const matches = statusCandidates.length ? statusCandidates : candidates;
  let best = null;
  let bestScore = 0;
  for (const candidate of matches) {
    if (candidate.score > bestScore) {
      best = candidate.folder;
      bestScore = candidate.score;
    }
  }
  return { row, index, best, bestScore };
});

const matchedFolders = new Map();
for (const match of [...rowMatches].sort((a, b) => b.bestScore - a.bestScore || a.index - b.index)) {
  if (match.best && !match.best.used) {
    match.best.used = true;
    matchedFolders.set(productKey(match.row), match.best);
  }
}

const rowsByArticle = new Map();
for (const row of distinctRows) {
  const article = slug(row.identifier);
  rowsByArticle.set(article, (rowsByArticle.get(article) ?? 0) + 1);
}
for (const row of distinctRows) {
  const key = productKey(row);
  const article = slug(row.identifier);
  const articleFolders = folders.filter((folder) => folder.t[0] === article);
  if (
    !matchedFolders.has(key) &&
    rowsByArticle.get(article) === 1 &&
    articleFolders.length === 1 &&
    !articleFolders[0].used
  ) {
    articleFolders[0].used = true;
    matchedFolders.set(key, articleFolders[0]);
  }
}

const usedSlugs = new Set();
const catalogue = distinctRows.map((row) => {
  const best = matchedFolders.get(productKey(row));

  let s = slug(row.name);
  if (usedSlugs.has(s)) s = row.status === "Sold" ? `${s}-sold` : s;
  for (let n = 2; usedSlugs.has(s); n++) s = `${slug(row.name)}-${n}`;
  usedSlugs.add(s);

  return {
    id: `rumi-${String(productIndexes.get(productKey(row)) + 1).padStart(3, "0")}`,
    slug: s,
    ...row,
    images: best ? manifest[best.f] : [],
  };
});

await fs.mkdir("data", { recursive: true });
await fs.writeFile(OUT, JSON.stringify(catalogue, null, 2));

console.log(`Wrote ${catalogue.length} products to ${OUT}`);
const noPhotos = catalogue.filter((p) => !p.images.length);
if (noPhotos.length) {
  console.log(`\nNo photo folder matched (${noPhotos.length}):`);
  noPhotos.forEach((p) => console.log("  -", p.websiteName));
}
const orphans = folders.filter((f) => !f.used);
if (orphans.length) {
  console.log(`\nPhoto folders with no sheet row (${orphans.length}):`);
  orphans.forEach((f) => console.log("  -", f.f));
}
const oddColour = catalogue.filter((p) => {
  const name = p.name.toLowerCase();
  return !p.color.toLowerCase().replace(/[()-]/g, " ").split(/\s+/).some((w) => w && name.includes(w));
});
if (oddColour.length) {
  console.log(`\nColour column not found in the name, check the sheet (${oddColour.length}):`);
  oddColour.forEach((p) => console.log(`  - ${p.websiteName}  (colour: ${p.color})`));
}