# Running with Docker Compose

From the project root, `docker compose up -d --build --wait` builds Spring Boot and Expo Web and starts them with PostgreSQL. Open the app in a browser at `http://localhost:8081`. Compose preserves the existing PostgreSQL volume.

Levin agreed to base the branch on commit `de66d50`, which integrates Expo and Spring, in a separate worktree. The agreed shared files are `compose.yaml` and `README.md`. Levin also owns the new `backend/Dockerfile`, `backend/.dockerignore`, `frontend/Dockerfile`, `frontend/.dockerignore`, and `frontend/nginx.conf`.

## API and implementation

See the [Wise Lite API plan](../nikita/wise-lite-api.md) for the HTTP contract. The Expo web build uses `/api`. Nginx forwards `POST /api/auth/login` and `GET /api/state` to Spring as `POST /auth/login` and `GET /state`. `GET /api/status` keeps its Spring path and returns `{"status":"ok","database":"connected"}`. The app retains the same REST contract.

1. Build the JAR with Java 21 and the Maven Wrapper, and Expo Web with Node 24. Serve the web build through Nginx with support for direct links.
2. Start PostgreSQL, Spring, and Expo Web in that order, waiting for each to become ready. Document how to start the stack and how to start only the database.
3. Check `docker compose config`, build and start on separate ports and a separate volume, and test `/api/status`, demo sign-in, and `/api/state` through Nginx.

## Verification results

All three containers became `healthy` in the `wise-hackathon-compose-check` project with a separate volume. Checks through Nginx covered direct navigation to `/full`, service worker delivery, `/api/status`, sign-in, state reads, and sign-out. Chrome showed Maria's €4,000 demo balance. `npm run check` and Maven `verify` passed with a separate test database schema.
