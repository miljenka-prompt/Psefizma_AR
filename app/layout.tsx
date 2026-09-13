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
        <footer
          aria-label="Project credits"
          style={{
            padding: "14px 20px 20px",
            textAlign: "center",
            fontSize: "0.72rem",
            lineHeight: 1.55,
            opacity: 0.68,
            letterSpacing: "0.02em",
          }}
        >
          <strong>Concept, authorship &amp; creative direction:</strong> Miljenka Ćurković
          <span aria-hidden="true"> · </span>
          <strong>AI architecture &amp; development collaboration:</strong> ChatGPT — GPT-5.6 Sol (OpenAI)
        </footer>
      </body>
    </html>
  );
}
