# Wise Care API prototype (temporary)

Node/Express API that the Expo app in `frontend/` talks to. It is a stand-in until the Spring
Boot backend in `backend/` implements the same contract:
`docs/developers/nikita/wise-lite-api.md`. Delete this folder once that is done.

## Run

```sh
POSTGRES_PORT=5433 docker compose up -d --wait   # from the repo root; use 5432 if it's free
cd api-prototype
npm install
DATABASE_URL=postgres://hackathon:hackathon_dev@localhost:5433/hackathon npm run dev
```

Without `DATABASE_URL` it connects to `localhost:5432` with the credentials from the root
`.env`. Tables are prefixed `wl_` and created on start. `POST /reset` restores the demo data.
