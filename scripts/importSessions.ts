/**
 * Safe Firestore import for normalized TechXchange session catalog JSON.
 *
 * Default input: data/normalized_sessions.json
 * Target: organizations/ibm/events/txc2026/sessions/{session_id}
 *
 * Usage:
 *   npm run import:sessions
 *   npx tsx scripts/importSessions.ts path/to/sessions.json
 */
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

const BASE = "organizations/ibm/events/txc2026";
const DEFAULT_INPUT = path.join(process.cwd(), "data/normalized_sessions.json");

type ScheduleFields = {
  day?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  room?: string;
  venue_area?: string;
  venue?: string;
};

type NormalizedSession = {
  session_id?: string;
  canonical_session_key?: string;
  title?: string;
  description?: string;
  activity_type?: string;
  session_type?: string;
  schedule?: ScheduleFields | null;
  occurrences?: ScheduleFields[];
  duplicate_session_ids?: string[];
  [key: string]: unknown;
};

type ImportStats = {
  totalRecords: number;
  imported: number;
  merged: number;
  skippedDuplicates: number;
  skippedInvalid: number;
  certifications: number;
};

function initAdmin(): admin.firestore.Firestore {
  const keyPath = path.join(process.cwd(), "serviceAccountKey.json");
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      "Missing serviceAccountKey.json in project root. Download from Firebase console.",
    );
  }
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf8"));
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  }
  return admin.firestore();
}

function loadSessions(inputPath: string): NormalizedSession[] {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const raw = fs.readFileSync(inputPath, "utf8");
  const parsed = JSON.parse(raw) as NormalizedSession[] | { sessions?: NormalizedSession[] };

  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.sessions)) return parsed.sessions;

  throw new Error("Input JSON must be an array or { sessions: [...] }.");
}

function isCertification(session: NormalizedSession): boolean {
  return session.activity_type?.trim().toLowerCase() === "certification";
}

function validateSession(session: NormalizedSession): string | null {
  if (!session.title?.trim()) return "missing title";
  if (!session.activity_type?.trim()) return "missing activity_type";
  if (!session.session_id?.trim() && !session.canonical_session_key?.trim()) {
    return "missing session_id and canonical_session_key";
  }
  return null;
}

function resolveDocId(session: NormalizedSession): string {
  const id = session.session_id?.trim() || session.canonical_session_key?.trim();
  if (!id) {
    throw new Error(`Cannot resolve document ID for session: ${session.title ?? "(untitled)"}`);
  }
  return id;
}

function occurrenceKey(occ: ScheduleFields): string {
  return [
    occ.date ?? "",
    occ.start_time ?? "",
    occ.end_time ?? "",
    occ.room ?? "",
    occ.venue ?? "",
  ].join("|");
}

function scheduleOccurrences(session: NormalizedSession): ScheduleFields[] {
  const fromField = session.occurrences ?? [];
  if (fromField.length > 0) return fromField;

  const schedule = session.schedule;
  if (!schedule) return [];

  const hasSchedule =
    Boolean(schedule.date?.trim()) ||
    Boolean(schedule.start_time?.trim()) ||
    Boolean(schedule.day?.trim()) ||
    Boolean(schedule.room?.trim());

  return hasSchedule ? [schedule] : [];
}

function completenessScore(session: NormalizedSession): number {
  let score = 0;
  if (session.title?.trim()) score += 10;
  if (session.description?.trim()) score += 5;
  if (session.activity_type?.trim()) score += 10;
  if (session.session_id?.trim()) score += 5;
  if (session.canonical_session_key?.trim()) score += 3;

  const schedule = session.schedule;
  if (schedule?.date?.trim()) score += 3;
  if (schedule?.start_time?.trim()) score += 3;
  if (schedule?.room?.trim()) score += 2;

  const speakers = session.speakers;
  if (Array.isArray(speakers) && speakers.length > 0) {
    score += 2 + Math.min(speakers.length, 5);
  }

  const occurrences = scheduleOccurrences(session);
  score += occurrences.length * 4;

  if (session.compass_intelligence) score += 3;
  if (session.tracks) score += 2;
  if (session.recommendation_rules) score += 2;

  return score;
}

function mergeOccurrences(records: NormalizedSession[]): ScheduleFields[] {
  const merged = new Map<string, ScheduleFields>();

  for (const record of records) {
    for (const occ of scheduleOccurrences(record)) {
      merged.set(occurrenceKey(occ), occ);
    }
  }

  return [...merged.values()];
}

function mergeDuplicateSessionIds(records: NormalizedSession[]): string[] {
  const ids = new Set<string>();
  for (const record of records) {
    for (const id of record.duplicate_session_ids ?? []) {
      if (id?.trim()) ids.add(String(id).trim());
    }
  }
  return [...ids].sort();
}

