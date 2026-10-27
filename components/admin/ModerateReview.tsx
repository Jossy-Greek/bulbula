"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

/** Publish or reject one visitor review, through the REST API as the signed-in user. */
export default function ModerateReview({ id }: { id: number }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [, startTransition] = useTransition();

  async function decide(status: "published" | "rejected") {
    setState("saving");
    const ok = await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then((r) => r.ok, () => false);
    if (!ok) return setState("error");
    setState("idle");
    startTransition(() => router.refresh());
  }

  return (
    <div className="bb-review">
      <button type="button" className="bb-btn bb-btn--approve" disabled={state === "saving"} onClick={() => decide("published")}>
        Publish
      </button>
      <button type="button" className="bb-btn bb-btn--reject" disabled={state === "saving"} onClick={() => decide("rejected")}>
        Reject
      </button>
      {state === "error" ? <span className="bb-error">Not saved — retry</span> : null}
    </div>
  );
}
