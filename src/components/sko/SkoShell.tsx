"use client";

import { SkoAuthProvider } from "@/context/SkoAuthContext";
import SkoHeader from "@/components/sko/SkoHeader";

export default function SkoShell({ children }: { children: React.ReactNode }) {
  return (
    <SkoAuthProvider>
      <div className="sko-app">
        <SkoHeader />
        {children}
      </div>
    </SkoAuthProvider>
  );
}
