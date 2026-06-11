// =============================================================================
// EventCompass — Participant Backup Script
// scripts/export-participants-backup.js
//
// Reads all documents from:
//   organizations/ibm/events/txc2026/participants
// Writes them to:
//   backups/participants-backup-{timestamp}.json
//
// Usage:
//   node scripts/export-participants-backup.js
//
// Prerequisites:
//   npm install firebase dotenv   (or use existing node_modules)
//   NEXT_PUBLIC_FIREBASE_* vars in .env.local
//
// Rules:
//   - Read-only. Does not modify any Firestore data.
//   - Does not touch Auth users, sessions, or champions.
// =============================================================================

// require("dotenv").config({ path: ".env.local" });

try {
  require("dotenv").config({ path: ".env.local" });
} catch (_) {}

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const fs   = require("fs");
const path = require("path");

// ── Firebase init ─────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db  = getFirestore(app);

const BASE = "organizations/ibm/events/txc2026";

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log("\nEventCompass — Participant Backup");
  console.log("──────────────────────────────────");
  console.log(`Reading from: ${BASE}/participants\n`);

  const snap = await getDocs(collection(db, `${BASE}/participants`));

  if (snap.empty) {
    console.log("No participants found. Nothing to back up.");
    process.exit(0);
  }

  const docs = snap.docs.map(d => ({ _docId: d.id, ...d.data() }));

  // Ensure backups directory exists
  const backupsDir = path.join(process.cwd(), "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const filename  = path.join(backupsDir, `participants-backup-${timestamp}.json`);

  fs.writeFileSync(filename, JSON.stringify(docs, null, 2), "utf8");

  console.log(`✓ ${docs.length} participant${docs.length !== 1 ? "s" : ""} backed up`);
  console.log(`✓ Written to: ${filename}\n`);
  process.exit(0);
}

run().catch(err => {
  console.error("Backup failed:", err.message ?? err);
  process.exit(1);
});
