import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const catalogue = JSON.parse(await fs.readFile("data/catalogue.json", "utf8"));
const manifest = JSON.parse(await fs.readFile("data/photoshoot.json", "utf8"));
const outDir = "scripts/out/contact-sheets";
const tileWidth = 220;
const imageHeight = 292;
const labelHeight = 64;
const columns = 4;
const groups = new Map();
const candidateMap = {};

const esc = (value) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });
for (const product of catalogue) {
  if (!product.identifier || !product.photoFolder) continue;
  const folder = path.join("raw-photos", product.photoFolder);
  let files = [];
  try {
    const sourceRoot = await fs.readdir(folder, { withFileTypes: true });
    const selected = sourceRoot.find((entry) => entry.isDirectory() && ["ai", "original", "direct"].includes(entry.name.toLowerCase()));
    const root = selected ? path.join(folder, selected.name) : folder;
    files = (await fs.readdir(root, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /\.(jpe?g|png|webp|heic|heif)$/i.test(entry.name))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
      .map((entry) => path.join(root, entry.name));
  } catch { continue; }
  const group = groups.get(product.identifier) ?? [];
  const collection = product.photoFolder.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
  const webpFiles = manifest.products[collection] ?? [];
  const productCandidates = files.map((file, index) => ({ file, product, webp: webpFiles[index] }));
  candidateMap[product.id] = productCandidates.map(({ file, webp }) => ({ filename: path.basename(file), webp }));
  group.push(...productCandidates);
  groups.set(product.identifier, group);
}

await fs.writeFile(path.join(outDir, "candidates.json"), JSON.stringify(candidateMap, null, 2));
for (const [identifier, items] of groups) {
  const tiles = new Array(items.length);
  let cursor = 0;
  async function makeTiles() {
    while (cursor < items.length) {
      const index = cursor++;
      const { file, product, webp } = items[index];
      try {
        const input = webp ? path.join("public", webp.replace(/^\//, "")) : file;
        const image = await sharp(input).rotate().resize(tileWidth, imageHeight, { fit: "inside", background: "#f4eee7" }).flatten({ background: "#f4eee7" }).jpeg({ quality: 82 }).toBuffer();
        const filename = path.basename(file);
        const fileLine1 = filename.slice(0, 32);
        const fileLine2 = filename.slice(32, 64);
        const svg = Buffer.from(`<svg width="${tileWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#fffdfa"/><text x="7" y="18" font-family="Arial" font-size="10" fill="#2c1f14">${esc(product.name.slice(0, 33))}</text><text x="7" y="38" font-family="Arial" font-size="8" fill="#654">${esc(fileLine1)}</text><text x="7" y="51" font-family="Arial" font-size="8" fill="#654">${esc(fileLine2)}</text></svg>`);
        tiles[index] = await sharp({ create: { width: tileWidth, height: imageHeight + labelHeight, channels: 3, background: "#f4eee7" } })
          .composite([{ input: image, gravity: "north" }, { input: svg, top: imageHeight, left: 0 }])
          .jpeg({ quality: 86 }).toBuffer();
      } catch { tiles[index] = null; }
    }
  }
  await Promise.all(Array.from({ length: 6 }, () => makeTiles()));
  const validTiles = tiles.filter(Boolean);
  if (!validTiles.length) continue;
  const rows = Math.ceil(validTiles.length / columns);
  const composites = validTiles.map((input, index) => ({ input, left: (index % columns) * tileWidth, top: Math.floor(index / columns) * (imageHeight + labelHeight) }));
  await sharp({ create: { width: columns * tileWidth, height: rows * (imageHeight + labelHeight), channels: 3, background: "#eee5dc" } })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(path.join(outDir, `${identifier}.jpg`));
  console.log(`${identifier}: ${validTiles.length} candidates`);
}
