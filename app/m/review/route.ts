import { submitReview } from "@/app/(frontend)/[locale]/b/[slug]/actions";

/**
 * Reviews from the Android and iOS apps. The JSON becomes the same form the website sends,
 * so the same rules apply: pending until an admin approves, no links, five a day, one per
 * place a day, the honeypot and the 3-second check (`t` is when the app opened the form).
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, error: "failed" }, { status: 400 });
  const form = new FormData();
  for (const key of ["slug", "rating", "author", "text", "locale", "t", "company", "player"]) {
    if (body[key] != null) form.set(key, String(body[key]));
  }
  return Response.json(await submitReview({ ok: false }, form));
}
