cat > scripts/repair-txc2026-session-times-admin.cjs <<'EOF'
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

const repairs = [
  {
    matchTitle: "Sandbox Block Party: Community, Demos, and Builder Energy",
    patch: {
      date: "2026-10-26",
      start_time: "06:30 PM",
      end_time: "09:30 PM",
      room: "Sandbox Expo",
      schedule: {
        day: "Monday",
        date: "2026-10-26",
        start_time: "06:30 PM",
        end_time: "09:30 PM",
        room: "Sandbox Expo",
      },
    },
  },
  {
    matchTitle: "Closing Main Stage: Turn Your Week Into A Plan",
    patch: {
      date: "2026-10-29",
      start_time: "12:00 PM",
      end_time: "01:00 PM",
      room: "Departure Area",
      title: "Departures — Grab & Go Lunch",
      activity_type: "Logistics",
      session_type: "Departure",
      summary: "Thursday departure window with grab-and-go lunch. No closing ceremony is scheduled.",
      schedule: {
        day: "Thursday",
        date: "2026-10-29",
        start_time: "12:00 PM",
        end_time: "01:00 PM",
        room: "Departure Area",
      },
    },
  },
  {
    matchTitle: "The TechXchange Opening Keynote: Build What Matters Next",
    patch: {
      date: "2026-10-27",
      start_time: "09:00 AM",
      end_time: "09:45 AM",
      room: "Main Stage",
      activity_type: "General Session",
      session_type: "Keynote",
      schedule: {
        day: "Tuesday",
        date: "2026-10-27",
        start_time: "09:00 AM",
        end_time: "09:45 AM",
        room: "Main Stage",
      },
    },
  },
];

async function run() {
  console.log("\nRepairing TechXchange 2026 session times…\n");

  const snap = await db.collection(`${BASE}/sessions`).get();

  for (const repair of repairs) {
    const matches = snap.docs.filter((d) => {
      const data = d.data();
      return String(data.title ?? "").trim() === repair.matchTitle;
    });

    if (matches.length === 0) {
      console.log(`⚠ Not found: ${repair.matchTitle}`);
      continue;
    }

    for (const d of matches) {
      await d.ref.set(
        {
          ...repair.patch,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          repair_note: "Corrected anchor session timing for IBM demo",
        },
        { merge: true }
      );

      console.log(`✓ ${repair.matchTitle}`);
      console.log(`  ${d.id} → ${repair.patch.schedule.day} · ${repair.patch.schedule.start_time} · ${repair.patch.schedule.room}`);
    }
  }

  console.log("\nDone.\n");
}

run().catch((err) => {
  console.error("Repair failed:", err);
  process.exit(1);
});
EOF