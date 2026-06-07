import admin from "firebase-admin";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function importChampions() {
  const raw = fs.readFileSync("data/txc2026/champions.json", "utf8");
  const data = JSON.parse(raw);
  const champions = data.champions || [];

  const collectionRef = db
    .collection("organizations")
    .doc("ibm")
    .collection("events")
    .doc("txc2026")
    .collection("champions");

  for (const champion of champions) {
    const id = champion.champion_id;
    await collectionRef.doc(id).set(champion, { merge: true });
    console.log(`Imported champion: ${id}`);
  }

  console.log(`Done. Imported ${champions.length} champions.`);
}

importChampions().catch((error) => {
  console.error(error);
  process.exit(1);
});