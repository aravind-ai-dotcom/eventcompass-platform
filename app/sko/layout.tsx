import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compass SKO | IBM Sales Enablement",
  description: "SKO seller routes",
};

export default function SkoSegmentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
