import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, Outfit } from "next/font/google";

import { AppProviders } from "@/components/providers/AppProviders";

import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

const outfitBlack = Outfit({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "毎月日記",
  description: "投稿したら過去が返ってくる、思い出が報酬の日記アプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${outfitBlack.variable}`}>
      <body
        className={`${notoSansJP.className} min-h-dvh bg-white text-stone-800 antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
