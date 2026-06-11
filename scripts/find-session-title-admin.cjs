const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(process.cwd(), "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const BASE = "organizations/ibm/events/txc2026";

async function run() {
  const snap = await db.collection(`${BASE}/sessions`).get();

  snap.docs.forEach((d) => {
    const data = d.data();
    const title = String(data.title || "");

    if (
      title.includes("Sandbox") ||
      title.includes("Keynote") ||
      title.includes("Closing") ||
      title.includes("Block Party") ||
      title.includes("General Session")
    ) {
      console.log("\n----------------");
      console.log("ID:", d.id);
      console.log("TITLE:", title);
      console.log("DATE:", data.date);
      console.log("START:", data.start_time);
      console.log("SCHEDULE:", data.schedule);
    }
  });
}

run().catch(console.error);