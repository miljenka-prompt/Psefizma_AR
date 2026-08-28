import type { Metadata } from "next";
import { siteAsset } from "@/lib/site-path";
import "./globals.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Lumbardska psefizma – AR rekonstrukcija",
  description:
    "Interaktivna, izvorno označena rekonstrukcija osnutka isejske naseobine i podjele zemlje u antičkoj Lumbardi.",
  icons: {
    icon: siteAsset("/favicon.svg"),
    shortcut: siteAsset("/favicon.svg"),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  );
}
