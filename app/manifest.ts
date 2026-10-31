import type { MetadataRoute } from "next";
export const dynamic = "force-static";
export default function manifest(): MetadataRoute.Manifest {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return {
    id: `${base}/`,
    name: "TOHO Calendar",
    short_name: "TOHO Calendar",
    description: "非公式の学生向けカレンダー。予定は端末内に保存。",
    lang: "ja",
    start_url: `${base}/`,
    scope: `${base}/`,
    display: "standalone",
    background_color: "#f6f8fb",
    theme_color: "#193e65",
    icons: [
      {
        src: `${base}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${base}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
