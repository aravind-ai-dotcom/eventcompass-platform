// =============================================================================
// Compass SKO — Firestore read/write services
// =============================================================================

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SKO_COLLECTIONS } from "@/lib/skoCollections";
import { isFirestorePermissionError, skoFirestoreOp } from "@/lib/skoFirestoreDebug";
import type {
  SkoBrief,
  SkoBriefItem,
  SkoContentAsset,
  SkoContentClip,
  SkoContentItem,
  SkoEdition,
  SkoGeo,
  SkoIngestJob,
  SkoMarket,
  SkoPodcast,
  SkoPulseMetrics,
  SkoPulseQuote,
  SkoSeatReservation,
  SkoSellerPersona,
  SkoSpeaker,
} from "@/types/sko";
import { SKO_EDITION_ID } from "@/types/sko";
import {
  SKO_ASSETS,
  SKO_CLIPS,
  SKO_CONTENT_ITEMS,
  SKO_EDITION,
  SKO_GEOS,
  SKO_MARKETS,
  SKO_PERSONAS,
  SKO_SPEAKERS,
} from "@/data/seeds/skoProductSeed";

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

const SERVICE_ROUTE = "skoFirestoreService";

async function skoRead<T>(
  collection: string,
  fn: () => Promise<T>,
  uid?: string | null,
  quiet = true,
): Promise<T> {
  return skoFirestoreOp(
    { route: SERVICE_ROUTE, collection, operation: "read" },
    uid ?? null,
    fn,
    { quiet },
  );
}

async function skoReadWithSeedFallback<T>(
  collection: string,
  fn: () => Promise<T>,
  fallback: T,
  uid?: string | null,
): Promise<T> {
  try {
    return await skoRead(collection, fn, uid);
  } catch (err) {
    if (isFirestorePermissionError(err)) {
      console.warn(`[SKO Firestore] permission denied on ${collection}; using local seed fallback`);
      return fallback;
    }
    throw err;
  }
}

// ── Edition ─────────────────────────────────────────────────────────────────

export async function getActiveEdition(): Promise<SkoEdition | null> {
  try {
    const snap = await skoRead(SKO_COLLECTIONS.editions, () =>
      getDoc(doc(db, SKO_COLLECTIONS.editions, SKO_EDITION_ID)),
    );
    if (snap.exists()) return mapDoc<SkoEdition>(snap.id, snap.data());
  } catch (err) {
    if (!isFirestorePermissionError(err)) throw err;
    console.warn("[SKO Firestore] editions read denied; using seed edition");
  }
  return SKO_EDITION;
}

export async function saveEdition(edition: SkoEdition): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.editions, edition.id), edition, { merge: true });
}

// ── Geos ────────────────────────────────────────────────────────────────────

export async function listGeos(editionId = SKO_EDITION_ID): Promise<SkoGeo[]> {
  return skoReadWithSeedFallback(
    SKO_COLLECTIONS.geos,
    async () => {
      const q = query(
        collection(db, SKO_COLLECTIONS.geos),
        where("editionId", "==", editionId),
      );
      const snap = await getDocs(q);
      if (snap.empty) return SKO_GEOS;
      return snap.docs.map(d => mapDoc<SkoGeo>(d.id, d.data())).sort((a, b) => a.date.localeCompare(b.date));
    },
    SKO_GEOS,
  );
}

export async function saveGeo(geo: SkoGeo): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.geos, geo.id), geo, { merge: true });
}

// ── Markets ─────────────────────────────────────────────────────────────────

export async function listMarkets(geoId?: string): Promise<SkoMarket[]> {
  const markets = await skoReadWithSeedFallback(
    SKO_COLLECTIONS.markets,
    async () => {
      const snap = await getDocs(collection(db, SKO_COLLECTIONS.markets));
      if (snap.empty) return SKO_MARKETS;
      return snap.docs.map(d => mapDoc<SkoMarket>(d.id, d.data()));
    },
    SKO_MARKETS,
  );
  let filtered = markets;
  if (geoId) filtered = filtered.filter(m => m.geoId === geoId);
  return filtered.filter(m => m.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveMarket(market: SkoMarket): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.markets, market.id), market, { merge: true });
}

// ── Personas ────────────────────────────────────────────────────────────────

