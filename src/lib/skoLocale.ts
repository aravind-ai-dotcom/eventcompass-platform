// =============================================================================
// SKO locale helpers — APAC / GCG / HK Chinese briefing eligibility
// =============================================================================

import { SKO_UI_LABELS_ZH } from "@/types/sko";

const APAC_GEOS = new Set(["APAC", "GCG", "HK"]);

const CHINESE_MARKET_IDS = new Set([
  "m-gcg",
  "m-hk",
  "m-sg",
  "m-my",
  "m-id",
  "m-vn",
  "m-isa",
  "m-anz",
  "m-asean",
]);

/** True when seller should see Chinese briefing options (APAC, GCG, HK). */
export function isChineseBriefingEnabled(
  geoId?: string | null,
  marketId?: string | null,
): boolean {
  const geo = (geoId ?? "").trim();
  const market = (marketId ?? "").trim().toLowerCase();

  if (geo === "GCG" || geo === "HK") return true;
  if (APAC_GEOS.has(geo) && geo !== "Japan") return true;
  if (CHINESE_MARKET_IDS.has(market)) return true;
  if (market.includes("gcg") || market.includes("hk")) return true;
  if (geo === "APAC") return true;

  return false;
}

export function labelForKey(key: string, locale: "en-US" | "zh-CN"): string {
  if (locale === "zh-CN" && key in SKO_UI_LABELS_ZH) {
    return SKO_UI_LABELS_ZH[key];
  }
  return key;
}

export const SKO_CHINESE_ACTIONS = [
  { key: "Listen in Chinese", href: "/sko/compass#podcast", anchor: "podcast" },
  { key: "Read in Chinese", href: "/sko/compass#briefing", anchor: "briefing" },
  { key: "Generate Chinese Summary", href: "/sko/compass#summaries", anchor: "summaries" },
  { key: "Podcast Summary", href: "/sko/compass#podcast", anchor: "podcast" },
  { key: "Clip Summary", href: "/sko/compass#moments", anchor: "moments" },
] as const;
