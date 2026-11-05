import { getPayload } from "payload";
import config from "@payload-config";
import { submitBusiness } from "@/app/(frontend)/[locale]/add/actions";

/**
 * "Add a place" from the apps. The JSON becomes the website's add form, so it lands in the
 * same pending queue with the same checks and Telegram alert. The apps know categories by
 * slug (directory.json); the form wants the id.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ ok: false, error: "failed" }, { status: 400 });
  const payload = await getPayload({ config });
  const cat = await payload.find({ collection: "categories", where: { slug: { equals: String(body.category ?? "") } }, limit: 1, depth: 0 });
  const form = new FormData();
  form.set("category", String(cat.docs[0]?.id ?? ""));
  for (const key of ["nameEn", "nameAm", "phone", "landmark", "hours", "descriptionEn", "yourName", "yourPhone", "relationship", "company"]) {
    if (body[key] != null) form.set(key, String(body[key]));
  }
  if (body.consent === true) form.set("consent", "on");
  return Response.json(await submitBusiness({ ok: false }, form));
}
