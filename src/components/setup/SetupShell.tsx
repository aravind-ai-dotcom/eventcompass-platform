"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TXC_LINKS = [
  { href: "/setup/txc/knowledge", label: "Knowledge" },
  { href: "/setup/txc/voice", label: "Voice" },
  { href: "/setup/txc/stt", label: "STT" },
  { href: "/setup/txc/analytics", label: "Analytics" },
  { href: "/setup/txc/export", label: "Export" },
];

export function SetupShell({
  title,
  subtitle,
  eventLabel,
  children,
}: {
  title: string;
  subtitle?: string;
  eventLabel: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="setup-shell">
      <aside className="setup-sidebar">
        <p className="setup-sidebar-kicker">{eventLabel}</p>
        <nav>
          {TXC_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`setup-nav-link${pathname === link.href ? " is-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="setup-main">
        <header className="setup-header">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  );
}
