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

export function inc(map: Record<string, number>, key: unknown) {
  const k = String(key ?? "").trim();
  if (!k) return;
  map[k] = (map[k] ?? 0) + 1;
}

export function top(map: Record<string, number>, n = 5) {
  return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, n);
}
