# Tasker setup

## Prerequisites

- Java 17 or newer
- Maven 3.9+
- Node.js 18+ and npm
- MySQL 8+

## Database

Create the database and tables by running `database/schema.sql` in MySQL:

```powershell
mysql -u root -p < database/schema.sql
```

`database/seed.sql` is intentionally empty of users and passwords. Do not put
plaintext credentials in it.

## Backend configuration

Copy `backend/.env.example` to `backend/.env` for reference, then provide
equivalent Spring properties through environment variables or command-line
properties:

| Variable | Local default |
| --- | --- |
| `DB_URL` | `jdbc:mysql://localhost:3306/tasker_db?serverTimezone=UTC` |
| `DB_USERNAME` | `root` |
| `DB_PASSWORD` | your local MySQL password |
| `FRONTEND_ORIGIN` | `http://localhost:5173` |

The backend uses server-side HTTP sessions. The browser stores only the
HttpOnly session cookie; the React app does not store passwords, tokens, or
session IDs in local storage.

For local HTTP development, `Secure` is disabled on the session cookie. In
HTTPS production, enable secure cookies and serve both applications over HTTPS.
The backend issues an `XSRF-TOKEN` cookie and the frontend sends its value in
the `X-XSRF-TOKEN` header for state-changing requests.

Start the backend:

```powershell
cd backend
mvn spring-boot:run
```

Build without starting:

```powershell
mvn clean package
```

## Frontend

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

The default `VITE_API_BASE_URL` is `http://localhost:8080`. Open
`http://localhost:5173` in a browser.

## Authentication flow

The client checks `GET /api/auth/me` on startup. Login and registration create a
server session. Logout invalidates it. Private task endpoints reject requests
without an authenticated session. CSRF protection remains enabled for all
state-changing endpoints.

## Common problems

- **Connection refused:** confirm MySQL is running and `DB_URL`, username, and
  password are correct.
- **CORS errors:** make `FRONTEND_ORIGIN` exactly match the browser origin,
  including its port.
- **CSRF errors:** use the frontend client so it first obtains `/api/auth/csrf`
  and sends the returned token on mutations.
- **Existing schema mismatch:** rerun the schema against a fresh development
  database rather than changing production data blindly.
