import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "會計學習網站",
  description: "台灣會計／稅務自學平台：教材、題庫、複習卡、實務工具",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
