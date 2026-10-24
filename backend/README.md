# SplitSmart backend

This is the Maven-based Spring Boot backend for the SplitSmart API. Part 3 adds session-based user registration and login; group, expense, and settlement endpoints are intentionally not implemented yet.

## Prerequisites

- Java 17 or newer
- Maven 3.9 or newer
- MySQL 8 running locally

Create a local database and application user using placeholders of your choice:

```sql
CREATE DATABASE splitsmart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'splitsmart_app'@'localhost' IDENTIFIED BY '<local-password>';
GRANT ALL PRIVILEGES ON splitsmart.* TO 'splitsmart_app'@'localhost';
FLUSH PRIVILEGES;
```

Copy [`backend/.env.example`](./.env.example) into your local environment configuration and replace the placeholder password. Do not commit a real password. Flyway runs the versioned SQL files in `src/main/resources/db/migration` when the application starts.

## Run

From the `backend` directory:

```powershell
mvn spring-boot:run
```

Check the foundation endpoint:

```powershell
curl http://localhost:8080/api/health
```

Expected response:

```json
{"status":"ok","service":"splitsmart-backend"}
```

Database credentials are intentionally externalized through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`. Configuration is stored in `src/main/resources/application.properties`. The frontend origin is configurable with `FRONTEND_ORIGIN` for the later integration work.

## Authentication endpoints

- `POST /api/auth/register` creates a user with a BCrypt password hash.
- `POST /api/auth/login` starts an authenticated HTTP session.
- `POST /api/auth/logout` invalidates the session.
- `GET /api/auth/me` returns the authenticated user.
- `GET /api/auth/csrf` initializes the CSRF cookie/token for state-changing requests.

Send JSON request bodies with `fullName`, `email`, and `password` for registration, or `email` and `password` for login. The frontend must send cookies (`credentials: include`) and the `X-XSRF-TOKEN` header for POST, PUT, PATCH, and DELETE requests.

The current security configuration allows only the configured local frontend origin, stores no plaintext passwords, and uses a session cookie plus CSRF protection. This is intended for the local same-origin-style student demo; production deployment would require HTTPS and additional session hardening.
