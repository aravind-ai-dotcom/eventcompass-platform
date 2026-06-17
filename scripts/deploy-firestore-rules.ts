/**
 * Deploy Firestore rules using service account (no firebase login required).
 * Run: npm run deploy:firestore-rules:admin
 */
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

async function main() {
  const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
  const rulesPath = path.join(process.cwd(), "firestore.rules");

  if (!fs.existsSync(serviceAccountPath)) {
    console.error("Missing serviceAccountKey.json");
    process.exit(1);
  }

  const serviceAccount = require(serviceAccountPath);
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const source = fs.readFileSync(rulesPath, "utf8");
  const ruleset = await admin.securityRules().releaseFirestoreRulesetFromSource(source);
  console.log("Firestore rules deployed:", ruleset.name);
}

main().catch(err => {
  console.error("Rules deploy failed:", err);
  process.exit(1);
});
