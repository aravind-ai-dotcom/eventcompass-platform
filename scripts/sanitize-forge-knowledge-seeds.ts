/**
 * One-shot sanitizer — FORGE-facing copy in knowledge seeds.
 * Run: npx tsx scripts/sanitize-forge-knowledge-seeds.ts
 *
 * Preserves internal schema keys (e.g. category: "Champion").
 */

import { readFileSync, writeFileSync } from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..");
const FILES = [
  "src/data/seeds/txcKnowledgeSeed.ts",
  "src/data/seeds/txcVoiceKnowledgeSeed.ts",
  "src/data/seeds/txcGovernanceSeed.ts",
];

/** Order matters — longest / most specific first. */
const REPLACEMENTS: [string | RegExp, string][] = [
  [/IBM TechXchange 2026/g, "FORGE 2027"],
  [/TechXchange 2026/g, "FORGE 2027"],
  [/IBM TechXchange/g, "FORGE"],
  [/ibmtechxchange@gpj\.com/g, "forge@guestservices.example"],
  [/https:\/\/www\.ibm\.com\/events\/techxchange\/faq/g, "https://forge.example/faq"],
  [/Georgia World Congress Center/g, "Bayfront Innovation Center"],
  [/Atlanta, Georgia/g, "San Francisco, California"],
  [/Atlanta/g, "San Francisco"],
  [/October 26–29, 2026/g, "February 16–19, 2027"],
  [/October 26-29, 2026/g, "February 16–19, 2027"],
  [/Sunday, Oct 26/g, "Sunday, Feb 15"],
  [/Oct 26–30/g, "Feb 16–19"],
  [/Oct 26-30/g, "Feb 16–19"],
  [/Oct 26/g, "Feb 16"],
  [/Oct 28/g, "Feb 18"],
  [/Oct 29/g, "Feb 19"],
  [/IBM Champions/g, "Guides"],
  [/IBM Champion/g, "Guide"],
  [/IBM Business Partners/g, "ecosystem partners"],
  [/IBM clients/g, "enterprise clients"],
  [/IBM offers/g, "FORGE offers"],
  [/IBM requires/g, "FORGE requires"],
  [/IBM registration/g, "FORGE registration"],
  [/IBM terms/g, "FORGE terms"],
  [/IBM Z/g, "mainframe platforms"],
  [/IBM's/g, "FORGE's"],
  [/IBM /g, ""],
  [/watsonx/gi, "AI platform"],
  [/Red Hat/g, "open platform"],
  [/OpenShift/g, "container platform"],
  [/QRadar/g, "security platform"],
  [/Granite/g, "foundation models"],
  [/TechXchange/g, "Forge"],
  [/Champions/g, "Guides"],
  [/champions/g, "guides"],
  [/Champion/g, "Guide"],
  [/champion/g, "guide"],
  [/IBMid/g, "event account"],
  [/IBMid/g, "event account"],
  [/COMMON at IBM TechXchange/g, "COMMON at Forge"],
  [/HashiConf at TechXchange/g, "HashiConf at Forge"],
  [/IDUG NA/g, "IDUG summit"],
];

function sanitize(content: string): string {
  let out = content;
  for (const [from, to] of REPLACEMENTS) {
    out = out.replace(from, to);
  }
  // Restore internal TypeScript schema keys broken by Champion → Guide
  out = out.replace(/category: "Guide"/g, 'category: "Champion"');
  out = out.replace(/ForgeKnowledgeRecord/g, "TechXchangeKnowledgeRecord");
  out = out.replace(/displayText: "Forge"/g, 'displayText: "FORGE"');
  out = out.replace(/canonicalText: "Forge"/g, 'canonicalText: "FORGE"');
  out = out.replace(/experience: "Forge"/g, 'experience: "techxchange"');
  return out;
}

for (const rel of FILES) {
  const file = path.join(ROOT, rel);
  const before = readFileSync(file, "utf8");
  const after = sanitize(before);
  if (after !== before) {
    writeFileSync(file, after, "utf8");
    console.log(`Updated ${rel}`);
  } else {
    console.log(`No changes ${rel}`);
  }
}

console.log("Done.");
