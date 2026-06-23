import type { Metadata } from "next";
import TechXchangePulsePage from "@/components/pulse/TechXchangePulsePage";
import { FORGE_EVENT } from "@/config/forgeBrand";

export const metadata: Metadata = {
  title: `Pulse | ${FORGE_EVENT.name}`,
  description:
    `Live ${FORGE_EVENT.name} audience signals — communities forming, conversations beginning, opportunities emerging.`,
};

export default function TxcPulsePage() {
  return <TechXchangePulsePage />;
}
