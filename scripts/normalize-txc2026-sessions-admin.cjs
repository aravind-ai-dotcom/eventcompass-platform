// =============================================================================
// EventCompass — TechXchange 2026 Session Catalog Normalization (Admin SDK)
// scripts/normalize-txc2026-sessions-admin.cjs
//
// Normalizes session times, planning_class, recommendation_tier, and minutes fields.
//
// Usage:
//   node scripts/normalize-txc2026-sessions-admin.cjs
//   node scripts/normalize-txc2026-sessions-admin.cjs --dry-run
//
// Prerequisites: serviceAccountKey.json in project root
// =============================================================================

const admin = require("firebase-admin");
const path = require("path");

const DRY_RUN = process.argv.includes("--dry-run");

const serviceAccount = require(path.join(process.cwd(), "serviceAccountKey.json"));

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

const db = admin.firestore();
const BASE = "organizations/ibm/events/txc2026";

const OFFICIAL_DAY_SLOTS = {
  Monday: [
    { start: 630, end: 690 },
    { start: 750, end: 810 },
    { start: 930, end: 990 },
    { start: 1080, end: 1260, evening: true },
  ],
  Tuesday: [
    { start: 540, end: 600, keynote: true },
    { start: 630, end: 690 },
    { start: 750, end: 810 },
    { start: 840, end: 900 },
    { start: 930, end: 990 },
    { start: 1020, end: 1080 },
  ],
  Wednesday: [
    { start: 540, end: 600, keynote: true },
    { start: 630, end: 690 },
    { start: 750, end: 810 },
    { start: 840, end: 900 },
    { start: 930, end: 990 },
    { start: 1020, end: 1080 },
  ],
  Thursday: [
    { start: 540, end: 600 },
    { start: 630, end: 690 },
    { start: 750, end: 810 },
  ],
};

const DISALLOWED_CORE_STARTS = new Set([
  420, 450, 480, 510, 555, 570, 585, 615, 675, 690, 705,
  780, 810, 870, 885, 900, 960, 975, 990, 1020, 1050, 1230,
]);

const stats = {
  processed: 0,
  snapped: 0,
  explore: 0,
  hidden_from_focus: 0,
  duplicates: 0,
  manualReview: 0,
};

function parseTimeToMinutes(value) {
  const t = String(value ?? "").trim();
  if (!t) return null;
  const m12 = t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (m12) {
    let h = parseInt(m12[1], 10);
    const min = parseInt(m12[2], 10);
    const ap = m12[3].toLowerCase();
    if (ap === "pm" && h !== 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    return h * 60 + min;
  }
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) return parseInt(m24[1], 10) * 60 + parseInt(m24[2], 10);
  return null;
}

