/**
 * Seed Compass SKO product collections in Firestore (sko_* namespace only).
 * Run: npm run seed:sko-product
 * Deploy rules first: firebase deploy --only firestore:rules
 */
import admin from "firebase-admin";
import path from "path";
import { SKO_COLLECTIONS } from "../src/lib/skoCollections";
import {
  SKO_ASSETS,
  SKO_BRIEFS,
  SKO_CLIPS,
  SKO_CONTENT_ITEMS,
  SKO_EDITION,
  SKO_GEOS,
  SKO_INGEST_JOBS,
  SKO_MARKETS,
  SKO_PERSONAS,
  SKO_PODCASTS,
  SKO_PULSE_METRICS,
  SKO_PULSE_QUOTES,
  SKO_SELLER_USERS,
  SKO_SPEAKERS,
} from "../src/data/seeds/skoProductSeed";

async function seedCollection(
  db: admin.firestore.Firestore,
  name: string,
  records: Array<{ id?: string; uid?: string }>,
  skipIfPopulated = true,
): Promise<number> {
  const col = db.collection(name);
  if (skipIfPopulated) {
    const existing = await col.limit(1).get();
    if (!existing.empty) {
      console.log(`Skip ${name} — already populated`);
      return 0;
    }
  }
  for (const record of records) {
    const docId = record.id ?? record.uid;
    if (!docId) continue;
    await col.doc(docId).set(record);
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

  await seedCollection(db, SKO_COLLECTIONS.editions, [SKO_EDITION]);
  await seedCollection(db, SKO_COLLECTIONS.geos, SKO_GEOS);
  await seedCollection(db, SKO_COLLECTIONS.markets, SKO_MARKETS);
  await seedCollection(db, SKO_COLLECTIONS.sellerPersonas, SKO_PERSONAS);
  await seedCollection(db, SKO_COLLECTIONS.speakers, SKO_SPEAKERS);
  await seedCollection(db, SKO_COLLECTIONS.contentItems, SKO_CONTENT_ITEMS);
  await seedCollection(db, SKO_COLLECTIONS.contentAssets, SKO_ASSETS);
  await seedCollection(db, SKO_COLLECTIONS.contentClips, SKO_CLIPS);
  await seedCollection(db, SKO_COLLECTIONS.ingestJobs, SKO_INGEST_JOBS);
  await seedCollection(db, SKO_COLLECTIONS.pulseMetrics, SKO_PULSE_METRICS);
  await seedCollection(db, SKO_COLLECTIONS.pulseQuotes, SKO_PULSE_QUOTES);
  await seedCollection(db, SKO_COLLECTIONS.briefs, SKO_BRIEFS);
  await seedCollection(db, SKO_COLLECTIONS.podcasts, SKO_PODCASTS);
  await seedCollection(db, SKO_COLLECTIONS.users, SKO_SELLER_USERS);

  console.log("SKO product seed complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
