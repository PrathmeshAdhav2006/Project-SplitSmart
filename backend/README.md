# SplitSmart backend

This is the Spring Boot foundation for the SplitSmart API. Part 2 includes only infrastructure and `GET /api/health`; user authentication and business endpoints are intentionally not implemented yet.

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

Database credentials are intentionally externalized through `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD`. The frontend origin is configurable with `FRONTEND_ORIGIN` for the later integration work.
