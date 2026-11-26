import type { Content } from "@/data/content";
import NavClient from "./NavClient";

/**
 * The site header. A server component on purpose: it hands the browser only the strings the
 * nav uses, not the whole page dictionary (~11 KB on every page when the nav took `c` itself).
 */
export default function Nav({ c }: { c: Content }) {
  return (
    <NavClient
      c={{
        locale: c.locale,
        cta: c.cta,
        nav: c.nav,
        ui: { language: c.ui.language, openMenu: c.ui.openMenu, closeMenu: c.ui.closeMenu },
      }}
    />
  );
}
