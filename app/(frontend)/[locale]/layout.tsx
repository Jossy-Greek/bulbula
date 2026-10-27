import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { Inter, Noto_Sans_Ethiopic, Plus_Jakarta_Sans } from "next/font/google";
import "../globals.css";
import { getContent, isLocale, locales } from "@/data/content";
import Tracker from "@/components/Tracker";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-jakarta" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const ethiopic = Noto_Sans_Ethiopic({ subsets: ["ethiopic"], weight: ["400", "500", "600", "700"], variable: "--font-ethiopic" });

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
