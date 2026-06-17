/**
 * Seed TechXchange Compass governance collections in Firestore.
 * Run: npx tsx scripts/seed-txc-compass-governance.ts
 */
import admin from "firebase-admin";
import path from "path";
import {
  TXC_KNOWLEDGE_SEED,
  TXC_STT_NORMALIZATION_SEED,
  TXC_VOICE_DICTIONARY_SEED,
} from "../src/data/seeds/txcGovernanceSeed";

const BASE = "organizations/ibm/events/txc2026";

async function main() {
  const serviceAccount = require(path.join(process.cwd(), "serviceAccountKey.json"));
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  const db = admin.firestore();

  async function seedCollection<T extends { id: string }>(
    name: string,
    records: T[],
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

  await seedCollection("knowledgeBase", TXC_KNOWLEDGE_SEED);
  await seedCollection("voiceDictionary", TXC_VOICE_DICTIONARY_SEED);
  await seedCollection("sttNormalization", TXC_STT_NORMALIZATION_SEED);
  console.log("Done.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
