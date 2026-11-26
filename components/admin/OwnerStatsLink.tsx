"use client";

import { useField } from "@payloadcms/ui";
import { useState } from "react";

/** 128 random bits, URL-safe: long enough that nobody guesses a link. */
function newKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * The owner's private stats link, in the listing's sidebar: create it, copy it
 * (English or Amharic page) to send to the owner, or replace it if it was shared
 * further. A new key takes effect when the listing is saved.
 */
export default function OwnerStatsLink({ path }: { path: string }) {
  const { value, setValue, initialValue } = useField<string>({ path });
  const [copied, setCopied] = useState<string | null>(null);
  const unsaved = Boolean(value) && value !== initialValue;
  const link = (locale: "en" | "am") => `${window.location.origin}/${locale}/stats/${value}`;

  async function copy(locale: "en" | "am") {
    try {
      await navigator.clipboard.writeText(link(locale));
      setCopied(locale);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy the link", link(locale));
    }
  }

  return (
    <div className="field-type bb-stats-link">
      <span className="field-label">Owner stats link</span>
      {value ? (
        <>
          <code className="bb-stats-link__url">…/stats/{value.slice(0, 6)}…</code>
          <div className="bb-stats-link__row">
            <button type="button" className="bb-btn" disabled={unsaved} onClick={() => copy("en")}>
              {copied === "en" ? "Copied ✓" : "Copy (English)"}
            </button>
            <button type="button" className="bb-btn" disabled={unsaved} onClick={() => copy("am")}>
              {copied === "am" ? "Copied ✓" : "Copy (አማርኛ)"}
            </button>
          </div>
          {unsaved ? (
            <p className="field-description">Save the listing to turn this link on.</p>
          ) : (
            <button type="button" className="bb-stats-link__reset" onClick={() => setValue(newKey())}>
              Shared too widely? Make a new link (the old one stops working)
            </button>
          )}
        </>
      ) : (
        <>
          <p className="field-description">A private page where the owner sees visits, calls and direction taps. No sign-in.</p>
          <button type="button" className="bb-btn" onClick={() => setValue(newKey())}>
            Create link
          </button>
        </>
      )}
    </div>
  );
}
