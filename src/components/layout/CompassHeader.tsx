"use client";

// ─────────────────────────────────────────────────────────────────────────────
// CompassHeader
// Brand | Nav | Theme toggle | CTA
//
// Anonymous        → "Build My Compass" primary CTA → /enroll
// Logged in        → "Build My Compass" → /enroll + Sign out
// Logged in + enrolled → "My Experience" primary CTA (far right) + Sign out
// ─────────────────────────────────────────────────────────────────────────────

import { usePathname } from "next/navigation";
import Link            from "next/link";
import Image           from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useAuth }  from "@/context/AuthContext";
import { logOut }   from "@/lib/auth";

type Theme = "dark" | "light";

const NAV_ITEMS = [
  { href: "/explore",       label: "Explore"       },
  { href: "/journey-maps",  label: "Journey Maps"  },
  { href: "/sessions",      label: "Sessions"      },
  { href: "/champions",     label: "Champions"     },
  { href: "/pulse",         label: "Pulse"         },
];

export default function CompassHeader() {
  const pathname = usePathname();
  const { user, enrolled } = useAuth();
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const stored = localStorage.getItem("compass_theme") as Theme | null;
    if (stored) applyTheme(stored);
  }, []);

  const applyTheme = useCallback((t: Theme) => {
    document.body.setAttribute("data-theme", t);
    localStorage.setItem("compass_theme", t);
    setTheme(t);
  }, []);

  return (
    <header className="site-header">
      {/* Brand */}
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

      {/* Nav */}
      <nav className="main-nav" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={
              pathname === item.href || pathname.startsWith(item.href + "/")
                ? "active"
                : ""
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Actions */}
      <div className="header-actions">
        {/* Theme toggle */}
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

        {user ? (
          <>
            {enrolled ? (
              <Link href="/experience" className="btn-primary primary-link">
                My Experience
              </Link>
            ) : (
              <Link href="/enroll" className="btn-primary primary-link">
                Build My Compass
              </Link>
            )}
            <button
              onClick={async () => { try { await logOut(); } catch {} }}
              className="btn-secondary"
              style={{ fontSize: "0.84rem", minHeight: "32px", padding: "0 12px" }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link href="/enroll" className="btn-primary primary-link">
            Build My Compass
          </Link>
        )}
      </div>
    </header>
  );
}
