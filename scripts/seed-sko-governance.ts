/**
 * Seed SKO governance collections (knowledge, summaries, translation memory).
 * Run: npm run seed:sko-governance
 */
import admin from "firebase-admin";
import path from "path";
import {
  SKO_GOVERNANCE_SUMMARIES_SEED,
  SKO_KNOWLEDGE_SEED,
  SKO_TRANSLATION_MEMORY_SEED,
} from "../src/data/seeds/skoGovernanceSeed";
import { SKO_EVENT_ID } from "../src/lib/compassEventPaths";

const BASE = `organizations/ibm/events/${SKO_EVENT_ID}`;

async function seedCollection(
  db: admin.firestore.Firestore,
  name: string,
  records: Array<{ id: string }>,
): Promise<number> {
  const col = db.collection(`${BASE}/${name}`);
  const existing = await col.limit(1).get();
  if (!existing.empty) {
    console.log(`Skip ${name} — already populated`);
    return 0;
  }
  for (const record of records) {
    await col.doc(record.id).set(record);
  }
  console.log(`Seeded ${records.length} docs into ${name}`);
  return records.length;
}

async function main() {
  const serviceAccount = require(path.join(process.cwd(), "serviceAccountKey.json"));
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  const db = admin.firestore();

  await seedCollection(db, "knowledgeBase", SKO_KNOWLEDGE_SEED);
  await seedCollection(db, "translationMemory", SKO_TRANSLATION_MEMORY_SEED);
  await seedCollection(db, "contentSummaries", SKO_GOVERNANCE_SUMMARIES_SEED);
  console.log("SKO governance seed complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
