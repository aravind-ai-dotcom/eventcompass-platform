<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Workspace

- **Repo:** `eventcompass-platform`
- **Path:** `/Users/aravind/eventcompass-platform`
- **Do not confuse with:** `eventcompass-sko` — standalone SKO sprint app (port 3000)

## Local dev

```bash
cd /Users/aravind/eventcompass-platform
npm run dev
```

- Platform dev URL: **http://127.0.0.1:3001**
- SKO on platform: **http://127.0.0.1:3001/sko**
- Standalone SKO repo (`eventcompass-sko`): **http://127.0.0.1:3000**

Run platform on **3001** when both repos are running locally.

## Route namespaces

| Prefix | Product | Notes |
| --- | --- | --- |
| `/`, `/txc/*` | TechXchange | Production TXC experience |
| `/sko/*` | SKO (platform) | Canonical SKO routes; shared UI in `src/components/sko/` |
| `/setup`, `/setup/txc/*`, `/setup/sko/*` | Setup / admin | Shared hub |
| `/api/voice` | Voice API | Keep |

Legacy root SKO paths redirect to `/sko/*` (see `next.config.ts`).

## Two-repo SKO split

| App | Folder | Port | Home |
| --- | --- | --- | --- |
| SKO sprint | `eventcompass-sko` | 3000 | `/` |
| Platform SKO | `eventcompass-platform` | 3001 | `/sko` |

SKO UI in this repo lives under `src/components/sko/` and `app/sko/`. Do not assume root-level `/login`, `/content`, etc. are the canonical SKO entry points — use `/sko/*`.
