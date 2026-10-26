import { revalidatePath } from "next/cache";

/**
 * Refreshes every cached public page (home, list, detail pages, both languages)
 * after an admin edit. Outside a Next request (seed script) there is nothing to refresh.
 */
export function revalidateDirectory() {
  try {
    revalidatePath("/", "layout");
  } catch {
    // Not running inside Next.js.
  }
}
