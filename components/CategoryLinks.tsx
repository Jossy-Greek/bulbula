import Link from "next/link";
import CategoryIcon from "./CategoryIcon";
import type { Locale } from "@/data/content";
import type { CategoryInfo } from "@/lib/directory";
import { localeHref } from "@/lib/href";

/** Links to every category page, rendered on the server so search engines find them. */
export default function CategoryLinks({ locale, categories, title, current }: { locale: Locale; categories: CategoryInfo[]; title: string; current?: string }) {
  const shown = categories.filter((x) => x.count > 0);
  if (!shown.length) return null;
  return (
    <nav aria-label={title} className="mt-12">
      <h2 className="font-display text-xl font-bold text-river">{title}</h2>
      <ul className="mt-4 flex flex-wrap gap-2">
        {shown.map((x) => (
          <li key={x.slug}>
            <Link
              href={localeHref(locale, `/businesses/${x.slug}`)}
              aria-current={x.slug === current ? "page" : undefined}
              className="chip"
            >
              <CategoryIcon name={x.icon} className="h-4 w-4" />
              {x.name} <span className="font-normal opacity-70">{x.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
