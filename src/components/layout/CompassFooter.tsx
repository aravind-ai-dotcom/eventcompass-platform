"use client";

import { usePathname } from "next/navigation";

export default function CompassFooter() {
  const pathname = usePathname();
  if (!pathname.startsWith("/txc")) {
    return null;
  }
  return (
    <footer className="site-footer">
      <span>EventCompass · IBM TechXchange 2026</span>
      <span>Community · Learning · Fun</span>
    </footer>
  );
}
