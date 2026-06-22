/**
 * Seed / migrate TechXchange official FAQ-lite records into voice_knowledge.
 * Run: npm run seed:txc-knowledge
 *
 * For the full catalog (Compass voice seed + FAQ), use:
 *   npm run seed:txc-voice-knowledge-full
 *
 * Deprecated collections (do not use for new reads):
 * - organizations/ibm/events/txc2026/knowledge
 * - organizations/ibm/events/txc2026/knowledge_categories
 */
import { spawnSync } from "child_process";
import path from "path";

const fullScript = path.join(__dirname, "seed-txc-voice-knowledge-full.ts");
const result = spawnSync("npx", ["tsx", fullScript], {
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
  env: process.env,
});

process.exit(result.status ?? 1);
