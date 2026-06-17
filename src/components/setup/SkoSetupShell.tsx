"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const SKO_ADMIN_LINKS = [
  { href: "/setup/sko/edition", label: "Edition Setup" },
  { href: "/setup/sko/agenda", label: "Agenda" },
  { href: "/setup/sko/speakers", label: "Speakers" },
  { href: "/setup/sko/ingest", label: "Ingest" },
  { href: "/setup/sko/knowledge", label: "Knowledge" },
  { href: "/setup/sko/summaries", label: "Summaries" },
  { href: "/setup/sko/translations", label: "Translations" },
  { href: "/setup/sko/pulse", label: "Pulse Metrics" },
  { href: "/setup/sko/export", label: "Export" },
  { href: "/setup/sko/publish", label: "Publish" },
];

export function SkoSetupShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="setup-shell">
      <aside className="setup-sidebar">
        <p className="setup-sidebar-kicker">Compass SKO Admin</p>
        <nav>
          {SKO_ADMIN_LINKS.map(link => (
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
