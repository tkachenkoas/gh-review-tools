import { cp, mkdir, readFile, rm } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const files = [
  "manifest.json",
  "background.js",
  "popup.html",
  "popup.css",
  "popup.js",
  "url.js",
  "url-watcher.js",
  "import-only.js",
  "viewed-files.js",
  "assets/icons"
];

JSON.parse(await readFile(resolve(root, "manifest.json"), "utf8"));
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of files) {
  await cp(resolve(root, file), resolve(dist, file), { recursive: true });
}

console.log(`Built Chrome extension in ${dist}`);
