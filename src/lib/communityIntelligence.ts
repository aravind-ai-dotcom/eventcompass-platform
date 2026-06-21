/** Human-readable community match reasons for explainability UI. */

export function humanizeCommunityReason(raw: string): string {
  const t = raw.trim();
  if (!t) return "";

  if (/^supports your .+ path$/i.test(t)) return t;

  const topic = t.match(/^topic:\s*(.+)$/i);
  if (topic) return `Active discussions on ${topic[1].trim()}`;

  const product = t.match(/^product(?:\s+focus)?:\s*(.+)$/i);
  if (product) return `Strong ${product[1].trim()} practitioner community`;

  const track = t.match(/^track:\s*(.+)$/i);
  if (track) return `Aligned to your ${track[1].trim()} interests`;

  const tag = t.match(/^tag:\s*(.+)$/i);
  if (tag) return `Active discussions on ${tag[1].trim()}`;

  const domain = t.match(/^domain:\s*(.+)$/i);
  if (domain) return `Covers ${domain[1].trim()} expertise`;

  const role = t.match(/^role:\s*(.+)$/i);
  if (role) return `Recommended for ${role[1].trim()} roles`;

  const category = t.match(/^category:\s*(.+)$/i);
  if (category) return `Fits your ${category[1].trim()} focus`;

  if (/popular ibm community/i.test(t)) {
    return "Popular among attendees with similar interests";
  }

  if (/certification/i.test(t)) {
    return "Related to your certification path";
  }

  return t.endsWith(".") ? t.slice(0, -1) : t;
}

export function buildCommunityMatchReasons(rawReasons: string[]): string[] {
  const lines: string[] = [];
  const seen = new Set<string>();

  for (const raw of rawReasons) {
    const line = humanizeCommunityReason(raw);
    if (line && !seen.has(line)) {
      seen.add(line);
      lines.push(line);
    }
  }

  if (lines.length === 0) {
    lines.push("Popular among attendees with similar interests");
  }

  return lines.slice(0, 4);
}
