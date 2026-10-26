"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Props = { id: number; name: string; claims?: number | null; byOwner: boolean; lead?: boolean };

/**
 * Approve or reject one submission, through the REST API as the signed-in user.
 * Approving an owner's or manager's submission marks it claimed (research
 * leads and customers' tips are published unclaimed); when it claims
 * an existing (OpenStreetMap) listing, that older listing is retired so the
 * place appears once.
 */
export default function ReviewButtons({ id, name, claims, byOwner, lead = false }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [, startTransition] = useTransition();

  const patch = (target: number, body: object) =>
    fetch(`/api/businesses/${target}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((r) => r.ok, () => false);

  async function decide(approve: boolean) {
    setState("saving");
    let ok = await patch(id, approve ? { status: "published", claimed: byOwner } : { status: "rejected" });
    if (ok && approve && claims) ok = await patch(claims, { status: "rejected" });
    if (!ok) return setState("error");
    setState("idle");
    startTransition(() => router.refresh());
  }

  return (
    <div className="bb-review">
      <button type="button" className="bb-btn bb-btn--approve" disabled={state === "saving"} onClick={() => decide(true)} title={`Publish ${name}`}>
        {claims ? "Approve claim" : lead ? "Publish" : "Approve"}
      </button>
      <button type="button" className="bb-btn bb-btn--reject" disabled={state === "saving"} onClick={() => decide(false)} title={`Reject ${name}`}>
        {lead ? "Discard" : "Reject"}
      </button>
      {state === "error" ? <span className="bb-error">Not saved — retry</span> : null}
    </div>
  );
}
