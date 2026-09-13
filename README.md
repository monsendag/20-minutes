# 20 Minutes

A local-first PWA: enter the reps you plan to do, run a 20-minute session
split evenly across those reps, then log how many you actually performed.

Sessions live in **PGlite** (Postgres compiled to WASM) and are persisted to
**IndexedDB** on this device. There is no server.

## What it does

1. Type a planned rep count and press Enter.
2. Press **Start**. A 20:00 session countdown begins, plus a per-rep
   countdown of `20:00 / planned reps`.
3. When the session ends (or you finish early), adjust the reps you
   actually did and save.

Install it from the browser as a standalone app. After the first load it
works offline.

## Develop

```sh
npm install
npm run dev
```

```sh
npm run build     # static output in build/
npm run preview   # includes the production service worker
npm run check     # svelte-check
npm run lint
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the data model, timer
math, PWA wiring, and file map.
