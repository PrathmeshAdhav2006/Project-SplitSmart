# Tasker API

The backend runs at `http://localhost:8080`. JSON requests should use
`Content-Type: application/json`. Session requests must include credentials.
Mutating requests also send the value from the `XSRF-TOKEN` cookie as
`X-XSRF-TOKEN`.

## Authentication

| Method | Endpoint | Auth |
| --- | --- | --- |
| GET | `/api/auth/csrf` | public |
| POST | `/api/auth/register` | public |
| POST | `/api/auth/login` | public |
| GET | `/api/auth/me` | session |
| POST | `/api/auth/logout` | session |

Registration and login accept `{ "name": "Alex", "email": "alex@example.com", "password": "StrongPassword123!" }`
and return `{ "id": 1, "name": "Alex", "email": "alex@example.com" }`.
Passwords and password hashes are never returned.

## Tasks

| Method | Endpoint | Auth |
| --- | --- | --- |
| POST | `/api/tasks` | session |
| GET | `/api/tasks` | session |
| GET | `/api/tasks/{id}` | session |
| PUT | `/api/tasks/{id}` | session |
| PATCH | `/api/tasks/{id}/status` | session |
| DELETE | `/api/tasks/{id}` | session |
| GET | `/api/tasks/stats` | session |

Task bodies use `title`, optional `description`, `priority` (`LOW`, `MEDIUM`,
`HIGH`), `status` (`PENDING`, `IN_PROGRESS`, `COMPLETED`), and optional
`dueDate` in `YYYY-MM-DD` format. `GET /api/tasks` supports `search`, `status`,
`priority`, `sortBy` (`createdAt` or `dueDate`), and `order` (`asc` or `desc`).

Statistics return `totalTasks`, `pendingTasks`, `inProgressTasks`,
`completedTasks`, and `overdueTasks`. Overdue means a non-completed task whose
due date is before today.

`DELETE` returns `204 No Content`. An absent or another user's task returns
`404 Not Found`; the API never discloses ownership. Error bodies use a
consistent shape with `status`, `message`, and `timestamp`.

## Ownership enforcement

The authenticated user ID comes from Spring Security's server-side
authentication context. The DAO includes `user_id = ?` in every task select,
update, status update, delete, and aggregate query. Request bodies and query
parameters never select an owner, so a user cannot switch ownership from the
frontend.
