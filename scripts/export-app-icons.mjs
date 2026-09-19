/**
 * Rasterise public/icons/*.svg to the PNG/ICO set. One-off; keep under 100 lines.
 *
 *   node scripts/export-app-icons.mjs
 */
import { Resvg } from "@resvg/resvg-js";
import { readFileSync, writeFileSync } from "node:fs";
import pngToIco from "png-to-ico";

const anySvg = readFileSync("public/icons/icon.svg");
const maskSvg = readFileSync("public/icons/icon-maskable.svg");

function png(svg, size) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "#0B0E12",
  }).render().asPng();
}

const jobs = [
  ["public/icons/icon-32.png", anySvg, 32],
  ["public/icons/apple-touch-icon.png", anySvg, 180],
  ["public/icons/icon-192.png", anySvg, 192],
  ["public/icons/icon-512.png", anySvg, 512],
  ["public/icons/icon-1024.png", anySvg, 1024],
  ["public/icons/icon-192-maskable.png", maskSvg, 192],
  ["public/icons/icon-512-maskable.png", maskSvg, 512],
];

for (const [path, svg, size] of jobs) {
  writeFileSync(path, png(svg, size));
  console.log(path);
}

const ico = await pngToIco([png(anySvg, 16), png(anySvg, 32)]);
writeFileSync("src/app/favicon.ico", ico);
console.log("src/app/favicon.ico");
