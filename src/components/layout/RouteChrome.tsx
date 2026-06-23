"use client";

import { usePathname } from "next/navigation";
import { SkoAuthProvider } from "@/context/SkoAuthContext";
import { AuthProvider } from "@/context/AuthContext";
import SkoHeader from "@/components/sko/SkoHeader";
import CompassHeader from "@/components/layout/CompassHeader";
import CompassFooter from "@/components/layout/CompassFooter";
import { isSkoRoute, isTxcRoute } from "@/lib/skoRoutes";

export default function RouteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  if (isSkoRoute(pathname)) {
    return (
      <SkoAuthProvider>
        <div className="sko-app">
          <SkoHeader />
          <main className="compass-main">{children}</main>
        </div>
      </SkoAuthProvider>
    );
  }

  if (isTxcRoute(pathname)) {
    return (
      <AuthProvider>
        <div className="forge-shell">
          <div className="forge-grid" aria-hidden="true" />
          <CompassHeader />
          <main className="compass-main">{children}</main>
          <CompassFooter />
        </div>
      </AuthProvider>
    );
  }

  // Neutral chrome for mixed hubs (e.g. /setup index)
  return <main className="compass-main">{children}</main>;
}
