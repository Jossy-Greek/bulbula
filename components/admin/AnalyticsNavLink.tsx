import Link from "next/link";

/** "Analytics" in the admin's side navigation. */
export default function AnalyticsNavLink() {
  return (
    <div className="an-navlink">
      <Link href="/admin/analytics" className="nav__link">
        <span className="nav__link-label">Analytics</span>
      </Link>
    </div>
  );
}
