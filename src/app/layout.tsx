import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SyncInit } from "@/components/SyncInit";

export const metadata: Metadata = {
  title: "會計學習網站",
  description: "台灣會計／稅務自學平台：教材、題庫、複習卡、實務工具",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#18181b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <SiteHeader />
          {children}
        </ThemeProvider>
        <ServiceWorkerRegister />
        <SyncInit />
      </body>
    </html>
  );
}
