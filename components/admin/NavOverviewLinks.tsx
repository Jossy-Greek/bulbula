"use client";

/* eslint-disable @next/next/no-img-element -- the admin renders outside next/image's config */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "Analytics", Icon: BarChart3, exact: false },
];

export default function NavOverviewLinks({ waiting }: { waiting: number }) {
  const path = usePathname();
  return (
    <div className="bb-nav">
      <Link href="/admin" className="bb-nav__brand">
        <img src="/favicon.svg" alt="" width={36} height={36} />
        <span>
          <strong>Bulbula Directory</strong>
          <small>Admin · Bole Bulbula</small>
        </span>
      </Link>
      <p className="bb-nav__group">Overview</p>
      {LINKS.map(({ href, label, Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link key={href} href={href} className="nav__link bb-nav__link" aria-current={active ? "page" : undefined}>
            {active ? <span className="nav__link-indicator" /> : null}
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <span className="nav__link-label">{label}</span>
            {href === "/admin" && waiting ? (
              <span className="bb-nav__count" title={`${waiting} waiting for review`}>
                {waiting > 99 ? "99+" : waiting}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
