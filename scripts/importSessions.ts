import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importSessions() {
  const raw = fs.readFileSync("data/txc2026/sessions.json", "utf8");
  const data = JSON.parse(raw);
  const sessions = data.sessions || [];

  const collectionRef = db
    .collection("organizations")
    .doc("ibm")
    .collection("events")
    .doc("txc2026")
    .collection("sessions");

  for (const session of sessions) {
    const id = session.session_id;
    await collectionRef.doc(id).set(session, { merge: true });
    console.log(`Imported session: ${id}`);
  }

  console.log(`Done. Imported ${sessions.length} sessions.`);
}

importSessions().catch((error) => {
  console.error(error);
  process.exit(1);
});