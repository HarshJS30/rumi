// Converts raw-photos/<collection>/<image> (JPG/PNG/HEIC/WebP) into resized WebP files
// in public/photoshoot/<collection-slug>/<name>.webp and writes data/photoshoot.json.
//
// Subfolder rule per collection:
//   - has a subfolder named "AI ..." (e.g. "AI photos")  -> only photos inside it are used
//   - has subfolders but none is "AI ..."                -> everything except folders named "Original ..."
//   - no subfolders                                       -> all photos
//   - filtering leaves a collection empty                 -> use its available photos
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

async function isOutputCurrent(inputPath, outputPath) {
  const inputStat = await fs.stat(inputPath);
  let outputStat;
  try {
    outputStat = await fs.stat(outputPath);
  } catch (err) {
    if (err.code === "ENOENT") return false;
    throw err;
  }
  return outputStat.mtimeMs >= inputStat.mtimeMs;
}

// 1. Collect every image and note which collections have an AI subfolder.
const all = [];
const hasAi = new Set();
for await (const file of walk(SRC)) {
  const ext = path.extname(file).toLowerCase();
  if (!EXTS.has(ext)) continue;
  const parts = path.relative(SRC, file).split(path.sep);
  const subs = parts.slice(1, -1);
  if (subs.some((s) => AI_DIR.test(s))) hasAi.add(parts[0]);
  all.push({ file, ext, parts, subs });
}

// 2. Keep only the wanted photos.
const keep = (p) => {
  if (p.parts.length === 1) return true; // loose file in raw-photos root
  if (hasAi.has(p.parts[0])) return p.subs.some((s) => AI_DIR.test(s));
  return !p.subs.some((s) => ORIGINAL_DIR.test(s));
};
const wanted = all.filter(keep);
const selectedCollections = new Set(wanted.map((p) => p.parts[0]));
const fallbackCollections = new Set(
  all
    .filter((p) => p.parts.length > 1)
    .map((p) => p.parts[0])
    .filter((collection) => !selectedCollections.has(collection)),
);
for (const collection of fallbackCollections) {
  console.log(`  No preferred photos found; using available photos: ${collection}`);
}
const selected = all.filter(
  (p) => keep(p) || (p.parts.length > 1 && fallbackCollections.has(p.parts[0])),
);
console.log(`Found ${all.length} images, using ${selected.length}.`);
if (selected.length === 0) {
  throw new Error(`No images selected from ${SRC}; existing manifest was not changed.`);
}
for (const c of hasAi) console.log(`  AI folder only: ${c}`);

const manifest = {};
const used = new Set();
let done = 0;
let skipped = 0;
const failures = [];

for (const { file, ext, parts } of selected) {
  const collection = parts.length > 1 ? slug(parts[0]) : "misc";
  const base = slug(path.basename(file, path.extname(file)));

  let name = base;
  let n = 1;
  while (used.has(`${collection}/${name}`)) name = `${base}-${n++}`;
  used.add(`${collection}/${name}`);

  const outDir = path.join(OUT, collection);
  const outFile = path.join(outDir, `${name}.webp`);
  await fs.mkdir(outDir, { recursive: true });

  const tempFile = `${outFile}.tmp.webp`;
  try {
    if (await isOutputCurrent(file, outFile)) {
      (manifest[collection] ??= []).push(`/photoshoot/${collection}/${name}.webp`);
      skipped++;
      continue;
    }

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
    (manifest[collection] ??= []).push(`/photoshoot/${collection}/${name}.webp`);
    done++;
    console.log("ok  ", outFile);
  } catch (err) {
    await fs.rm(tempFile, { force: true });
    const message = err instanceof Error ? err.message : String(err);
    failures.push({ file, message });
    console.error("FAIL", file, "-", message);
  }
}

if (failures.length === 0) {
  await fs.mkdir(path.dirname(MANIFEST), { recursive: true });
  const tempManifest = `${MANIFEST}.tmp`;
  await fs.writeFile(tempManifest, JSON.stringify(manifest, null, 2));
  await fs.rename(tempManifest, MANIFEST);
}

console.log(`\nConverted ${done}, skipped ${skipped}, failed ${failures.length}.`);
if (failures.length > 0) {
  console.error(`Manifest not updated because ${failures.length} image(s) failed.`);
  process.exitCode = 1;
} else {
  console.log(`Manifest: ${MANIFEST}`);
}
