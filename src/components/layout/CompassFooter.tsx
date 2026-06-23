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
      <span>EventCompass · {FORGE_EVENT.name}</span>
      <span>Networking · Learning · Fun</span>
    </footer>
  );
}
