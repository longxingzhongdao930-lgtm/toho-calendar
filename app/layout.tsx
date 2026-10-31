import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
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
