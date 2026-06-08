"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CompassHeader
// Mirrors header.php exactly: brand, nav, theme toggle, CTA.
// Enrolled state shows "My Experience" link.
// Theme toggle writes data-theme to <body> (no page reload).
// ─────────────────────────────────────────────────────────────────────────────

import { usePathname } from "next/navigation";
import Link  from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type Theme = "dark" | "light";
type EnrollState = "new" | "enrolled";

// Nav items mirror header.php $navItems exactly
const NAV_ENROLLED = [
  { href: "/experience",    label: "My Experience" },
  { href: "/explore",       label: "Explore" },
  { href: "/sessions",      label: "Sessions" },
  { href: "/champions",     label: "Champions" },
  { href: "/pulse",         label: "Pulse" },
];

const NAV_NEW = [
  { href: "/explore",       label: "Explore" },
  { href: "/sessions",      label: "Sessions" },
  { href: "/champions",     label: "Champions" },
  { href: "/pulse",         label: "Pulse" },
];

export default function CompassHeader() {
  const pathname = usePathname();

  const [theme, setTheme]       = useState<Theme>("dark");
  const [enrollState, setEnroll] = useState<EnrollState>("new");

  // Read stored theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("compass_theme") as Theme | null;
    if (stored) applyTheme(stored);
    // Derive enroll state from pathname as a simple signal
    if (pathname.startsWith("/experience")) setEnroll("enrolled");
  }, [pathname]);

  const applyTheme = useCallback((t: Theme) => {
    document.body.setAttribute("data-theme", t);
    localStorage.setItem("compass_theme", t);
    setTheme(t);
  }, []);

  const isEnrolled = enrollState === "enrolled" || pathname.startsWith("/experience");
  const navItems   = isEnrolled ? NAV_ENROLLED : NAV_NEW;
  const ctaLabel   = isEnrolled ? "Update My Compass" : "Build My Compass";

  return (
    <header className="site-header">
      {/* Brand */}
      <Link href="/" className="brand" aria-label="Compass home">
        {/* Logo mark — swaps between white (dark theme) and black (light theme) */}
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
      </Link>

      {/* Nav */}
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href || pathname.startsWith(item.href + "/") ? "active" : ""}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Actions */}
      <div className="header-actions">
        {/* Theme toggle — mirrors .mode-switch in PHP */}
        <div className="mode-switch" aria-label="Color mode">
          <a
            href="#"
            className={theme === "dark" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); applyTheme("dark"); }}
          >
            Dark
          </a>
          <a
            href="#"
            className={theme === "light" ? "active" : ""}
            onClick={(e) => { e.preventDefault(); applyTheme("light"); }}
          >
            Light
          </a>
        </div>

        <Link href="/enroll" className="btn-primary primary-link">
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
