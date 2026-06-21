// =============================================================================
// EventCompass — TechXchange Certifications Firestore Seed (Admin SDK)
// scripts/seed-txc2026-certifications-admin.cjs
//
// Seeds organizations/ibm/events/txc2026/certifications from normalized catalog.
//
// Usage:
//   node scripts/seed-txc2026-certifications-admin.cjs
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

const seedPath = path.join(process.cwd(), "src/seeds/txc2026-certifications.seed.json");
const certifications = JSON.parse(fs.readFileSync(seedPath, "utf8"));

async function seedCertifications() {
  if (!Array.isArray(certifications) || certifications.length === 0) {
    throw new Error("Seed file is empty or invalid.");
  }

  const batch = db.batch();
  const now = admin.firestore.FieldValue.serverTimestamp();

  for (const cert of certifications) {
    const id = cert.certification_id;
    if (!id) {
      throw new Error(`Missing certification_id on record: ${JSON.stringify(cert)}`);
    }

    const ref = db.doc(`${BASE}/certifications/${id}`);
    batch.set(ref, {
      ...cert,
      seeded_at: now,
      updated_at: now,
    }, { merge: true });
  }

  await batch.commit();
  console.log(`Seeded ${certifications.length} certifications to ${BASE}/certifications`);
}

seedCertifications()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
