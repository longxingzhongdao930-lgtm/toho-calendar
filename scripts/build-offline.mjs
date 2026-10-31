import { readdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
if (base && !/^\/[A-Za-z0-9_/-]+$/.test(base))
  throw new Error("Invalid base path");
const root = `${base}/`;
async function walk(dir) {
  const result = [];
  for (const item of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, item.name);
    if (item.isDirectory()) result.push(...(await walk(file)));
    else result.push(file);
  }
  return result;
}
const files = (await walk("out")).filter(
  (f) => /\.(js|css|png|svg|webmanifest)$/.test(f) && !f.endsWith("/sw.js"),
);
const hash = createHash("sha256");
for (const file of ["out/index.html", ...files])
  hash.update(await readFile(file));
const assets = [
  root,
  ...files.map(
    (f) => base + "/" + path.relative("out", f).split(path.sep).join("/"),
  ),
];
const template = await readFile("scripts/sw-template.js", "utf8");
await writeFile(
  "out/sw.js",
  template
    .replace("__CACHE_NAME__", `toho-static-${hash.digest("hex").slice(0, 16)}`)
    .replace("__ASSETS__", JSON.stringify(assets))
    .replace("__ROOT__", root),
);
console.log(
  `Offline precache: ${assets.length} static files, scope ${root}. No personal data.`,
);
