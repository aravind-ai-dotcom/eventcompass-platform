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

function mapDoc<T extends { id: string }>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

// ── Edition ─────────────────────────────────────────────────────────────────

export async function getActiveEdition(): Promise<SkoEdition | null> {
  const snap = await getDoc(doc(db, SKO_COLLECTIONS.editions, SKO_EDITION_ID));
  return snap.exists() ? mapDoc<SkoEdition>(snap.id, snap.data()) : null;
}

export async function saveEdition(edition: SkoEdition): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.editions, edition.id), edition, { merge: true });
}

// ── Geos ────────────────────────────────────────────────────────────────────

export async function listGeos(editionId = SKO_EDITION_ID): Promise<SkoGeo[]> {
  const q = query(
    collection(db, SKO_COLLECTIONS.geos),
    where("editionId", "==", editionId),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => mapDoc<SkoGeo>(d.id, d.data())).sort((a, b) => a.date.localeCompare(b.date));
}

export async function saveGeo(geo: SkoGeo): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.geos, geo.id), geo, { merge: true });
}

// ── Markets ─────────────────────────────────────────────────────────────────

export async function listMarkets(geoId?: string): Promise<SkoMarket[]> {
  const snap = await getDocs(collection(db, SKO_COLLECTIONS.markets));
  let markets = snap.docs.map(d => mapDoc<SkoMarket>(d.id, d.data()));
  if (geoId) markets = markets.filter(m => m.geoId === geoId);
  return markets.filter(m => m.active).sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function saveMarket(market: SkoMarket): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.markets, market.id), market, { merge: true });
}

// ── Personas ────────────────────────────────────────────────────────────────

export async function listSellerPersonas(): Promise<SkoSellerPersona[]> {
  const snap = await getDocs(collection(db, SKO_COLLECTIONS.sellerPersonas));
  return snap.docs
    .map(d => mapDoc<SkoSellerPersona>(d.id, d.data()))
    .filter(p => p.active)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// ── Speakers ────────────────────────────────────────────────────────────────

export async function listSpeakers(geoId?: string): Promise<SkoSpeaker[]> {
  const snap = await getDocs(collection(db, SKO_COLLECTIONS.speakers));
  let speakers = snap.docs.map(d => mapDoc<SkoSpeaker>(d.id, d.data()));
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
  const q = query(
    collection(db, SKO_COLLECTIONS.contentItems),
    where("editionId", "==", editionId),
  );
  const snap = await getDocs(q);
  let items = snap.docs.map(d => mapDoc<SkoContentItem>(d.id, d.data()));
  if (geoId) items = items.filter(i => i.geoId === geoId || i.geoId === "global");
  return items.sort((a, b) => a.agendaOrder - b.agendaOrder);
}

export async function saveContentItem(item: SkoContentItem): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.contentItems, item.id), item, { merge: true });
}

export async function listContentAssets(contentId?: string): Promise<SkoContentAsset[]> {
  const snap = await getDocs(collection(db, SKO_COLLECTIONS.contentAssets));
  let assets = snap.docs.map(d => mapDoc<SkoContentAsset>(d.id, d.data()));
  if (contentId) assets = assets.filter(a => a.contentId === contentId);
  return assets;
}

export async function listContentClips(contentId?: string): Promise<SkoContentClip[]> {
  const snap = await getDocs(collection(db, SKO_COLLECTIONS.contentClips));
  let clips = snap.docs.map(d => mapDoc<SkoContentClip>(d.id, d.data()));
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
  const snap = await getDocs(collection(db, SKO_COLLECTIONS.pulseMetrics));
  let metrics = snap.docs.map(d => mapDoc<SkoPulseMetrics>(d.id, d.data()));
  if (geoId) metrics = metrics.filter(m => m.geoId === geoId);
  return metrics;
}

export async function savePulseMetrics(metrics: SkoPulseMetrics): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.pulseMetrics, metrics.id), metrics, { merge: true });
}

export async function listPulseQuotes(geoId?: string): Promise<SkoPulseQuote[]> {
  const snap = await getDocs(collection(db, SKO_COLLECTIONS.pulseQuotes));
  let quotes = snap.docs
    .map(d => mapDoc<SkoPulseQuote>(d.id, d.data()))
    .filter(q => q.approved);
  if (geoId) quotes = quotes.filter(q => q.geoId === geoId);
  return quotes.sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function savePulseQuote(quote: SkoPulseQuote): Promise<void> {
  await setDoc(doc(db, SKO_COLLECTIONS.pulseQuotes, quote.id), quote, { merge: true });
}

// ── Briefs & Podcasts ───────────────────────────────────────────────────────

export async function listUserBriefs(userId: string): Promise<SkoBrief[]> {
  const q = query(collection(db, SKO_COLLECTIONS.briefs), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapDoc<SkoBrief>(d.id, d.data()));
}

export async function listBriefItems(briefId: string): Promise<SkoBriefItem[]> {
  const q = query(collection(db, SKO_COLLECTIONS.briefItems), where("briefId", "==", briefId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => mapDoc<SkoBriefItem>(d.id, d.data()))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function listUserPodcasts(userId: string): Promise<SkoPodcast[]> {
  const q = query(collection(db, SKO_COLLECTIONS.podcasts), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapDoc<SkoPodcast>(d.id, d.data()));
}

export async function listPodcastsByGeo(geoId: string): Promise<SkoPodcast[]> {
  const q = query(collection(db, SKO_COLLECTIONS.podcasts), where("geoId", "==", geoId));
  const snap = await getDocs(q);
  return snap.docs.map(d => mapDoc<SkoPodcast>(d.id, d.data()));
}

// ── Seat reservations ───────────────────────────────────────────────────────

export async function getUserSeatReservation(userId: string): Promise<SkoSeatReservation | null> {
  const q = query(
    collection(db, SKO_COLLECTIONS.seatReservations),
    where("userId", "==", userId),
  );
  const snap = await getDocs(q);
  const doc0 = snap.docs[0];
  return doc0 ? mapDoc<SkoSeatReservation>(doc0.id, doc0.data()) : null;
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
