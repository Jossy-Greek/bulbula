import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Refreshes every cached public page (home, list, detail pages, both languages)
 * after an admin edit. Outside a Next request (seed script) there is nothing to refresh.
 */
export function revalidateDirectory() {
  try {
    // The shared database reads (lib/directory.ts, lib/reviews.ts), then the pages built from them.
    revalidateTag("directory", { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/sitemap.xml");
  } catch {
    // Not running inside Next.js.
  }
}
