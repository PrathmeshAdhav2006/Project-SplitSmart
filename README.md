# Tasker

Tasker is a personal task management mini project built as a single monorepo.
It uses React and Vite for the frontend, Spring Boot with direct JDBC for the
backend, and MySQL for persistence.

## Features

- BCrypt-backed registration and login with server-side sessions.
- User-scoped task CRUD, status changes, search, filters, sorting, and statistics.
- CSRF protection, credentialed CORS, and backend ownership enforcement.
- Responsive dashboard with overdue-task highlighting.

See [docs/SETUP.md](docs/SETUP.md) for local setup and
[docs/API.md](docs/API.md) for the API contract.

## Repository layout

```text
frontend/   React + Vite client
backend/    Spring Boot REST API and direct JDBC DAOs
database/   MySQL schema and optional seed script
docs/       Setup and API documentation
```

## Quick start

1. Run `database/schema.sql` in MySQL 8.
2. Configure `backend/.env` or JVM properties using the variables in
   [docs/SETUP.md](docs/SETUP.md).
3. Start the backend with `cd backend; mvn spring-boot:run`.
4. Start the frontend with `cd frontend; npm install; npm run dev`.
5. Open `http://localhost:5173`.

The application does not include automated tests or sample credentials.
