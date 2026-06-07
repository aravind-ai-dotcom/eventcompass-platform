import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importParticipants() {
  const raw = fs.readFileSync("data/txc2026/participants.json", "utf8");
  const data = JSON.parse(raw);
  const participants = data.participants || [];

  const collectionRef = db
    .collection("organizations")
    .doc("ibm")
    .collection("events")
    .doc("txc2026")
    .collection("participants");

  for (const participant of participants) {
    const id = participant.participant_id;
    await collectionRef.doc(id).set(participant, { merge: true });
    console.log(`Imported participant: ${id}`);
  }

  console.log(`Done. Imported ${participants.length} participants.`);
}

importParticipants().catch((error) => {
  console.error(error);
  process.exit(1);
});