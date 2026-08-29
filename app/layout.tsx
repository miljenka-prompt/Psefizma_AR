import type { Metadata } from "next";
import { I18nProvider } from "@/components/i18n-provider";
import { getCopy, DEFAULT_LOCALE } from "@/lib/i18n";
import { siteAsset } from "@/lib/site-path";
import "./globals.css";

export const dynamic = "force-static";

const defaultCopy = getCopy(DEFAULT_LOCALE);

export const metadata: Metadata = {
  title: defaultCopy.metadata.title,
  description: defaultCopy.metadata.description,
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
    <html lang={DEFAULT_LOCALE}>
      <body>
        <I18nProvider>{children}</I18nProvider>
      </body>
    </html>
  );
}
