import { ExternalLink } from "lucide-react";

/** Bottom of the admin's side navigation: a way back to the public site. */
export default function NavFooter() {
  return (
    <a href="/" target="_blank" rel="noopener" className="nav__link bb-nav__link bb-nav__site">
      <ExternalLink size={18} strokeWidth={1.75} aria-hidden="true" />
      <span className="nav__link-label">Open the live site</span>
    </a>
  );
}
