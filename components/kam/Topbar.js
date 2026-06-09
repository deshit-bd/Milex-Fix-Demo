"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FiBell, FiHelpCircle, FiLogOut, FiMenu, FiSearch, FiSettings, FiX } from "react-icons/fi";
import { logout } from "@/lib/auth";
import { NAV_ITEMS } from "@/components/kam/dashboardData";
import { SALES_NAV_ITEMS } from "@/components/sales/salesData";
import { LINE_MANAGER_NAV_ITEMS } from "@/components/line-manager/lineManagerData";

function getNavItems(role) {
  if (role === "KAM") return NAV_ITEMS;
  if (role === "Line Manager") return LINE_MANAGER_NAV_ITEMS;
  return SALES_NAV_ITEMS;
}

function getDisplayName(role) {
  if (role === "KAM") return "Key Account Manager";
  if (role === "Sales Coordinator") return "Sales Coordinator";
  if (role === "Line Manager") return "Line Manager";
  return role;
}

export default function Topbar({ session }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRef = useRef(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPipelineView = searchParams.get("filter") === "pipeline";
  const navItems = getNavItems(session.role);
  const displayName = getDisplayName(session.role);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function isNavActive(href) {
    return pathname === href && !(isPipelineView && href.endsWith("/tasks"));
  }

  useEffect(() => {
    if (!profileOpen) return undefined;

    function closeProfileMenu(event) {
      if (profileRef.current?.contains(event.target)) return;
      setProfileOpen(false);
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setProfileOpen(false);
    }

    document.addEventListener("mousedown", closeProfileMenu);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeProfileMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [profileOpen]);

  return (
    <header className="topbar">
      <div className="topbar-main">
        <button
          className="mobile-menu-button"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
        <div className="search-box">
          <FiSearch />
          <input type="search" placeholder="Search accounts, leads, or proposals..." />
        </div>
      </div>
      <div className="topbar-actions">
        <span className={`topbar-user-name role-${session.role.toLowerCase().replace(/\s+/g, "-")}`}>{displayName}</span>
        <button className="topbar-secondary-action" type="button" aria-label="Help"><FiHelpCircle /></button>
        <button type="button" aria-label="Notifications"><FiBell /><i /></button>
        <button className="topbar-secondary-action" type="button" aria-label="Settings"><FiSettings /></button>
        <div className="profile-wrap" ref={profileRef}>
          <button className="avatar-button" type="button" aria-label="Open profile menu" onClick={() => setProfileOpen((open) => !open)}>{initials}</button>
          {profileOpen && (
            <div className="profile-menu">
              <strong>{displayName}</strong>
              <span>{session.title || session.role}</span>
              <small>{session.email}</small>
              <button type="button" onClick={logout}><FiLogOut /> Sign Out</button>
            </div>
          )}
        </div>
      </div>
      {menuOpen && (
        <>
          <button className="mobile-menu-backdrop" type="button" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} />
          <nav className="mobile-menu-panel" aria-label={`${session.role} mobile navigation`}>
            <img className="mobile-menu-logo" src="/milex-logo.svg" alt="MileX" />
            {navItems.map(({ label, icon: Icon, href }) => (
              <Link
                className={`mobile-menu-item ${isNavActive(href) ? "active" : ""}`}
                href={href}
                key={label}
                onClick={() => setMenuOpen(false)}
              >
                <Icon />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </>
      )}
    </header>
  );
}
