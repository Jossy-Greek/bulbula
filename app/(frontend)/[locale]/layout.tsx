import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import localFont from "next/font/local";
import "../globals.css";
import { getContent, isLocale, locales } from "@/data/content";
import Tracker from "@/components/Tracker";

// Self-hosted (app/fonts, OFL): next/font/google started failing every build on
// 2026-11-05, locally and on Vercel, inside Next's font downloader. Same fonts and
// subsets as before (Inter latin, Plus Jakarta Sans latin, Noto Sans Ethiopic ethiopic),
// as variable files, so the build no longer needs Google Fonts.
const jakarta = localFont({ src: "../../fonts/jakarta-latin.woff2", weight: "200 800", variable: "--font-jakarta", display: "swap" });
const inter = localFont({ src: "../../fonts/inter-latin.woff2", weight: "100 900", variable: "--font-inter", display: "swap" });
const ethiopic = localFont({ src: "../../fonts/noto-ethiopic.woff2", weight: "100 900", variable: "--font-ethiopic", display: "swap" });

export const viewport: Viewport = { themeColor: "#0e3d47" };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const c = getContent(locale);
  return {
    metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
    title: c.meta.title,
    description: c.meta.description,
    icons: { icon: "/favicon.svg", apple: "/apple-touch-icon.png" },
    alternates: { languages: { en: "/en", am: "/am" } },
    openGraph: { title: c.meta.title, description: c.meta.description, locale, type: "website" },
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
