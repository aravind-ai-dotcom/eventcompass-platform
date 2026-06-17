"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CompassHeader
// Brand | Nav | Theme toggle | CTA
//
// Anonymous        → "Build My Compass" primary CTA → /enroll
// Logged in        → "Build My Compass" → /enroll + Sign out
// Logged in + enrolled → "My Compass" primary CTA (far right) + Sign out
// Mobile           → compact hamburger drawer
// ─────────────────────────────────────────────────────────────────────────────

import { usePathname } from "next/navigation";
import Link            from "next/link";
import Image           from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useAuth }  from "@/context/AuthContext";
import { logOut }   from "@/lib/auth";

type Theme = "dark" | "light";

const NAV_ITEMS = [
  { href: "/explore",   label: "Explore"   },
  { href: "/sessions",  label: "Sessions"  },
  { href: "/champions", label: "Champions" },
  { href: "/pulse",     label: "Pulse"     },
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
  if (pathname.startsWith("/sko") || pathname.startsWith("/setup/sko")) {
    return null;
  }
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
    { href: "/", label: "Compass" },
    ...NAV_ITEMS,
    ...(user && enrolled ? [{ href: "/experience", label: "My Compass" }] : []),
  ];

  return (
    <header className="site-header">
      <Link href="/" className="brand" aria-label="Compass home">
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

      <button
        type="button"
        className="header-menu-toggle"
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen(open => !open)}
      >
        {menuOpen ? <CloseIcon /> : <MenuIcon />}
      </button>

      <div className="header-nav-scroll header-nav-desktop">
        <nav className="main-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={isActive(item.href) ? "active" : ""}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="header-actions">
        <div className="theme-toggle" role="group" aria-label="Color mode">
          <button
            type="button"
            className={theme === "light" ? "active" : ""}
            aria-label="Light mode"
            aria-pressed={theme === "light"}
            onClick={() => applyTheme("light")}
          >
            <SunIcon />
          </button>
          <button
            type="button"
            className={theme === "dark" ? "active" : ""}
            aria-label="Dark mode"
            aria-pressed={theme === "dark"}
            onClick={() => applyTheme("dark")}
          >
            <MoonIcon />
          </button>
        </div>

        {user ? (
          <>
            {enrolled ? (
              <Link href="/experience" className="btn-primary primary-link header-cta-desktop">
                My Compass
              </Link>
            ) : (
              <Link href="/enroll" className="btn-primary primary-link header-cta-desktop">
                Build My Compass
              </Link>
            )}
            <button
              type="button"
              onClick={async () => { try { await logOut(); } catch {} }}
              className="header-sign-out header-cta-desktop"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link href="/enroll" className="btn-primary primary-link header-cta-desktop">
            Build My Compass
          </Link>
        )}
      </div>

      {menuOpen && (
        <>
          <button
            type="button"
            className="header-drawer-backdrop"
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="header-drawer" aria-label="Mobile navigation">
            {drawerLinks.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={isActive(item.href) ? "active" : ""}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="header-drawer-actions">
              {user ? (
                enrolled ? (
                  <Link href="/experience" className="btn-primary" onClick={() => setMenuOpen(false)}>
                    My Compass
                  </Link>
                ) : (
                  <Link href="/enroll" className="btn-primary" onClick={() => setMenuOpen(false)}>
                    Build My Compass
                  </Link>
                )
              ) : (
                <Link href="/enroll" className="btn-primary" onClick={() => setMenuOpen(false)}>
                  Build My Compass
                </Link>
              )}
              {user && (
                <button
                  type="button"
                  className="header-sign-out"
                  onClick={async () => {
                    setMenuOpen(false);
                    try { await logOut(); } catch {}
                  }}
                >
                  Sign out
                </button>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  );
}
