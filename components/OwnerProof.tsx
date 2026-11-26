import { TrendingUp } from "lucide-react";
import type { Content } from "@/data/content";
import { shown, type Proof } from "@/lib/proof";

/** Why an owner should list: real numbers, shown only once they are big enough (lib/proof.ts). */
export default function OwnerProof({ c, proof, className = "" }: { c: Pick<Content, "locale" | "proof">; proof: Proof; className?: string }) {
  const fmt = (n: number) => n.toLocaleString(c.locale === "am" ? "am-ET" : "en-US");
  const lines = [
    shown(proof, "contacts") != null ? c.proof.ownerContacts.replace("{n}", fmt(proof.contacts)) : null,
    shown(proof, "claimed") != null ? c.proof.ownerClaimed.replace("{n}", fmt(proof.claimed)) : null,
  ].filter((x): x is string => Boolean(x));
  if (!lines.length) return null;
  return (
    <ul className={`space-y-1.5 ${className}`}>
      {lines.map((l) => (
        <li key={l} className="flex items-start gap-2 text-[15px] font-bold">
          <TrendingUp className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" /> {l}
        </li>
      ))}
    </ul>
  );
}
