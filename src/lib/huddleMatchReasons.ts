import type { HuddleClassification } from "@/types/huddleDataModel";
import { classificationLabel } from "@/services/huddleMatchingService";

/** Turn raw match reasons into user-facing bullet labels. */
export function formatHuddleMatchBullets(
  reasons: string[],
  classification?: HuddleClassification,
): string[] {
  const bullets: string[] = [];

  for (const reason of reasons) {
    const r = reason.trim();
    if (!r) continue;

    if (/^you are hosting/i.test(r)) {
      bullets.push("You are hosting");
      continue;
    }
    if (/^alumni:/i.test(r)) {
      bullets.push(`${r.replace(/^alumni:\s*/i, "")} Alumni`);
      continue;
    }
    if (/^past employer:/i.test(r)) {
      bullets.push(`Former ${r.replace(/^past employer:\s*/i, "")} Employees`);
      continue;
    }
    if (/^certification:/i.test(r)) {
      bullets.push(`${r.replace(/^certification:\s*/i, "")} Certification Goal`);
      continue;
    }
    if (/^track:/i.test(r)) {
      bullets.push(`${r.replace(/^track:\s*/i, "")} Interest`);
      continue;
    }
    if (/^matches your (.+) focus/i.test(r)) {
      const m = r.match(/^matches your (.+) focus/i);
      if (m) bullets.push(`${m[1]} Interest`);
      continue;
    }
    if (/^topic overlap:/i.test(r)) {
      bullets.push(`${r.replace(/^topic overlap:\s*/i, "")} Interest`);
      continue;
    }
    if (/^role:/i.test(r)) {
      bullets.push(`${r.replace(/^role:\s*/i, "")} Role Match`);
      continue;
    }
    if (/^public huddle$/i.test(r)) {
      bullets.push("Open event invitation");
      continue;
    }
    if (/^open conversation/i.test(r)) {
      bullets.push("Community conversation");
      continue;
    }
    if (/^matched to your profile$/i.test(r) && classification) {
      bullets.push(`${classificationLabel(classification)} match`);
      continue;
    }

    bullets.push(r.endsWith(".") ? r.slice(0, -1) : r);
  }

  return [...new Set(bullets)].slice(0, 4);
}
