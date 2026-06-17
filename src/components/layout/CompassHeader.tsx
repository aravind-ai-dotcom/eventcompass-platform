"use client";

// TechXchange header — only rendered on /txc/* routes via RouteChrome.

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { logOut } from "@/lib/auth";

type Theme = "dark" | "light";

const NAV_ITEMS = [
  { href: "/txc/explore", label: "Explore" },
  { href: "/txc/sessions", label: "Sessions" },
  { href: "/txc/champions", label: "Champions" },
  { href: "/txc/experience", label: "My Compass" },
];

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.25" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8H3M13 8h1.5M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11.2 2.4a5.6 5.6 0 1 0 6.4 8.8A6.4 6.4 0 0 1 11.2 2.4Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2.5 4.5h13M2.5 9h13M2.5 13.5h13" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M4.5 4.5l9 9M13.5 4.5l-9 9" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
    </svg>
  );
}

export default function CompassHeader() {
  const pathname = usePathname();
  const { user, enrolled } = useAuth();
  const [theme, setTheme] = useState<Theme>("dark");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("compass_theme") as Theme | null;
    if (stored) applyTheme(stored);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const applyTheme = useCallback((t: Theme) => {
    document.body.setAttribute("data-theme", t);
    localStorage.setItem("compass_theme", t);
    setTheme(t);
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const drawerLinks = [
    { href: "/txc", label: "TechXchange" },
    ...NAV_ITEMS,
  ];

  return (
    <header className="site-header">
      <Link href="/txc" className="brand" aria-label="TechXchange Compass home">
        <Image
          src={theme === "dark" ? "/compass-mark-white.jpeg" : "/compass-mark-black.png"}
          alt=""
          aria-hidden="true"
          width={28}
          height={28}
          style={{ objectFit: "contain", flexShrink: 0 }}
          priority
        />
        <span className="brand-word">Compass</span>
        <span className="brand-sub">TechXchange</span>
      </Link>

      <nav className="site-nav" aria-label="TechXchange navigation">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`site-nav-link${isActive(item.href) ? " is-active" : ""}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="site-header-actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <SunIcon /> : <MoonIcon />}
        </button>

        {user && enrolled ? (
          <Link href="/txc/experience" className="btn-primary site-header-cta">My Compass</Link>
        ) : (
          <Link href="/txc/enroll" className="btn-primary site-header-cta">Build My Compass</Link>
        )}

        {user && (
          <button type="button" className="btn-ghost" onClick={() => void logOut()}>
            Sign out
          </button>
        )}

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>

      {menuOpen && (
        <div className="mobile-drawer" role="dialog" aria-modal="true">
          <nav className="mobile-drawer-nav">
            {drawerLinks.map(item => (
              <Link key={item.href} href={item.href} className="mobile-drawer-link">
                {item.label}
              </Link>
            ))}
            {user ? (
              <button type="button" className="mobile-drawer-link" onClick={() => void logOut()}>
                Sign out
              </button>
            ) : (
              <Link href="/txc/login" className="mobile-drawer-link">Sign in</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
