import { notFound } from "next/navigation";

/** Any other path under a language (e.g. /en/old-link) shows the site's 404, not Next's default. */
export default function Unknown() {
  notFound();
}
