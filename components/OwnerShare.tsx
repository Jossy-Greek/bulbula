"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import SocialIcon from "./SocialIcon";

/**
 * Share the owner's public page. Not ShareButtons: that shares the current URL,
 * which here is the private stats link.
 */
export default function OwnerShare({ url, name, copyText, copiedText, telegramText }: { url: string; name: string; copyText: string; copiedText: string; telegramText: string }) {
  const [copied, setCopied] = useState(false);
  const btn = "btn btn-outline";
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className={btn}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            /* the link is also shown on the page */
          }
        }}
      >
        {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Link2 className="h-4 w-4" aria-hidden="true" />}
        {copied ? copiedText : copyText}
      </button>
      <a className={btn} href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(name)}`} target="_blank" rel="noopener noreferrer">
        <SocialIcon platform="Telegram" className="h-4 w-4" />
        {telegramText}
      </a>
    </div>
  );
}
