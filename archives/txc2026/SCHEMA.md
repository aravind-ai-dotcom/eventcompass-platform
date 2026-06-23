# TechXchange 2026 — Firestore schema notes

**Base path:** `organizations/ibm/events/txc2026`

Defined in `src/lib/compassEventPaths.ts` (`TXC_EVENT_ID = "txc2026"`).

## Top-level event collections

| Collection | Access (rules) | Purpose |
| --- | --- | --- |
| `sessions` | Public read | Session catalog |
| `champions` | Public read | Expert Champions catalog |
| `communities` | Public read | IBM Communities catalog |
| `certifications` | Public read | Certification catalog |
| `participants` | Auth read/write | Enrolled attendee profiles |
| `huddles` | Public read; auth write | Conversation huddles |
| `huddleAnalytics` | Auth read/create | Huddle analytics events |
| `agendas` | Auth (catch-all subcollection rule) | Per-participant agendas |
| `knowledgeBase` | Auth | Knowledge base entries |
| `voice_knowledge` | Auth | Voice FAQ / knowledge |
| `voice_knowledge_categories` | Auth | Voice knowledge categories |
| `knowledge` | Auth | Legacy FAQ (deprecated) |
| `knowledge_categories` | Auth | Legacy categories (deprecated) |
| `voiceDictionary` | Auth | Voice dictionary |
| `sttNormalization` | Auth | STT normalization rules |
| `knowledgeAnalytics` | Auth | Knowledge match analytics |
| `translationMemory` | Auth | Translation memory |
| `contentSummaries` | Auth | Content summaries |
| `recommendation_balance` | Auth | Recommendation balance config |

## Participant document (`participants/{participantId}`)

`participantId` typically matches Firebase Auth `uid`.

### Core profile fields (representative)

- `display_name`, `email`, `organization`, `title`, `company`
- `profile` — domains, products, goals, networking intent
- `compass_reasons`, `compass_score` — recommendation metadata
- `education`, `attendance`, `consent` — enrollment payloads

### Identity signals (`identity_signals`)

From `src/lib/identitySignals.ts`:

```ts
{
  champion_status: "ibm_champion" | "former_champion" | "champion_nominee" |
    "interested_in_becoming_champion" | "not_applicable" | "prefer_not_to_answer" | "";
  attended_txc_before: boolean | null;
  techxchange_history: string[];  // e.g. txc2025_orlando
  attendance_memory_enabled: boolean | null;
}
```

### Activity memory (`activity_memory`)

```ts
{
  attended_sessions: string[];
  partially_attended_sessions: string[];
  missed_sessions: string[];
  met_people: string[];
  meaningful_huddles: string[];
  wants_session_followup: boolean;
}
```

### Subcollections

| Path | Purpose |
| --- | --- |
| `participants/{id}/certification_enrollments/{certId}` | Per-user cert enrollments (owner-only write) |

## Huddle document (`huddles/{huddleId}`)

- Host, title, description, schedule, capacity, status
- Subcollection `responses/{participantId}` — RSVP / on-my-way

## Users namespace

- `users/{uid}` — TXC user docs (auth-scoped)

## Rules file

`firestore.rules` — prototype rules; **not production-hardened**. Deploy via `npx firebase-tools deploy --only firestore:rules`.

## Related code entry points

| Area | Path |
| --- | --- |
| Event paths | `src/lib/compassEventPaths.ts` |
| Identity | `src/lib/identitySignals.ts`, `src/lib/activityMemory.ts` |
| Pulse loader | `src/lib/pulseDataLoader.ts` |
| Huddles | `src/services/huddleService.ts` |
| Auth / enroll | `src/lib/auth.ts`, `app/txc/enroll/page.tsx` |
