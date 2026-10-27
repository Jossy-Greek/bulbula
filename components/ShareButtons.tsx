"use client";

import { useState } from "react";
import { Check, Link2, Share2 } from "lucide-react";
import SocialIcon from "./SocialIcon";
import type { Content } from "@/data/content";

/**
 * Share a place. Phones get the native share sheet; everyone gets Telegram
 * (how most people in Addis pass links around) and copy-link.
 */
export default function ShareButtons({ name, ui }: { name: string; ui: Content["ui"] }) {
  const [copied, setCopied] = useState(false);
  const url = () => window.location.href;
  const btn = "inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-raised px-3.5 text-sm font-semibold text-river hover:border-teal";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        data-track="share"
        className={btn}
        onClick={async () => {
          if (navigator.share) {
            await navigator.share({ title: name, url: url() }).catch(() => {});
          } else {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(name)}`, "_blank", "noopener");
          }
        }}
      >
        <Share2 className="h-4 w-4" aria-hidden="true" /> {ui.share}
      </button>
      <button
        type="button"
        className={btn}
        data-track="telegram"
        aria-label="Telegram"
        onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(url())}&text=${encodeURIComponent(name)}`, "_blank", "noopener")}
      >
        <SocialIcon platform="Telegram" className="h-4 w-4" /> Telegram
      </button>
      <button
        type="button"
        data-track="copy"
        className={btn}
        onClick={async () => {
          await navigator.clipboard?.writeText(url()).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? <Check className="h-4 w-4 text-teal" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        <span aria-live="polite">{copied ? ui.copied : ui.copyLink}</span>
      </button>
    </div>
  );
}
