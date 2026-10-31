import type { Metadata, Viewport } from "next";
import "./globals.css";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#193e65",
};
export const metadata: Metadata = {
  applicationName: "TOHO Calendar",
  other: { "apple-mobile-web-app-capable": "yes" },
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: `${base}/icons/icon-192.png`,
    apple: `${base}/icons/icon-180.png`,
  },
  appleWebApp: {
    capable: true,
    title: "TOHO Calendar",
    statusBarStyle: "default",
    startupImage: [
      {
        url: `${base}/splash/iphone-15-pro-max.png`,
        media:
          "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)",
      },
    ],
  },
  title: "TOHO Calendar | 音楽と、毎日のリズム。",
  description:
    "東邦音楽大学の学生のための、授業・演奏会・個人予定カレンダー。非公式の学生向けアプリ。",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
