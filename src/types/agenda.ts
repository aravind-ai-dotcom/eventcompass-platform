// =============================================================================
// EventCompass — Agenda Types
// src/types/agenda.ts
// Firestore path: organizations/ibm/events/txc2026/agendas/{participantId}
// =============================================================================

export type AgendaItemStatus = "planned" | "registered" | "attending" | "completed" | "dismissed";

export type AgendaItemType =
  | "session" | "champion_meeting" | "community_event"
  | "fun" | "special_program" | "expert_access" | "networking" | "open_slot";

export interface AgendaItem {
  id:               string;
  type:             AgendaItemType;
  sourceCollection: string;
  sourceId:         string;
  title:            string;
  startTime:        string;
  endTime:          string;
  location?:        string;
  day?:             string;
  status:           AgendaItemStatus;
  addedAt:          string;
  track?:           string;
  score?:           number;
  reason?:          string;
}

export interface Agenda {
  participantId: string;
  items:         AgendaItem[];
  createdAt?:    unknown;
  updatedAt?:    unknown;
}

export interface AgendaConflict {
  itemA:          AgendaItem;
  itemB:          AgendaItem;
  overlapMinutes: number;
}

export interface OpenTimeSlot {
  startTime:    string;
  endTime:      string;
  durationMins: number;
  day:          string;
  label:        string;
}
