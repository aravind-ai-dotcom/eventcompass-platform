# TechXchange 2026 Compass — Frozen Archive

This folder documents the **frozen TechXchange 2026 Compass** instance preserved before the **FORGE 2027** rebrand.

| Field | Value |
| --- | --- |
| Archive branch | `txc-2026-archive` |
| Git tag | `txc-2026-final-archive` |
| Event ID | `txc2026` |
| Firestore base | `organizations/ibm/events/txc2026` |
| Platform dev URL | http://127.0.0.1:3001 |
| TXC home | `/txc` (root `/` redirects to TXC) |

## Purpose

- Preserve application code, local exports, and schema notes as they existed at archive time.
- Provide a restore reference if the FORGE rebrand needs rollback or comparison.
- **Does not** snapshot live Firestore production data — see [FIRESTORE_BACKUP.md](./FIRESTORE_BACKUP.md).

## Next working branch

Active rebrand work proceeds on **`forge-2027-rebrand`**, branched from this archive commit.

## Major routes and features

### Public / attendee (`/txc/*`)

| Route | Feature |
| --- | --- |
| `/txc` | Home — proof strip, lifecycle rotator, Compass preview |
| `/txc/enroll` | Build My Compass — profile, identity signals, consent |
| `/txc/experience` | My Compass (Focus) — NBM, huddles, learning, people, communities |
| `/txc/experience/classic` | Classic Compass layout |
| `/txc/experience/print` | Print-friendly Compass |
| `/txc/explore` | How Compass works |
| `/txc/sessions` | Session catalog + intelligence (anonymous vs signed-in) |
| `/txc/champions` | Expert Champions + people match |
| `/txc/communities` | IBM Communities catalog |
| `/txc/pulse` | Event pulse — audience snapshot, identity donuts, connection intent |
| `/txc/journey-maps` | Journey maps |
| `/txc/login` | Sign in |

### Admin / setup

| Route | Feature |
| --- | --- |
| `/txc/admin` | TXC admin — identity signals, governance |
| `/txc/admin/knowledge` | Voice knowledge admin + XLSX export |
| `/setup`, `/setup/txc/*` | Setup hub and TXC tooling |

### API

| Route | Feature |
| --- | --- |
| `/api/voice` | Voice intent classifier + Compass voice |

### Shared platform (same repo, not TXC-branded)

| Prefix | Notes |
| --- | --- |
| `/sko/*` | SKO 2026 on platform |
| `/setup/sko/*` | SKO setup |

## Key product capabilities (TXC 2026)

- **Identity signals** — Champion status, alumni history, attendance memory on `participants/{id}`
- **My Compass** — Next Best Move, huddles, certification path, people recommendations
- **Pulse** — Alumni/champion donuts, trending topics, connection intent
- **Voice Compass** — `/api/voice`, voice knowledge, STT normalization
- **Session intelligence** — Match reasons, public highlights when signed out
- **Huddles** — Create, join, cancel; host validation

## Schema reference

See [SCHEMA.md](./SCHEMA.md) for Firestore collection layout and participant field notes.

## Firestore backup

See [FIRESTORE_BACKUP.md](./FIRESTORE_BACKUP.md) for export checklist. **No production Firestore writes were made during archive creation.**

## Local artifacts in this archive commit

| Path | Description |
| --- | --- |
| `exports/txc-knowledge.xlsx` | Voice knowledge export snapshot |
| `mnt/data/` | Local mount / scratch data |
| `scripts/seed-txc-knowledge.js` | Knowledge seed script (local) |

## Restore checkout

```bash
git fetch origin
git checkout txc-2026-archive
# or pinned tag:
git checkout txc-2026-final-archive
```
