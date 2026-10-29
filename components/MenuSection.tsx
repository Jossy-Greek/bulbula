import type { Content } from "@/data/content";
import type { Listing } from "@/lib/directory";

/** A place's menu, typed from its menu (a Google Maps photo or the owner), with prices in birr. */
export default function MenuSection({ menu, source, ui, locale }: { menu: Listing["menu"]; source: string | null; ui: Content["ui"]; locale: Content["locale"] }) {
  const fmt = new Intl.NumberFormat("en");
  return (
    <section aria-labelledby="menu-title" className="rounded-2xl border border-border bg-raised p-6">
      <h2 id="menu-title" className="font-display text-xl font-bold text-river">
        {ui.menu}
      </h2>
      <div className="mt-2 divide-y divide-border">
        {menu.map((s, i) => (
          // The first two sections open; long menus stay short until asked.
          <details key={`${s.title}-${i}`} open={i < 2} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-river">
              {s.title}
              <span className="text-xs font-normal text-muted">{s.items.length}</span>
            </summary>
            <ul className="mt-2 space-y-1.5">
              {s.items.map((it, j) => {
                const primary = locale === "am" && it.nameAm ? it.nameAm : it.name;
                const secondary = locale === "am" ? (it.nameAm ? it.name : null) : it.nameAm;
                return (
                  <li key={`${it.name}-${j}`} className="flex items-baseline gap-2 text-[15px]">
                    <span className="min-w-0">
                      <span className="text-ink">{primary}</span>
                      {secondary ? <span className="ml-1.5 text-sm text-muted">{secondary}</span> : null}
                    </span>
                    <span className="flex-1 border-b border-dotted border-border" aria-hidden="true" />
                    {it.price != null ? (
                      <span className="whitespace-nowrap font-semibold tabular-nums text-ink">
                        {fmt.format(it.price)} {ui.birr}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </details>
        ))}
      </div>
      {source ? <p className="mt-3 border-t border-border pt-3 text-xs text-muted">{ui.menuFrom.replace("{source}", source)}</p> : null}
    </section>
  );
}
