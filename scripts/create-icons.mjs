import sharp from "sharp";
import { writeFile } from "node:fs/promises";
const mark = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="#193e65"/><rect x="130" y="131" width="252" height="258" rx="35" fill="none" stroke="#a4d8f4" stroke-width="14"/><path d="M130 208h252M192 110v44M320 110v44" fill="none" stroke="#a4d8f4" stroke-width="14" stroke-linecap="round"/><path d="M282 235v99c0 38-65 46-65 12 0-27 40-36 52-22v-89z" fill="white"/><path d="M282 235c4 31 53 28 47 69-9-24-37-22-47-33" fill="white"/></svg>`;
await writeFile("public/icons/icon.svg", mark);
for (const size of [180, 192, 512])
  await sharp(Buffer.from(mark))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}.png`);
const splash = `<svg xmlns="http://www.w3.org/2000/svg" width="1290" height="2796"><rect width="100%" height="100%" fill="#f6f8fb"/><rect x="495" y="1110" width="300" height="300" rx="68" fill="#193e65"/><text x="645" y="1310" font-size="170" font-family="Arial" text-anchor="middle" fill="white">T</text><text x="645" y="1530" font-size="66" font-family="Arial" font-weight="bold" text-anchor="middle" fill="#193e65">TOHO Calendar</text><text x="645" y="1620" font-size="28" font-family="Arial" text-anchor="middle" fill="#64748b">UNOFFICIAL STUDENT CALENDAR</text></svg>`;
await sharp(Buffer.from(splash))
  .png()
  .toFile("public/splash/iphone-15-pro-max.png");
