"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_ITEMS } from "./dashboardData";

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPipelineView = searchParams.get("filter") === "pipeline";

  function isNavActive(href) {
    return pathname === href && !(isPipelineView && href.endsWith("/tasks"));
  }

  return (
    <aside className="sidebar">
      <img className="sidebar-logo" src="/milex-logo.svg" alt="MileX" />
      <nav className="sidebar-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ label, icon: Icon, href }) => (
          <Link className={`nav-item ${isNavActive(href) ? "active" : ""}`} href={href} key={label}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
