import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compass | IBM TechXchange 2026",
  description:
    "Prepare, meet, experience, and continue your momentum at IBM TechXchange 2026.",
};

export default function TxcLayout({ children }: { children: React.ReactNode }) {
  return children;
}
