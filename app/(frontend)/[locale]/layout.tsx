import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import "../globals.css";
import { getContent, isLocale, locales } from "@/data/content";
import Tracker from "@/components/Tracker";
import { SITE_URL, alternates, brand } from "@/lib/seo";

// Self-hosted (app/fonts, OFL): next/font/google started failing every build on
// 2026-11-05, locally and on Vercel, inside Next's font downloader. Same fonts and
// subsets as before (Inter latin, Plus Jakarta Sans latin, Noto Sans Ethiopic ethiopic),
// as variable files, so the build no longer needs Google Fonts.
const jakarta = localFont({ src: "../../fonts/jakarta-latin.woff2", weight: "200 800", variable: "--font-jakarta", display: "swap" });
const inter = localFont({ src: "../../fonts/inter-latin.woff2", weight: "100 900", variable: "--font-inter", display: "swap" });
// Amharic: two static weights (65 KB each) cut from the variable file, never preloaded and,
// through unicode-range, fetched only by pages that show Ethiopic text. English pages used to
// download all 198 KB of it.
const ethiopic = localFont({
  src: [
    { path: "../../fonts/noto-ethiopic-400.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/noto-ethiopic-700.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-ethiopic",
  display: "swap",
  preload: false,
  declarations: [{ prop: "unicode-range", value: "U+1200-139F, U+2D80-2DDF, U+AB00-AB2F" }],
});

export const viewport: Viewport = { themeColor: "#0e3d47" };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = getContent(locale);
  return {
    metadataBase: new URL(SITE_URL),
    // Pages set their own title; the template adds the name, e.g. "Banks · Bulbula Directory".
    title: { default: c.meta.title, template: `%s · ${brand(locale)}` },
    description: c.meta.description,
    applicationName: brand(locale),
    icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
    alternates: alternates(locale, ""),
    // The image comes from opengraph-image.tsx next to this file (and per place).
    openGraph: { siteName: brand(locale), title: c.meta.title, description: c.meta.description, locale: locale === "am" ? "am_ET" : "en_US", type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const fonts = [jakarta, inter, ethiopic].map((f) => f.variable).join(" ");
  return (
    <html lang={locale} data-scroll-behavior="smooth" className={`h-full ${fonts}`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Tracker />
      </body>
    </html>
  );
}
