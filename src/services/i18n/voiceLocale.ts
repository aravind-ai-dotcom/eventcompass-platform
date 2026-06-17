// =============================================================================
// Compass UI + voice locale helpers (separate from voice dictionary)
// =============================================================================

import enUS from "./en-US.json";
import zhCN from "./zh-CN.json";
import type { GovernanceLanguage } from "@/types/compassGovernance";

export type UiLocale = GovernanceLanguage;
export type VoiceLocale = GovernanceLanguage;

const UI_STRINGS: Record<UiLocale, Record<string, string>> = {
  "en-US": enUS,
  "zh-CN": zhCN,
};

export function t(key: keyof typeof enUS, locale: UiLocale = "en-US"): string {
  return UI_STRINGS[locale][key] ?? UI_STRINGS["en-US"][key] ?? key;
}

export function resolveVoiceLocale(value?: string | null): VoiceLocale {
  if (value === "zh-CN" || value === "zh") return "zh-CN";
  return "en-US";
}

export function localeFromSpeechLang(lang: string): VoiceLocale {
  if (lang.toLowerCase().startsWith("zh")) return "zh-CN";
  return "en-US";
}
