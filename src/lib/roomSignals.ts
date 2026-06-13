// Shared room-signal helpers for Home and Pulse.

export const FLAG_MAP: Record<string, string> = {
  "united states": "🇺🇸", usa: "🇺🇸", us: "🇺🇸",
  "united kingdom": "🇬🇧", uk: "🇬🇧", gb: "🇬🇧", "great britain": "🇬🇧",
  canada: "🇨🇦", ca: "🇨🇦",
  germany: "🇩🇪", de: "🇩🇪",
  australia: "🇦🇺", au: "🇦🇺",
  india: "🇮🇳", in: "🇮🇳",
  france: "🇫🇷", fr: "🇫🇷",
  brazil: "🇧🇷", br: "🇧🇷",
  netherlands: "🇳🇱", nl: "🇳🇱", "the netherlands": "🇳🇱",
  spain: "🇪🇸", es: "🇪🇸",
  italy: "🇮🇹", it: "🇮🇹",
  japan: "🇯🇵", jp: "🇯🇵",
  china: "🇨🇳", cn: "🇨🇳",
  singapore: "🇸🇬", sg: "🇸🇬",
  mexico: "🇲🇽", mx: "🇲🇽",
  sweden: "🇸🇪", se: "🇸🇪",
  norway: "🇳🇴", no: "🇳🇴",
  denmark: "🇩🇰", dk: "🇩🇰",
  finland: "🇫🇮", fi: "🇫🇮",
  "south africa": "🇿🇦", za: "🇿🇦",
  "new zealand": "🇳🇿", nz: "🇳🇿",
  ireland: "🇮🇪", ie: "🇮🇪",
  poland: "🇵🇱", pl: "🇵🇱",
  switzerland: "🇨🇭", ch: "🇨🇭",
  portugal: "🇵🇹", pt: "🇵🇹",
  belgium: "🇧🇪", be: "🇧🇪",
  austria: "🇦🇹", at: "🇦🇹",
  ukraine: "🇺🇦", ua: "🇺🇦",
  israel: "🇮🇱", il: "🇮🇱",
  uae: "🇦🇪", "united arab emirates": "🇦🇪", ae: "🇦🇪",
  argentina: "🇦🇷", ar: "🇦🇷",
  colombia: "🇨🇴", co: "🇨🇴",
  chile: "🇨🇱", cl: "🇨🇱",
  kenya: "🇰🇪", ke: "🇰🇪",
  nigeria: "🇳🇬", ng: "🇳🇬",
  egypt: "🇪🇬", eg: "🇪🇬",
  indonesia: "🇮🇩", id: "🇮🇩",
  malaysia: "🇲🇾", my: "🇲🇾",
  thailand: "🇹🇭", th: "🇹🇭",
  philippines: "🇵🇭", ph: "🇵🇭",
  pakistan: "🇵🇰", pk: "🇵🇰",
  bangladesh: "🇧🇩", bd: "🇧🇩",
  "sri lanka": "🇱🇰", lk: "🇱🇰",
};

export function countryFlag(country: string): string {
  return FLAG_MAP[country.toLowerCase().trim()] ?? "🌍";
}

/** Normalize labels for org / community comparison. */
export function normalizeSignalKey(name: string): string {
  return String(name ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const SUPPRESSED_ORG_KEYS = new Set([
  "ibm",
  "international business machines",
  "ibm corp",
  "ibm corporation",
]);

/** Hide IBM as an employer, community, or attendance signal in attendee-facing views. */
export function isSuppressedOrgLabel(name: string): boolean {
  const key = normalizeSignalKey(name);
  if (!key) return false;
  if (SUPPRESSED_ORG_KEYS.has(key)) return true;
  if (key === "ibmer" || key === "ibm employee") return true;
  if (key.startsWith("ibm ") && !key.startsWith("ibm z")) return true;
  return false;
}

/** Tech tracks like "IBM Z" stay visible; IBM-as-company roles do not. */
export function isSuppressedCommunityLabel(name: string): boolean {
  const key = normalizeSignalKey(name);
  if (!key) return false;
  if (key === "ibmer" || key === "ibm champion") return true;
  return isSuppressedOrgLabel(name);
}

/** True when a participant should be excluded from public audience totals (IBM employees). */
export function isInternalParticipant(raw: Record<string, unknown>): boolean {
  const org = normalizeSignalKey(String(raw.organization ?? raw.company ?? ""));
  if (isSuppressedOrgLabel(org)) return true;

  const persona = normalizeSignalKey(String(raw.persona ?? ""));
  if (persona === "ibmer") return true;

  const esp = (raw.event_signal_profile as Record<string, unknown>) ?? {};
  const roles = (esp.roles_at_txc as string[]) ?? [];
  if (roles.some(r => normalizeSignalKey(r) === "ibmer")) return true;

  return false;
}

export function inc(map: Record<string, number>, key: unknown) {
  const k = String(key ?? "").trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + 1;
}

export function incPublicSignal(map: Record<string, number>, key: unknown) {
  const k = String(key ?? "").trim();
  if (!k || isSuppressedOrgLabel(k)) return;
  inc(map, k);
}

export function incPublicCommunity(map: Record<string, number>, key: unknown) {
  const k = String(key ?? "").trim();
  if (!k || isSuppressedCommunityLabel(k)) return;
  inc(map, k);
}

export function top(map: Record<string, number>, n = 5) {
  return Object.entries(map)
    .filter(([name]) => !isSuppressedOrgLabel(name))
    .sort(([, a], [, b]) => b - a)
    .slice(0, n);
}

export function topCommunities(map: Record<string, number>, n = 5) {
  return Object.entries(map)
    .filter(([name]) => !isSuppressedCommunityLabel(name))
    .sort(([, a], [, b]) => b - a)
    .slice(0, n);
}