function minutesToHHmm(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDisplayTimeRange(startMinutes, endMinutes) {
  const fmt = mins => {
    const h24 = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    const ap = h24 >= 12 ? "PM" : "AM";
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
  };
  return `${fmt(startMinutes)} – ${fmt(endMinutes)}`;
}

function normalizeEventDay(raw, date) {
  const d = String(raw ?? date ?? "").toLowerCase();
  if (d.includes("mon") || d.includes("2026-10-26")) return "Monday";
  if (d.includes("tue") || d.includes("2026-10-27")) return "Tuesday";
  if (d.includes("wed") || d.includes("2026-10-28")) return "Wednesday";
  if (d.includes("thu") || d.includes("2026-10-29")) return "Thursday";
  return "";
}

function inferPlanningClass(doc) {
  const b = [
    doc.title,
    doc.activity_type,
    doc.session_type,
    doc.summary,
    doc.room,
    doc.schedule?.room,
  ].filter(Boolean).join(" ").toLowerCase();

  if (/certif|exam prep|certification test|credential/.test(b)) return "certification";
  if (/keynote|general session/.test(b)) return "general_session";
  if (/block party|reception|networking|community night|social|meetup|lunch|grab-and-go|departure/.test(b)) {
    return /community day|community hub/.test(b) ? "community" : "networking";
  }
  if (/sandbox|expo|open destination/.test(b)) return "sandbox";
  if (/partner day|partner theater/.test(b)) return "partner";
  if (/community day|community hub|community lounge/.test(b)) return "community";
  if (/demo|tech desk|agent connect/.test(b)) return "demo";
  if (/bootcamp/.test(b)) return "bootcamp";
  if (/workshop/.test(b)) return "workshop";
  if (/instructor-led lab|hands-on lab|\blab\b/.test(b)) return "lab";
  if (/technical breakout|breakout session|\bbreakout\b/.test(b)) return "core_session";
  if (/destination|open activity|walk-in/.test(b)) return "open_activity";

  const activity = String(doc.activity_type ?? "").toLowerCase();
  if (activity.includes("lab")) return "lab";
  if (activity.includes("workshop")) return "workshop";
  if (activity.includes("keynote") || activity.includes("general")) return "general_session";
  if (activity.includes("breakout")) return "core_session";
  return "core_session";
}

function inferRecommendationTier(planningClass) {
  switch (planningClass) {
    case "general_session": return "must_attend";
    case "certification": return "hidden_from_focus";
    case "demo": return "optional";
    case "sandbox":
    case "community":
    case "partner":
    case "open_activity":
    case "networking":
      return "explore";
    case "lab":
    case "workshop":
    case "bootcamp":
      return "strong_match";
    case "core_session":
      return "strong_match";
    default:
      return "optional";
  }
}

function nearestOfficialSlot(day, startMinutes, opts = {}) {
  const slots = OFFICIAL_DAY_SLOTS[day];
  if (!slots?.length) return null;

  let candidates = slots;
  if (!opts.eveningOk) candidates = candidates.filter(s => !s.evening);
  if (!opts.keynoteOk) candidates = candidates.filter(s => !s.keynote);
  if (candidates.length === 0) candidates = slots;

  let best = candidates[0];
  let bestDist = Math.abs(startMinutes - best.start);
  for (const slot of candidates) {
    const dist = Math.abs(startMinutes - slot.start);
    if (dist < bestDist) {
      best = slot;
      bestDist = dist;
    }
  }
  return best;
}

function normalizeSession(doc) {
  const schedule = doc.schedule ?? {};
  const day = normalizeEventDay(schedule.day ?? doc.day, schedule.date ?? doc.date);
  const planning_class = doc.planning_class ?? inferPlanningClass({ ...doc, schedule });

  let startMinutes = typeof doc.start_minutes === "number"
    ? doc.start_minutes
    : parseTimeToMinutes(schedule.start_time ?? doc.start_time);

  let endMinutes = typeof doc.end_minutes === "number"
    ? doc.end_minutes
    : parseTimeToMinutes(schedule.end_time ?? doc.end_time);

  let snapped = false;
  const needsReview = [];

  if (!day) needsReview.push("missing_day");
  if (!doc.title) needsReview.push("missing_title");

  const eveningOk = ["networking", "community", "sandbox", "open_activity"].includes(planning_class);
  const keynoteOk = planning_class === "general_session";

  if (day && startMinutes != null) {
    const onDisallowed = DISALLOWED_CORE_STARTS.has(startMinutes);
    const needsSnap =
      onDisallowed
      || (planning_class === "core_session")
      || (planning_class === "lab" && onDisallowed)
      || (planning_class === "general_session" && startMinutes !== 540);

    if (needsSnap || planning_class === "core_session" || planning_class === "lab") {
      const slot = nearestOfficialSlot(day, startMinutes, { eveningOk, keynoteOk });
      if (slot) {
        if (planning_class === "general_session" && day !== "Monday") {
          startMinutes = 540;
          endMinutes = 600;
        } else if (planning_class === "core_session" || planning_class === "lab") {
          startMinutes = slot.start;
          endMinutes = planning_class === "lab" && endMinutes && endMinutes - startMinutes > 75
            ? slot.start + 90
            : slot.start + 60;
        } else if (eveningOk && slot.evening) {
          startMinutes = slot.start;
          endMinutes = slot.end;
        } else if (needsSnap) {
          startMinutes = slot.start;
          endMinutes = slot.end;
        }
        snapped = startMinutes !== parseTimeToMinutes(schedule.start_time ?? doc.start_time);
      }
    }

    if (planning_class === "workshop" || planning_class === "bootcamp") {
      const validStarts = [630, 750, 840, 930];
      const nearest = validStarts.reduce((a, b) =>
        Math.abs(startMinutes - a) < Math.abs(startMinutes - b) ? a : b,
      );
      if (Math.abs(startMinutes - nearest) <= 90) {
        const duration = endMinutes && endMinutes > startMinutes ? endMinutes - startMinutes : 90;
        startMinutes = nearest;
        endMinutes = nearest + Math.max(60, Math.min(180, duration));
        snapped = true;
      }
    }
  }

  if (startMinutes == null) {
    needsReview.push("missing_start_time");
    startMinutes = 630;
    endMinutes = 690;
  }

  if (endMinutes == null || endMinutes <= startMinutes) {
    endMinutes = startMinutes + (planning_class === "demo" ? 30 : 60);
  }

  const start_time = minutesToHHmm(startMinutes);
  const end_time = minutesToHHmm(endMinutes);
  const display_time = formatDisplayTimeRange(startMinutes, endMinutes);

  const recommendation_tier = doc.recommendation_tier ?? inferRecommendationTier(planning_class);
  const explore_anytime = recommendation_tier === "explore"
    || ["sandbox", "open_activity", "community", "partner"].includes(planning_class);

  if (snapped) stats.snapped += 1;
  if (recommendation_tier === "explore") stats.explore += 1;
  if (recommendation_tier === "hidden_from_focus") stats.hidden_from_focus += 1;
  if (needsReview.length) stats.manualReview += 1;

  const patch = {
    planning_class,
    recommendation_tier,
    start_minutes: startMinutes,
    end_minutes: endMinutes,
    start_time,
    end_time,
    display_time,
    explore_anytime,
    schedule: {
      ...schedule,
      day: day || schedule.day,
      start_time,
      end_time,
      display_time,
    },
    normalized_at: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (needsReview.length) patch.normalization_review = needsReview;

  return { patch, snapped, needsReview, day, planning_class, title: doc.title, startMinutes };
}

async function run() {
  console.log(`\nNormalizing TechXchange 2026 sessions${DRY_RUN ? " (DRY RUN)" : ""}…\n`);

  const snap = await db.collection(`${BASE}/sessions`).get();
  stats.processed = snap.size;

  const slotKeys = new Map();
  const batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    const { patch, day, planning_class, title, startMinutes } = normalizeSession(data);

    const dedupeKey = `${day}|${startMinutes}|${String(title ?? "").trim().toLowerCase()}`;
    if (slotKeys.has(dedupeKey)) {
      stats.duplicates += 1;
      patch.duplicate_of = slotKeys.get(dedupeKey);
    } else {
      slotKeys.set(dedupeKey, docSnap.id);
    }

    if (!DRY_RUN) {
      batch.set(docSnap.ref, patch, { merge: true });
      batchCount += 1;
      if (batchCount >= 400) {
        await batch.commit();
        batchCount = 0;
      }
    }
  }

  if (!DRY_RUN && batchCount > 0) {
    await batch.commit();
  }

  console.log("── Normalization summary ──");
  console.log(`Total sessions processed:        ${stats.processed}`);
  console.log(`Snapped to official slots:     ${stats.snapped}`);
  console.log(`Marked explore / open:         ${stats.explore}`);
  console.log(`Marked hidden_from_focus:      ${stats.hidden_from_focus}`);
  console.log(`Duplicate slot occurrences:    ${stats.duplicates}`);
  console.log(`Records needing manual review: ${stats.manualReview}`);
  console.log(DRY_RUN ? "\nDry run complete — no writes made." : "\nFirestore update complete.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
