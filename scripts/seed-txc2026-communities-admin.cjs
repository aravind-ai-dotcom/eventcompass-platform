// =============================================================================
// EventCompass — IBM TechXchange Communities Firestore Seed (Admin SDK)
// scripts/seed-txc2026-communities-admin.cjs
//
// Seeds organizations/ibm/events/txc2026/communities from the normalized catalog.
//
// Usage:
//   node scripts/seed-txc2026-communities-admin.cjs
//
// Prerequisites:
//   npm install firebase-admin
//   serviceAccountKey.json in project root
// =============================================================================

const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require(path.join(process.cwd(), "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const BASE = "organizations/ibm/events/txc2026";

const seedPath = path.join(process.cwd(), "src/seeds/ibm-techxchange-communities.seed.json");
const communities = JSON.parse(fs.readFileSync(seedPath, "utf8"));

async function seedCommunities() {
  if (!Array.isArray(communities) || communities.length === 0) {
    throw new Error("Seed file is empty or invalid.");
  }

  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const community of communities) {
    const id = community.community_id;
    if (!id) {
      throw new Error(`Missing community_id on record: ${JSON.stringify(community)}`);
    }

    const ref = db.doc(`${BASE}/communities/${id}`);
    batch.set(ref, {
      ...community,
      seeded_at: now,
      updated_at: now,
    }, { merge: true });
  }

  await batch.commit();
  console.log(`Seeded ${communities.length} communities to ${BASE}/communities`);
}

seedCommunities()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
