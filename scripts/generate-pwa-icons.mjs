/**
 * Render Home Screen PNGs from public/icons/icon.svg.
 *   node scripts/generate-pwa-icons.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/icons/icon.svg"));

async function writePng(rel, size) {
  const buf = await sharp(svg, { density: 384 }).resize(size, size).png().toBuffer();
  const dest = join(root, rel);
  writeFileSync(dest, buf);
  console.log(`wrote ${rel} (${buf.length} bytes)`);
}

await writePng("public/icons/icon-192.png", 192);
await writePng("public/icons/icon-512.png", 512);
await writePng("public/icons/apple-touch-icon.png", 180);
await writePng("public/apple-touch-icon.png", 180);