export async function listSellerPersonas(): Promise<SkoSellerPersona[]> {
  const records = await skoReadWithSeedFallback(
    SKO_COLLECTIONS.sellerPersonas,
    async () => {
      const snap = await getDocs(collection(db, SKO_COLLECTIONS.sellerPersonas));
      if (snap.empty) return SKO_PERSONAS;
      return snap.docs.map(d => mapDoc<SkoSellerPersona>(d.id, d.data()));
    },
    SKO_PERSONAS,
  );
  return records.filter(p => p.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

// ── Speakers ────────────────────────────────────────────────────────────────

export async function listSpeakers(geoId?: string): Promise<SkoSpeaker[]> {
  let speakers = await skoReadWithSeedFallback(
    SKO_COLLECTIONS.speakers,
    async () => {
      const snap = await getDocs(collection(db, SKO_COLLECTIONS.speakers));
      if (snap.empty) return SKO_SPEAKERS;
      return snap.docs.map(d => mapDoc<SkoSpeaker>(d.id, d.data()));
    },
    SKO_SPEAKERS,
  );
  if (geoId) speakers = speakers.filter(s => s.geoId === geoId || !s.geoId);
  return speakers;
}

export async function saveSpeaker(speaker: SkoSpeaker): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.speakers, speaker.id), speaker, { merge: true });
}

// ── Content ─────────────────────────────────────────────────────────────────

export async function listContentItems(
  editionId = SKO_EDITION_ID,
  geoId?: string,
): Promise<SkoContentItem[]> {
  let items = await skoReadWithSeedFallback(
    SKO_COLLECTIONS.contentItems,
    async () => {
      const q = query(
        collection(db, SKO_COLLECTIONS.contentItems),
        where("editionId", "==", editionId),
      );
      const snap = await getDocs(q);
      if (snap.empty) return SKO_CONTENT_ITEMS;
      return snap.docs.map(d => mapDoc<SkoContentItem>(d.id, d.data()));
    },
    SKO_CONTENT_ITEMS,
  );
  if (geoId) items = items.filter(i => i.geoId === geoId || i.geoId === "global");
  return items.sort((a, b) => a.agendaOrder - b.agendaOrder);
}

export async function saveContentItem(item: SkoContentItem): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.contentItems, item.id), item, { merge: true });
}

export async function listContentAssets(contentId?: string): Promise<SkoContentAsset[]> {
  let assets = await skoReadWithSeedFallback(
    SKO_COLLECTIONS.contentAssets,
    async () => {
      const snap = await getDocs(collection(db, SKO_COLLECTIONS.contentAssets));
      if (snap.empty) return SKO_ASSETS;
      return snap.docs.map(d => mapDoc<SkoContentAsset>(d.id, d.data()));
    },
    SKO_ASSETS,
  );
  if (contentId) assets = assets.filter(a => a.contentId === contentId);
  return assets;
}

export async function listContentClips(contentId?: string): Promise<SkoContentClip[]> {
  let clips = await skoReadWithSeedFallback(
    SKO_COLLECTIONS.contentClips,
    async () => {
      const snap = await getDocs(collection(db, SKO_COLLECTIONS.contentClips));
      if (snap.empty) return SKO_CLIPS;
      return snap.docs.map(d => mapDoc<SkoContentClip>(d.id, d.data()));
    },
    SKO_CLIPS,
  );
  if (contentId) clips = clips.filter(c => c.contentId === contentId);
  return clips;
}

// ── Ingest ──────────────────────────────────────────────────────────────────

export async function listIngestJobs(geoId?: string): Promise<SkoIngestJob[]> {
  const snap = await getDocs(collection(db, SKO_COLLECTIONS.ingestJobs));
  let jobs = snap.docs.map(d => mapDoc<SkoIngestJob>(d.id, d.data()));
  if (geoId) jobs = jobs.filter(j => j.geoId === geoId);
  return jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveIngestJob(job: SkoIngestJob): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.ingestJobs, job.id), job, { merge: true });
}

export async function createIngestJob(
  job: Omit<SkoIngestJob, "id">,
): Promise<string> {
  const ref = await addDoc(collection(db, SKO_COLLECTIONS.ingestJobs), job);
  return ref.id;
}

// ── Pulse ───────────────────────────────────────────────────────────────────

export async function listPulseMetrics(geoId?: string): Promise<SkoPulseMetrics[]> {
  try {
    const snap = await skoRead(SKO_COLLECTIONS.pulseMetrics, () =>
      getDocs(collection(db, SKO_COLLECTIONS.pulseMetrics)),
    );
    let metrics = snap.docs.map(d => mapDoc<SkoPulseMetrics>(d.id, d.data()));
    if (geoId) metrics = metrics.filter(m => m.geoId === geoId);
    return metrics;
  } catch (err) {
    if (isFirestorePermissionError(err)) return [];
    throw err;
  }
}

