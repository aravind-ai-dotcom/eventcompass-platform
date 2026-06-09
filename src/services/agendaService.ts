// =============================================================================
// EventCompass — Agenda Service
// src/services/agendaService.ts
//
// Firestore path: organizations/ibm/events/txc2026/agendas/{participantId}
// Pure TypeScript. No React.
// =============================================================================

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Agenda, AgendaItem, AgendaItemStatus, AgendaConflict, OpenTimeSlot } from "@/types/agenda";

const BASE = "organizations/ibm/events/txc2026";

// ── Time helpers ──────────────────────────────────────────────────────────────

function toMins(t: string): number {
  if (!t) return -1;
  const timePart = t.includes("T") ? t.split("T")[1] : t;
  const [h, m]   = (timePart ?? "").split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minsToHHMM(mins: number): string {
  return `${Math.floor(mins / 60).toString().padStart(2, "0")}:${(mins % 60).toString().padStart(2, "0")}`;
}

// ── Firestore ─────────────────────────────────────────────────────────────────

function agendaRef(participantId: string) {
  return doc(db, `${BASE}/agendas/${participantId}`);
}

export async function getAgenda(participantId: string): Promise<Agenda> {
  const snap = await getDoc(agendaRef(participantId));
  return snap.exists() ? (snap.data() as Agenda) : { participantId, items: [] };
}

async function saveAgenda(agenda: Agenda): Promise<void> {
  await setDoc(agendaRef(agenda.participantId), {
    ...agenda,
    updatedAt: serverTimestamp(),
    createdAt: agenda.createdAt ?? serverTimestamp(),
  });
}

export async function addAgendaItem(
  participantId: string,
  item: Omit<AgendaItem, "addedAt">
): Promise<Agenda> {
  const agenda = await getAgenda(participantId);
  if (agenda.items.some(i => i.id === item.id)) return agenda;
  const updated: Agenda = {
    ...agenda,
    items: [...agenda.items, { ...item, addedAt: new Date().toISOString() }],
  };
  await saveAgenda(updated);
  return updated;
}

export async function removeAgendaItem(participantId: string, itemId: string): Promise<Agenda> {
  const agenda  = await getAgenda(participantId);
  const updated = { ...agenda, items: agenda.items.filter(i => i.id !== itemId) };
  await saveAgenda(updated);
  return updated;
}

export async function updateAgendaItemStatus(
  participantId: string, itemId: string, status: AgendaItemStatus
): Promise<Agenda> {
  const agenda  = await getAgenda(participantId);
  const updated = { ...agenda, items: agenda.items.map(i => i.id === itemId ? { ...i, status } : i) };
  await saveAgenda(updated);
  return updated;
}

// ── Conflict detection ────────────────────────────────────────────────────────

export function detectAgendaConflicts(items: AgendaItem[]): AgendaConflict[] {
  const active = items.filter(i => i.status !== "dismissed" && i.status !== "completed");
  const conflicts: AgendaConflict[] = [];
  for (let a = 0; a < active.length; a++) {
    for (let b = a + 1; b < active.length; b++) {
      const ia = active[a]; const ib = active[b];
      if (ia.day && ib.day && ia.day !== ib.day) continue;
      const aStart = toMins(ia.startTime); const aEnd = toMins(ia.endTime);
      const bStart = toMins(ib.startTime); const bEnd = toMins(ib.endTime);
      if (aStart < 0 || aEnd < 0 || bStart < 0 || bEnd < 0) continue;
      const overlapEnd = Math.min(aEnd, bEnd);
      const overlapStart = Math.max(aStart, bStart);
      if (overlapEnd > overlapStart) {
        conflicts.push({ itemA: ia, itemB: ib, overlapMinutes: overlapEnd - overlapStart });
      }
    }
  }
  return conflicts;
}

// ── Open time slot detection ──────────────────────────────────────────────────

const EVENT_START = 8 * 60;
const EVENT_END   = 21 * 60;
const MIN_GAP     = 30;

export function findOpenTimeSlots(items: AgendaItem[], day = "Monday"): OpenTimeSlot[] {
  const dayItems = items
    .filter(i => (!i.day || i.day === day) && i.status !== "dismissed" && i.status !== "completed" && toMins(i.startTime) >= 0)
    .sort((a, b) => toMins(a.startTime) - toMins(b.startTime));

  const slots: OpenTimeSlot[] = [];
  let cursor = EVENT_START;
  for (const item of dayItems) {
    const s = toMins(item.startTime);
    const e = toMins(item.endTime);
    if (s > cursor + MIN_GAP) {
      slots.push({ startTime: minsToHHMM(cursor), endTime: minsToHHMM(s), durationMins: s - cursor, day, label: `${minsToHHMM(cursor)} – ${minsToHHMM(s)} (${s - cursor} min)` });
    }
    cursor = Math.max(cursor, e);
  }
  if (cursor < EVENT_END - MIN_GAP) {
    slots.push({ startTime: minsToHHMM(cursor), endTime: minsToHHMM(EVENT_END), durationMins: EVENT_END - cursor, day, label: `${minsToHHMM(cursor)} – ${minsToHHMM(EVENT_END)} (${EVENT_END - cursor} min)` });
  }
  return slots;
}

// ── Section helpers ────────────────────────────────────────────────────────────

export function getAgendaSection(item: AgendaItem, nowMins: number): "now" | "upcoming" | "later" | "past" {
  const start = toMins(item.startTime);
  const end   = toMins(item.endTime);
  if (start < 0) return "upcoming";
  if (item.status === "completed") return "past";
  if (start <= nowMins && nowMins < end) return "now";
  if (start > nowMins && start <= nowMins + 90) return "upcoming";
  if (start > nowMins) return "later";
  return "past";
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}
