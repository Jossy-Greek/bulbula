import Link from "next/link";
import type { Locale } from "@/data/content";
import { termsNote } from "@/data/terms";
import { localeHref } from "@/lib/href";

/** "By sending, you agree to the terms of use." Shown next to the add and review forms' send buttons. */
export default function TermsNote({ locale, className = "" }: { locale: Locale; className?: string }) {
  const n = termsNote[locale];
  return (
    <p className={`text-xs text-muted ${className}`}>
      {n.before}
      <Link href={localeHref(locale, "/terms")} target="_blank" className="font-semibold text-teal-text underline underline-offset-2">
        {n.link}
      </Link>
      {n.after}
    </p>
  );
}
