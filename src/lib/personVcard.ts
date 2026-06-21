import type { RecommendedPerson } from "@/components/people/RecommendedConnectionCard";
import { enrichLinkedInForPerson } from "@/lib/demoLinkedInEnrichment";

function escapeVCard(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function splitDisplayName(displayName: string): { first: string; last: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "", last: "" };
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

export function buildPersonVCardContent(
  person: RecommendedPerson,
  matchReasons: string[],
): string {
  const { first, last } = splitDisplayName(person.display_name);
  const org = person.organization ?? person.company ?? "";
  const linkedIn = enrichLinkedInForPerson(person);
  const url =
    linkedIn?.linkedinVisibility === "visible" ? linkedIn.linkedin_url : undefined;

  const noteLines = [
    "Recommended by Compass:",
    ...matchReasons.slice(0, 5),
  ];

  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${escapeVCard(person.display_name)}`,
  ];
  if (last) {
    lines.push(`N:${escapeVCard(last)};${escapeVCard(first)};;;`);
  } else if (first) {
    lines.push(`N:${escapeVCard(first)};;;;`);
  }
  if (person.title) lines.push(`TITLE:${escapeVCard(person.title)}`);
  if (org) lines.push(`ORG:${escapeVCard(org)}`);
  if (url) lines.push(`URL:${escapeVCard(url)}`);
  lines.push(`NOTE:${escapeVCard(noteLines.join("\n"))}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

export function downloadPersonVCard(
  person: RecommendedPerson,
  matchReasons: string[],
): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([buildPersonVCardContent(person, matchReasons)], {
    type: "text/vcard;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const slug = person.display_name.replace(/\s+/g, "-").toLowerCase() || "connection";
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