function pickPrimaryRecord(records: NormalizedSession[]): NormalizedSession {
  return [...records].sort((a, b) => {
    const scoreDiff = completenessScore(b) - completenessScore(a);
    if (scoreDiff !== 0) return scoreDiff;
    return resolveDocId(a).localeCompare(resolveDocId(b));
  })[0];
}

function buildMergedRecord(records: NormalizedSession[]): NormalizedSession {
  const primary = pickPrimaryRecord(records);
  const mergedOccurrences = mergeOccurrences(records);
  const duplicateIds = mergeDuplicateSessionIds(records);

  const payload: NormalizedSession = {
    ...primary,
    occurrences: mergedOccurrences.length > 0 ? mergedOccurrences : primary.occurrences,
    duplicate_session_ids:
      duplicateIds.length > 0 ? duplicateIds : primary.duplicate_session_ids,
  };

  if (mergedOccurrences.length > 0 && payload.schedule) {
    payload.schedule = mergedOccurrences[0];
  }

  return payload;
}

function dedupeByCanonicalKey(
  sessions: NormalizedSession[],
): { records: NormalizedSession[]; skippedDuplicates: number } {
  const groups = new Map<string, NormalizedSession[]>();
  const noKey: NormalizedSession[] = [];

  for (const session of sessions) {
    const key = session.canonical_session_key?.trim();
    if (!key) {
      noKey.push(session);
      continue;
    }
    const bucket = groups.get(key) ?? [];
    bucket.push(session);
    groups.set(key, bucket);
  }

  const records: NormalizedSession[] = [...noKey];
  let skippedDuplicates = 0;

  for (const group of groups.values()) {
    if (group.length === 1) {
      records.push(group[0]);
      continue;
    }

    records.push(buildMergedRecord(group));
    skippedDuplicates += group.length - 1;
  }

  return { records, skippedDuplicates };
}

function stripUndefined<T extends Record<string, unknown>>(value: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, field] of Object.entries(value)) {
    if (field !== undefined) out[key] = field;
  }
  return out as T;
}

async function importSessions(inputPath: string, dryRun = false): Promise<ImportStats> {
  const db = dryRun ? null : initAdmin();
  const collectionRef = db?.collection(`${BASE}/sessions`) ?? null;

  const rawSessions = loadSessions(inputPath);
  const stats: ImportStats = {
    totalRecords: rawSessions.length,
    imported: 0,
    merged: 0,
    skippedDuplicates: 0,
    skippedInvalid: 0,
    certifications: 0,
  };

  const { records, skippedDuplicates } = dedupeByCanonicalKey(rawSessions);
  stats.skippedDuplicates = skippedDuplicates;

  for (const session of records) {
    const validationError = validateSession(session);
    if (validationError) {
      stats.skippedInvalid += 1;
      console.warn(
        `Skipped invalid record (${validationError}): ${
          session.session_id ?? session.canonical_session_key ?? "(unknown)"
        }`,
      );
      continue;
    }

    const docId = resolveDocId(session);
    const payload = stripUndefined(session);

    if (isCertification(session)) {
      stats.certifications += 1;
    }

    if (dryRun) {
      console.log(`[dry-run] Would write: ${docId} — ${session.title}`);
      stats.imported += 1;
      continue;
    }

    const docRef = collectionRef!.doc(docId);
    const existing = await docRef.get();

    await docRef.set(payload, { merge: true });

    if (existing.exists) {
      stats.merged += 1;
      console.log(`Merged session: ${docId} — ${session.title}`);
    } else {
      stats.imported += 1;
      console.log(`Imported session: ${docId} — ${session.title}`);
    }
  }

  return stats;
}

function printSummary(stats: ImportStats, inputPath: string) {
  console.log("\n── Session import summary ──");
  console.log(`Input file:           ${inputPath}`);
  console.log(`Target collection:    ${BASE}/sessions`);
  console.log(`Total records:        ${stats.totalRecords}`);
  console.log(`Imported (new):       ${stats.imported}`);
  console.log(`Merged (existing):    ${stats.merged}`);
  console.log(`Skipped duplicates:   ${stats.skippedDuplicates}`);
  console.log(`Skipped invalid:      ${stats.skippedInvalid}`);
  console.log(`Certifications:       ${stats.certifications}`);
  console.log(`Written total:        ${stats.imported + stats.merged}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const inputArg = args.find(arg => !arg.startsWith("--"));
  const inputPath = path.resolve(inputArg ?? DEFAULT_INPUT);

  console.log(`Reading sessions from ${inputPath}`);
  if (dryRun) console.log("Dry run — no Firestore writes will be made.\n");

  const stats = await importSessions(inputPath, dryRun);
  printSummary(stats, inputPath);

  if (stats.skippedInvalid > 0) {
    process.exitCode = 1;
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
