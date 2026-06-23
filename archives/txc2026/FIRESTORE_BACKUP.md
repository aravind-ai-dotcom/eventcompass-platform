# Firestore backup checklist — TechXchange 2026

Archive creation **does not** export or modify production Firestore. Run these steps separately before or after cutover.

## Prerequisites

- Firebase project access with **Cloud Datastore Import Export Admin** (or Owner)
- `gcloud` CLI authenticated to the correct project
- GCS bucket for exports (e.g. `gs://<project>-firestore-exports`)

## Pre-export

- [ ] Confirm Firebase project ID (production)
- [ ] Note archive git tag: `txc-2026-final-archive`
- [ ] Freeze writes if you need a point-in-time snapshot (optional maintenance window)
- [ ] Verify no destructive migrations are scheduled

## Export command (full database)

```bash
gcloud firestore export gs://YOUR_BUCKET/txc2026-archive-$(date +%Y%m%d) \
  --project=YOUR_PROJECT_ID
```

## Export command (TXC event subtree only)

If using collection-group or selective export, at minimum capture:

- [ ] `organizations/ibm/events/txc2026/participants`
- [ ] `organizations/ibm/events/txc2026/sessions`
- [ ] `organizations/ibm/events/txc2026/champions`
- [ ] `organizations/ibm/events/txc2026/communities`
- [ ] `organizations/ibm/events/txc2026/certifications`
- [ ] `organizations/ibm/events/txc2026/huddles` (+ `responses` subcollections)
- [ ] `organizations/ibm/events/txc2026/voice_knowledge`
- [ ] `organizations/ibm/events/txc2026/voice_knowledge_categories`
- [ ] `organizations/ibm/events/txc2026/knowledgeBase`
- [ ] `organizations/ibm/events/txc2026/voiceDictionary`
- [ ] `organizations/ibm/events/txc2026/sttNormalization`
- [ ] `organizations/ibm/events/txc2026/knowledgeAnalytics`
- [ ] `organizations/ibm/events/txc2026/agendas`
- [ ] `users` (TXC auth profiles)

## Post-export verification

- [ ] Export operation completed successfully in Firebase Console
- [ ] Record export path and timestamp in team runbook
- [ ] Test restore to a **non-production** project before relying on backup
- [ ] Store export metadata next to git tag `txc-2026-final-archive`

## Restore (non-production test)

```bash
gcloud firestore import gs://YOUR_BUCKET/txc2026-archive-YYYYMMDD \
  --project=YOUR_STAGING_PROJECT_ID
```

## What this code archive includes

- Application source at tag `txc-2026-final-archive`
- Local `exports/txc-knowledge.xlsx` if present in repo
- **Not** live Firestore documents

## Do not

- Run seed scripts against production during FORGE rebrand without explicit approval
- Deploy `firestore.rules` prototype rules to production without review
- Assume `participants` export contains PII — handle exports per data governance policy
