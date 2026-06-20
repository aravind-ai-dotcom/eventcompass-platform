# EventCompass Platform

Next.js app for **TechXchange (TXC)** production routes and the integrated **SKO** experience under `/sko`.

This repo is separate from the standalone SKO sprint app in [`eventcompass-sko`](https://github.com/) at `/Users/aravind/eventcompass-sko`.

## Local development

```bash
cd /Users/aravind/eventcompass-platform
npm run dev
```

Default dev server: **http://127.0.0.1:3001**

| App | Folder | Command | Home URL |
| --- | --- | --- | --- |
| SKO (sprint work) | `/Users/aravind/eventcompass-sko` | `npm run dev` | http://localhost:3000/ |
| Platform SKO + TXC | `/Users/aravind/eventcompass-platform` | `npm run dev` | http://localhost:3001/sko |

Run platform on **3001** when both repos are up so they do not fight for port 3000.

### Key routes (platform)

| Route | Purpose |
| --- | --- |
| `/` | TechXchange home |
| `/txc/*` | TechXchange experience (sessions, champions, admin, etc.) |
| `/sko/*` | SKO seller routes (login, compass, explore, enroll, pulse) |
| `/setup` | Shared setup / admin hub |

Legacy root SKO paths (`/login`, `/content`, `/profile`, etc.) redirect to `/sko/*`.

## Scripts

```bash
npm run dev          # next dev on port 3001
npm run build        # production build
npm run start        # start production server
npm run lint         # eslint
```

## Deploy

Production deploys via Vercel (`eventcompass-platform`).
