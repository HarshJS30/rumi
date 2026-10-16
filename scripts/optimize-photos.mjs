// Converts raw-photos/<collection>/<image> (JPG/PNG/HEIC/WebP) into resized WebP files
// in public/photoshoot/<collection-slug>/<name>.webp and writes data/photoshoot.json.
//
// raw-photos already contains only the chosen source per product, downloaded by
// gdrive_folder_download.py. The source is retained in photoshoot.json.
//
// Install once:  npm i -D sharp heic-convert
// Run:           node scripts/optimize-photos.mjs

import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import convert from "heic-convert";

const SRC = "raw-photos";
const OUT = "public/photoshoot";
const MANIFEST = "data/photoshoot.json";
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 80;
const EXTS = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"]);
const AI_DIR = /(^|[^a-z])ai([^a-z]|$)/i; // "AI photos", "AI-Photos", "ai_photos"
const ORIGINAL_DIR = /original/i;
const SOURCE_DIRS = new Map([["ai", "ai"], ["original", "original"], ["direct", "direct"]]);

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";

async function* walk(dir) {
  for (const entry of (await fs.readdir(dir, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

// 1. Collect images from the single selected source stored per product.
const all = [];
for await (const file of walk(SRC)) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTS.has(ext)) continue;
  const parts = path.relative(SRC, file).split(path.sep);
  const subs = parts.slice(1, -1);
  all.push({ file, ext, parts, subs });
}

const sourceOf = (p) => {
  const leaf = p.subs.at(-1)?.toLowerCase();
  if (leaf === "ai" || AI_DIR.test(leaf ?? "")) return "ai";
  if (leaf === "original" || ORIGINAL_DIR.test(leaf ?? "")) return "original";
  return "direct";
};
const selected = all;
console.log(`Found ${all.length} images, using ${selected.length}.`);
if (selected.length === 0) {
  throw new Error(`No images selected from ${SRC}; existing manifest was not changed.`);
}
await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });
const manifest = { products: {}, sources: {} };
const used = new Set();
let done = 0;
const failures = [];
const jobs = selected.map(({ file, ext, parts }) => {
  const collection = parts.length > 1 ? slug(parts[0]) : "misc";
  manifest.sources[collection] = sourceOf({ subs: parts.slice(1, -1) });
  const base = slug(path.basename(file, path.extname(file)));
  let name = base;
  let n = 1;
  while (used.has(`${collection}/${name}`)) name = `${base}-${n++}`;
  used.add(`${collection}/${name}`);
  return { file, ext, collection, name, outFile: path.join(OUT, collection, `${name}.webp`) };
});
const outputs = new Array(jobs.length);
let cursor = 0;
async function worker() {
  while (cursor < jobs.length) {
    const index = cursor++;
    const { file, ext, outFile } = jobs[index];
    const tempFile = `${outFile}.tmp.webp`;
    try {
      await fs.mkdir(path.dirname(outFile), { recursive: true });
      let input = await fs.readFile(file);
      if (ext === ".heic" || ext === ".heif") {
        input = Buffer.from(await convert({ buffer: input, format: "JPEG", quality: 0.92 }));
      }
      await sharp(input)
        .rotate()
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toFile(tempFile);
      await fs.rename(tempFile, outFile);
      const { collection, name } = jobs[index];
      outputs[index] = `/photoshoot/${collection}/${name}.webp`;
      done++;
      if (done % 20 === 0) console.log(`Converted ${done}/${jobs.length}`);
    } catch (err) {
      await fs.rm(tempFile, { force: true });
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ file, message });
      console.error("FAIL", file, "-", message);
    }
  }
}
await Promise.all(Array.from({ length: Math.min(8, jobs.length) }, () => worker()));
for (let index = 0; index < jobs.length; index++) {
  if (outputs[index]) (manifest.products[jobs[index].collection] ??= []).push(outputs[index]);
}

if (failures.length === 0) {
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  const tempManifest = `${MANIFEST}.tmp`;
  await fs.writeFile(tempManifest, JSON.stringify(manifest, null, 2));
  await fs.rename(tempManifest, MANIFEST);
}

console.log(`\nConverted ${done}, failed ${failures.length}.`);
if (failures.length > 0) {
  console.error(`Manifest not updated because ${failures.length} image(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`Manifest: ${MANIFEST}`);
}