export async function savePulseMetrics(metrics: SkoPulseMetrics): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.pulseMetrics, metrics.id), metrics, { merge: true });
}

export async function listPulseQuotes(geoId?: string): Promise<SkoPulseQuote[]> {
  try {
    const snap = await skoRead(SKO_COLLECTIONS.pulseQuotes, () =>
      getDocs(collection(db, SKO_COLLECTIONS.pulseQuotes)),
    );
    let quotes = snap.docs
      .map(d => mapDoc<SkoPulseQuote>(d.id, d.data()))
      .filter(q => q.approved);
    if (geoId) quotes = quotes.filter(q => q.geoId === geoId);
    return quotes.sort((a, b) => a.sortOrder - b.sortOrder);
  } catch (err) {
    if (isFirestorePermissionError(err)) return [];
    throw err;
  }
}

export async function savePulseQuote(quote: SkoPulseQuote): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.pulseQuotes, quote.id), quote, { merge: true });
}

// ── Briefs & Podcasts ───────────────────────────────────────────────────────

export async function listUserBriefs(userId: string): Promise<SkoBrief[]> {
  try {
    const q = query(collection(db, SKO_COLLECTIONS.briefs), where("userId", "==", userId));
    const snap = await skoRead(SKO_COLLECTIONS.briefs, () => getDocs(q), userId);
    return snap.docs.map(d => mapDoc<SkoBrief>(d.id, d.data()));
  } catch (err) {
    if (isFirestorePermissionError(err)) return [];
    throw err;
  }
}

export async function listBriefItems(briefId: string): Promise<SkoBriefItem[]> {
  const q = query(collection(db, SKO_COLLECTIONS.briefItems), where("briefId", "==", briefId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => mapDoc<SkoBriefItem>(d.id, d.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listUserPodcasts(userId: string): Promise<SkoPodcast[]> {
  try {
    const q = query(collection(db, SKO_COLLECTIONS.podcasts), where("userId", "==", userId));
    const snap = await skoRead(SKO_COLLECTIONS.podcasts, () => getDocs(q), userId);
    return snap.docs.map(d => mapDoc<SkoPodcast>(d.id, d.data()));
  } catch (err) {
    if (isFirestorePermissionError(err)) return [];
    throw err;
  }
}

export async function listPodcastsByGeo(geoId: string): Promise<SkoPodcast[]> {
  const q = query(collection(db, SKO_COLLECTIONS.podcasts), where("geoId", "==", geoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapDoc<SkoPodcast>(d.id, d.data()));
}

// ── Seat reservations ───────────────────────────────────────────────────────

export async function getUserSeatReservation(userId: string): Promise<SkoSeatReservation | null> {
  try {
    const q = query(
      collection(db, SKO_COLLECTIONS.seatReservations),
      where("userId", "==", userId),
    );
    const snap = await skoRead(
      SKO_COLLECTIONS.seatReservations,
      () => getDocs(q),
      userId,
    );
    const doc0 = snap.docs[0];
    return doc0 ? mapDoc<SkoSeatReservation>(doc0.id, doc0.data()) : null;
  } catch (err) {
    if (isFirestorePermissionError(err)) return null;
    throw err;
  }
}

export async function saveSeatReservation(reservation: SkoSeatReservation): Promise<void> {
  await setDoc(
    doc(db, SKO_COLLECTIONS.seatReservations, reservation.id),
    reservation,
    { merge: true },
  );
}

// ── Export helpers ──────────────────────────────────────────────────────────

export async function exportAllSkoData() {
  const [
    edition,
    geos,
    markets,
    personas,
    speakers,
    contentItems,
    contentAssets,
    contentClips,
    ingestJobs,
    pulseMetrics,
    pulseQuotes,
  ] = await Promise.all([
    getActiveEdition(),
    listGeos(),
    listMarkets(),
    listSellerPersonas(),
    listSpeakers(),
    listContentItems(),
    listContentAssets(),
    listContentClips(),
    listIngestJobs(),
    listPulseMetrics(),
    listPulseQuotes(),
  ]);

  return {
    edition,
    geos,
    markets,
    personas,
    speakers,
    contentItems,
    contentAssets,
    contentClips,
    ingestJobs,
    pulseMetrics,
    pulseQuotes,
  };
}
