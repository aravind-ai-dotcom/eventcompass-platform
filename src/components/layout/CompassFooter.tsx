"use client";

import { usePathname } from "next/navigation";
import { FORGE_EVENT } from "@/config/forgeBrand";

export default function CompassFooter() {
  const pathname = usePathname();
  if (!pathname.startsWith("/txc")) {
    return null;
  }
  return (
    <footer className="site-footer">
      <span>Compass · {FORGE_EVENT.name}</span>
      <span>Technology · People · Opportunity</span>
    </footer>
  );
}
