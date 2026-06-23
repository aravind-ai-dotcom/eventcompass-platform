import type { Metadata } from "next";
import { FORGE_EVENT, FORGE_PRODUCT } from "@/config/forgeBrand";

export const metadata: Metadata = {
  title: `${FORGE_PRODUCT.name} | ${FORGE_EVENT.name}`,
  description:
    `${FORGE_EVENT.tagline} — ${FORGE_PRODUCT.tagline} for ${FORGE_EVENT.name}.`,
};

export default function TxcLayout({ children }: { children: React.ReactNode }) {
  return children;
}
