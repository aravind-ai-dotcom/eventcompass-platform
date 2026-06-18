import type { Metadata } from "next";
import TechXchangePulsePage from "@/components/pulse/TechXchangePulsePage";

export const metadata: Metadata = {
  title: "Pulse | IBM TechXchange 2026",
  description:
    "Live TechXchange audience signals — communities forming, conversations beginning, opportunities emerging.",
};

export default function TxcPulsePage() {
  return <TechXchangePulsePage />;
}
