# FORGE 2027 — Photonic Technology Transformation Report

**Branch:** `forge-2027`  
**Date:** June 20, 2026  
**Scope:** Presentation layer only — no functionality, Firestore, or recommendation engine changes.

---

## Summary

FORGE has been transformed from a re-skinned enterprise conference app into a **Photonic Technology Design System** experience. The interface now reads as a mission-designation operating system for a world-class technology gathering — cinematic, precise, and engineered — without cyberpunk, SaaS dashboard, or IBM/TechXchange visual debt.

---

## Before / After Screenshots

Captured at `http://127.0.0.1:3001` via headless Chromium.

| Page | Before (cinematic commit `87cc26d`) | After (photonic pass) |
| --- | --- | --- |
| Home `/txc` | `docs/screenshots/forge-before-home.png` | `docs/screenshots/forge-after-home.png` |
| Experience `/txc/experience` | `docs/screenshots/forge-before-experience.png` | `docs/screenshots/forge-after-experience.png` |
| Sessions `/txc/sessions` | — | `docs/screenshots/forge-after-sessions.png` |
| Guides `/txc/champions` | — | `docs/screenshots/forge-after-guides.png` |

### Visual delta (home)

| Dimension | Before | After |
| --- | --- | --- |
| Background | `#0A0A0F` cinematic dark | `#05060A` photonic void |
| Wordmark font | Space Grotesk | **Syncopate** (Monument/Eurostile equivalent) |
| Hero visual | Wireframe polyhedron, muted beams | **Prism + beam array** with violet/blue/cyan photonic palette |
| Accent system | Single purple gradient | Electric Violet `#7C3AED`, Photon Blue `#4F8CFF`, Laser Cyan `#22D3EE` |
| Grid field | Subtle | **`forge-grid`** mission-control field at 22% opacity |
| Compass copy | Generic concierge language | **Compass Intelligence** — signals, guidance, opportunities aligned |
| Card treatment | Glass SaaS panels | **Instrument panels** — darker surfaces, laser edges, thinner borders |

---

## Design System

### Color tokens (`app/globals.css`)

- Primary background: `#05060A`
- Secondary surface: `#0B0F16`
- Elevated surface: `#121826`
- Text: `#FFFFFF` / Muted: `#9CA3AF`
- Accents: Electric Violet, Photon Blue, Laser Cyan, Signal Purple
- Photonic glow/shadow tokens: `--forge-glow`, `--forge-laser`, `--forge-border`

### Typography (`app/layout.tsx`)

- **Wordmark:** Syncopate 700 (`--font-wordmark`)
- **Headings & body:** Space Grotesk (`--font-display`, `--font-sans`)
- **Mono:** JetBrains Mono (instrument readouts)

### Photonic primitives (`app/forge-cinematic.css`)

Reusable classes applied across `/txc/*` via `RouteChrome`:

- `forge-glow`, `forge-halo`, `forge-beam`, `forge-photon`
- `forge-prism`, `forge-grid`, `forge-laser`
- `forge-shell`, `forge-hero`, `forge-card`, `forge-panel`

### Hero (`app/txc/page.tsx` + `ForgeHeroVisual.tsx`)

- Large **FORGE / 2027** mission wordmark with wide tracking
- Tagline: *Building What's Next*
- Dates: February 16–19, 2027
- Venue: Bayfront Innovation Center, San Francisco, California
- Custom SVG prism + CSS beam array — no stock imagery

---

## Compass Positioning

Compass is presented as an **intelligence layer**, not a chatbot:

| Surface | Change |
| --- | --- |
| `forgeBrand.ts` | Added `compassIntelligence`, `compassGuidance`, `poweredByCompass` |
| `HomeCompassPreview.tsx` | Kicker → Compass Intelligence; copy → signals aligned |
| `VoiceCompassButton.tsx` | Module head → Compass Intelligence; idle → "Activate guidance"; prompt → "What should Compass prioritize?" |
| `PeopleRecommendations.tsx` | Guides kicker → "Expert signals" |
| `eventKnowledge.ts` | All voice facts rewritten for FORGE 2027 SF |
| `voiceDictionarySeed.ts` | FORGE, Compass Intelligence, Guides, Bayfront — removed TechXchange/watsonx/IBM Champions |

CTAs preserved: **Build My Journey**, **Explore Sessions**, **Ask Compass AI**

---

## Brand Cleanup

### Rewritten for FORGE (visible / voice)

- `src/data/eventKnowledge.ts` — event overview, dates, location, tracks, Compass role, persona guidance, fun activities
- `src/services/voice/voiceDictionarySeed.ts` — pronunciation seeds
- Setup knowledge admin — internal schema keys kept (`Champion`, `Certification`); UI labels show **Guide** / **Learning Path**

### Intentionally unchanged (internal only)

- Firestore paths (`txc2026`), TypeScript types (`Champion`, `ScoredChampion`)
- Route `/txc/champions` (UI shows "Guides")
- SKO routes (`/sko/*`) — separate product
- `IBM_COMMUNITIES` data module (communities page metrics — content neutral)

---

## Files Changed (14)

```
app/forge-cinematic.css          Photonic design system rewrite
app/globals.css                  Photonic color tokens
app/layout.tsx                   Syncopate + Space Grotesk, dark default
app/txc/page.tsx                 Hero + intelligence copy
src/components/home/ForgeHeroVisual.tsx   Prism/beam SVG
src/components/home/HomeCompassPreview.tsx
src/components/voice/VoiceCompassButton.tsx
src/components/experience/PeopleRecommendations.tsx
src/config/forgeBrand.ts
src/config/chartColors.ts        Photonic chart palette
src/data/eventKnowledge.ts
src/services/voice/voiceDictionarySeed.ts
app/setup/txc/knowledge/page.tsx
app/setup/txc/export/page.tsx
```

---

## Verification

- `npx tsc --noEmit` — passes
- Dev server: `http://127.0.0.1:3001/txc`
- Full `npm run build` — run after stopping dev server (Turbopack cache conflict when dev + build run concurrently)

---

## Success Criteria Check

| Goal | Status |
| --- | --- |
| Feels like OS for world-class tech gathering | ✅ Photonic hero, instrumentation stats, mission wordmark |
| Not IBM conference app | ✅ Voice knowledge + visible copy FORGE-only |
| Not generic AI website | ✅ Compass Intelligence framing, no chatbot clichés |
| Not SaaS dashboard | ✅ Instrument cards, laser edges, dark surfaces |
| Not registration site | ✅ Journey/signals narrative, not form-first |
| Functionality preserved | ✅ No schema/engine/navigation changes |

---

## Recommended Next Steps

1. Commit photonic pass on `forge-2027`
2. Extend photonic card overrides to any remaining light-theme leakage on edge pages
3. Replace `IBM_COMMUNITIES` module name with neutral `FORGE_COMMUNITIES` export (display already FORGE-branded)
4. Audit `txcVoiceKnowledgeSeed.ts` for legacy TechXchange FAQ strings in Firestore seed data
