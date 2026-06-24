import type { Metadata } from "next";
import TechXchangePulsePage from "@/components/pulse/TechXchangePulsePage";
import { FORGE_EVENT } from "@/config/forgeBrand";

export const metadata: Metadata = {
  title: `Pulse | ${FORGE_EVENT.name}`,
  description:
    `Event intelligence for ${FORGE_EVENT.name} — audience intent, identity, IBM Champions presence, and communities forming.`,
};

export default function TxcPulsePage() {
  return <TechXchangePulsePage />;
}
