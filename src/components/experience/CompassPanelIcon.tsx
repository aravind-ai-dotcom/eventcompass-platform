import type { ReactNode } from "react";

export type CompassPanelIconName =
  | "next-move"
  | "huddles"
  | "schedule"
  | "connections"
  | "interested";

interface CompassPanelIconProps {
  name: CompassPanelIconName;
  className?: string;
}

/** Minimal IBM Carbon–inspired stroke pictograms for Compass panels. */
export default function CompassPanelIcon({ name, className = "" }: CompassPanelIconProps) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 32 32",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  const paths: Record<CompassPanelIconName, ReactNode> = {
    "next-move": (
      <>
        <circle cx="16" cy="16" r="9" />
        <circle cx="16" cy="16" r="3" />
        <path d="M16 7v3M16 22v3M7 16h3M22 16h3" />
      </>
    ),
    huddles: (
      <>
        <circle cx="12" cy="13" r="4" />
        <circle cx="21" cy="13" r="4" />
        <path d="M6 26c0-4 3.5-7 8-7M26 26c0-4-3.5-7-8-7" />
      </>
    ),
    schedule: (
      <>
        <rect x="7" y="8" width="18" height="18" rx="1" />
        <path d="M11 6v4M21 6v4M7 14h18" />
        <path d="M13 19h6" />
      </>
    ),
    connections: (
      <>
        <circle cx="10" cy="16" r="3" />
        <circle cx="22" cy="10" r="3" />
        <circle cx="22" cy="22" r="3" />
        <path d="M12.8 14.6 19.4 11.4M12.8 17.4l6.6 3.2" />
      </>
    ),
    interested: (
      <>
        <circle cx="16" cy="12" r="4" />
        <path d="M8 26c0-4.5 3.6-8 8-8s8 3.5 8 8" />
        <path d="M22 14l3 3-3 3" />
      </>
    ),
  };

  return (
    <span className={`compass-panel__icon${className ? ` ${className}` : ""}`}>
      <svg {...common}>{paths[name]}</svg>
    </span>
  );
}
