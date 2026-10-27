# TaskFlow

TaskFlow is a small task-management monorepo with a Next.js App Router frontend and a Go `net/http` API backed by MySQL.

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and configure your credentials.
2. Run database migrations:
   ```bash
   cd backend
   go run ./cmd/migrate
   ```
   *(Alternatively, run the SQL files in [`backend/migrations/`](./backend/migrations/) in order).*
3. Start the API with `go run ./cmd/api` from [`backend/`](./backend/).
4. Copy `frontend/.env.example` to `frontend/.env.local`, run `npm install`, and run `npm run dev` from [`frontend/`](./frontend/).

The API uses UTC timestamps, stores only SHA-256 session-token hashes, and scopes every task query by the authenticated session user. Cookie authentication uses `HttpOnly`, `SameSite=Lax` cookies and exact-origin CORS for local development.
