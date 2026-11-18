# Reel Store: EECS 4413 e-store

A film store selling physical media (Blu-ray, 4K UHD, DVD, posters).

- `server/`: Express API in TypeScript (Node runs `.ts` directly). Layers: `routes/` (controllers) → `services/` → `daos/` → SQLite (`node:sqlite`).
- `web/`: React + Vite front end. Talks to the back end only through `/api` (see `web/src/api.ts`).
- `docs/API.md`: the API contract both of us build against.

## Run it

Needs Node 24 or newer.

```sh
npm install
npm run dev:server   # API on http://localhost:3000
npm run dev:web      # site on http://localhost:5173 (proxies /api to :3000)
npm test             # backend tests
```

The database is created and seeded at `server/data/estore.db` on first start. Delete that file to reset it.
Set `DB_PATH` to use a different file.

Production: `npm run build` then `npm start`; Express serves `web/dist` on the same port.
Set `NODE_ENV=production` and a real `SESSION_SECRET`.

## Test accounts (seed data)

| Email | Password | Role |
|---|---|---|
| admin@estore.test | admin123 | admin |
| jane@estore.test | password123 | customer (card 4111…1111) |

## Adding a feature

1. SQL goes in a DAO under `server/src/daos/` (nothing else touches the database).
2. Rules and validation in a service under `server/src/services/`; throw `HttpError(status, message)` for client errors.
3. Route in `server/src/routes/`, mounted in `server/src/app.ts`.
4. Page in `web/src/pages/`, route in `web/src/App.tsx`.
5. Tests in `server/test/` and the endpoint in `docs/API.md`.
