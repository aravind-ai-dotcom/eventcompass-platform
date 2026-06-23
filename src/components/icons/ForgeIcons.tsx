/** Thin-line photonic icons — Lucide-style, no external dependency. */

import type { ReactNode } from "react";

type IconProps = {
  className?: string;
  size?: number;
};

const defaults = { size: 22, className: "forge-icon" };

function IconShell({
  children,
  className = defaults.className,
  size = defaults.size,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function ForgeSessionsIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <rect x="3" y="4" width="18" height="17" rx="1.5" />
      <path d="M3 9h18" />
      <path d="M8 2v4M16 2v4" />
      <circle cx="8" cy="14" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="8" cy="17.5" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.5" r="0.75" fill="currentColor" stroke="none" />
    </IconShell>
  );
}

export function ForgeGuidesIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16.5" cy="9.5" r="2.5" />
      <path d="M4 20c0-2.8 2.2-5 5-5s5 2.2 5 5" />
      <path d="M14.5 20c0-2 1.6-3.5 3.5-3.5" />
    </IconShell>
  );
}

export function ForgeCommunitiesIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
      <path d="M5.5 7.5h13M5.5 16.5h13" />
    </IconShell>
  );
}

export function ForgeMembersIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="12" cy="7.5" r="3.25" />
      <path d="M5.5 20.5c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5" />
      <circle cx="18" cy="8.5" r="2" opacity="0.55" />
      <path d="M20.5 15.5c.8 1 1.2 2.1 1.3 3.5" opacity="0.55" />
    </IconShell>
  );
}

export function ForgeCatalogIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <path d="M4 6h16v14H4z" />
      <path d="M4 10h16" />
      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
      <path d="M8 14h8M8 17h5" />
    </IconShell>
  );
}

export function ForgeUserGroupsIcon(props: IconProps) {
  return (
    <IconShell {...props}>
      <circle cx="6.5" cy="8" r="2.5" />
      <circle cx="17.5" cy="8" r="2.5" />
      <circle cx="12" cy="5.5" r="2" />
      <path d="M2 19c0-2.5 2-4.5 4.5-4.5" />
      <path d="M22 19c0-2.5-2-4.5-4.5-4.5" />
      <path d="M8.5 19c0-1.8 1.6-3.2 3.5-3.2s3.5 1.4 3.5 3.2" />
    </IconShell>
  );
}
