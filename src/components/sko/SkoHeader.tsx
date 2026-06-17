"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSkoAuth } from "@/context/SkoAuthContext";
import { signOutSkoUser } from "@/lib/skoAuth";

const NAV = [
  { href: "/content", label: "Explore SKO" },
  { href: "/pulse", label: "Pulse" },
  { href: "/profile", label: "My Compass" },
];

export default function SkoHeader() {
  const pathname = usePathname();
  const { user, profileComplete } = useSkoAuth();

  return (
    <header className="sko-header">
      <div className="sko-header-inner">
        <Link href="/content" className="sko-brand">
          <span className="sko-brand-kicker">IBM Sales Enablement</span>
          <span className="sko-brand-title">Compass SKO</span>
        </Link>

        <nav className="sko-nav" aria-label="SKO navigation">
          {NAV.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`sko-nav-link${pathname === item.href ? " is-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="sko-header-actions">
          {user ? (
            <>
              {!profileComplete && (
                <Link href="/enroll" className="sko-btn sko-btn--primary">
                  Complete enrollment
                </Link>
              )}
              <button type="button" className="sko-btn sko-btn--ghost" onClick={() => void signOutSkoUser()}>
                Sign out
              </button>
            </>
          ) : (
            <Link href="/login" className="sko-btn sko-btn--primary">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
