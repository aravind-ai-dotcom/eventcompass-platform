/**
 * Upsert the full Voice Compass knowledge catalog into Firestore.
 * Merges compass voice seed (49) + official FAQ-lite (34) without deleting existing docs.
 *
 * Run: npm run seed:txc-voice-knowledge-full
 */
import admin from "firebase-admin";
import path from "path";
import {
  txcKnowledgeCategories,
  txcKnowledgeSeed,
} from "../src/data/seeds/txcKnowledgeSeed";
import { TXC_VOICE_KNOWLEDGE_SEED } from "../src/data/seeds/txcVoiceKnowledgeSeed";
import { faqRecordsToVoiceKnowledge } from "../src/lib/txcFaqVoiceKnowledgeMapper";
import { voiceKnowledgeFirestorePayload } from "../src/lib/voiceKnowledgeFirestorePayload";

import type { VoiceKnowledgeRecord } from "../src/types/voiceKnowledge";

const BASE = "organizations/ibm/events/txc2026";

async function upsertVoiceRecords(
  db: admin.firestore.Firestore,
  records: VoiceKnowledgeRecord[],
  label: string,
  defaults?: { source?: string; updatedBy?: string },
): Promise<number> {
  const col = db.collection(`${BASE}/voice_knowledge`);
  for (const record of records) {
    const payload = voiceKnowledgeFirestorePayload(record, defaults);
    await col.doc(record.id).set(payload, { merge: true });
  }
  console.log(`Upserted ${records.length} ${label} into voice_knowledge`);
  return records.length;
}

async function main() {
  const serviceAccount = require(path.join(process.cwd(), "serviceAccountKey.json"));
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  const db = admin.firestore();

  const compassCount = await upsertVoiceRecords(
    db,
    TXC_VOICE_KNOWLEDGE_SEED,
    "Compass voice seed records",
    { source: "compass_seed", updatedBy: "seed" },
  );

  const faqCount = await upsertVoiceRecords(
    db,
    faqRecordsToVoiceKnowledge(txcKnowledgeSeed),
    "official FAQ-lite records",
    { source: "official_txc_faq", updatedBy: "faq_migration" },
  );

  for (const category of txcKnowledgeCategories) {
    await db
      .collection(`${BASE}/voice_knowledge_categories`)
      .doc(category.category_id)
      .set(category, { merge: true });
  }
  console.log(`Upserted ${txcKnowledgeCategories.length} categories into voice_knowledge_categories`);

  const snap = await db.collection(`${BASE}/voice_knowledge`).get();
  console.log(`Done. voice_knowledge now has ${snap.size} total documents (${compassCount} compass + ${faqCount} FAQ, deduped by id).`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
