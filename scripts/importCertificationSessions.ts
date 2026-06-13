import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const serviceAccount = JSON.parse(
  fs.readFileSync("serviceAccountKey.json", "utf8"),
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const BASE = "organizations/ibm/events/txc2026";

async function importCertificationDemoData() {
  const certPath = path.join(process.cwd(), "demo-data/txc2026/certifications.json");
  const sessPath = path.join(process.cwd(), "demo-data/txc2026/certification_sessions.json");

  const certifications = JSON.parse(fs.readFileSync(certPath, "utf8"));
  const sessions = JSON.parse(fs.readFileSync(sessPath, "utf8"));

  const certRef = db.doc(`${BASE}/certification_catalog/default`);
  await certRef.set(certifications, { merge: true });
  console.log(`Imported ${certifications.certifications.length} certifications.`);

  const sessionRef = db.collection(`${BASE}/sessions`);
  for (const session of sessions.sessions) {
    const id = session.session_id;
    await sessionRef.doc(id).set(session, { merge: true });
    console.log(`Imported certification session: ${id}`);
  }

  console.log(`Done. Imported ${sessions.sessions.length} certification sessions.`);
}

importCertificationDemoData().catch(error => {
  console.error(error);
  process.exit(1);
});
