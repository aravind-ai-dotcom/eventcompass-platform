import type { Metadata } from "next";
import { SkoAuthProvider } from "@/context/SkoAuthContext";
import SkoHeader from "@/components/sko/SkoHeader";

export const metadata: Metadata = {
  title: "Compass SKO | IBM Sales Enablement",
  description: "Turn SKO into seller momentum with personalized briefings, podcasts, and pulse intelligence.",
};

export default function SkoLayout({ children }: { children: React.ReactNode }) {
  return (
    <SkoAuthProvider>
      <div className="sko-app">
        <SkoHeader />
        {children}
      </div>
    </SkoAuthProvider>
  );
}
