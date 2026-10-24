# SplitSmart

SplitSmart is a full-stack shared expense and settlement manager for roommates, students, and small groups. Users can create groups, add registered members, record shared expenses, calculate balances, review deterministic settlement suggestions, and record completed payments.

The project is organized as a monorepo:

```text
SplitSmart/
├── frontend/          React + Vite application
├── backend/           Spring Boot Maven application
├── .gitignore
└── README.md          This project guide
```

## Features

- User registration, login, logout, and current-session lookup
- BCrypt password hashing
- Session-based authentication with CSRF protection
- Group creation and registered-email member management
- Group membership authorization on group-scoped endpoints
- Expense creation, listing, filtering, editing, and deletion
- Equal and custom expense shares
- Exact money handling with Java `BigDecimal` and MySQL `DECIMAL(12,2)`
- Group balance calculation from persisted expenses and completed settlements
- Deterministic settlement suggestions
- Settlement history and owner-authorized settlement voiding
- Monthly group expense summaries
- Responsive React dashboard, group pages, expense form, member list, and settlement views
- Mock frontend mode for demonstrations without a running backend

## Technology stack

### Frontend

- React 18
- JavaScript
- Vite
- React Router
- Semantic HTML and ordinary CSS
- `Intl.NumberFormat` for INR display

### Backend

- Java 17
- Spring Boot 3
- Spring Web
- Spring Security
- Bean Validation
- Spring JDBC with `JdbcTemplate`
- Flyway database migrations
- Maven

### Database

- MySQL 8
- InnoDB
- `utf8mb4`
- Foreign keys, indexes, uniqueness constraints, and check constraints

The backend intentionally does not use JPA/Hibernate. SQL is kept in repositories and business rules are kept in services.

## Prerequisites

Install the following tools:

- Java 17 or newer
- Maven 3.9 or newer
- Node.js 18 or newer
- npm
- MySQL 8

Verify the installations:

```powershell
java -version
mvn -version
node --version
npm --version
```

## Database setup

Create the database and a local application user in MySQL. Replace the placeholder password with a local-only value:

```sql
CREATE DATABASE splitsmart
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'splitsmart_app'@'localhost'
  IDENTIFIED BY '<local-password>';

GRANT ALL PRIVILEGES ON splitsmart.* TO 'splitsmart_app'@'localhost';
FLUSH PRIVILEGES;
```

The backend runs Flyway migrations automatically at startup. The migrations create:

- Application metadata
- Users
- Groups and group members
- Expenses and expense shares
- Settlements

Do not run destructive database commands against a database containing data.

## Backend configuration

Backend configuration is stored in [`backend/src/main/resources/application.properties`](./backend/src/main/resources/application.properties).

Copy the safe example configuration and provide local values through environment variables. Never commit a real password:

```powershell
$env:DB_URL="jdbc:mysql://localhost:3306/splitsmart?useSSL=false&serverTimezone=UTC"
$env:DB_USERNAME="splitsmart_app"
$env:DB_PASSWORD="<local-password>"
$env:SERVER_PORT="8080"
$env:FRONTEND_ORIGIN="http://localhost:5173"
```

The same values are documented in [`backend/.env.example`](./backend/.env.example). Spring Boot reads:

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/splitsmart?useSSL=false&serverTimezone=UTC` | MySQL JDBC URL |
| `DB_USERNAME` | `splitsmart_app` | Database username |
| `DB_PASSWORD` | empty | Database password |
| `SERVER_PORT` | `8080` | Backend HTTP port |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

## Running the application

Start the backend first:

```powershell
cd backend
mvn spring-boot:run
```

The backend is available at `http://localhost:8080`.

Check its health:

```powershell
curl http://localhost:8080/api/health
```

Expected response:

```json
{"status":"ok","service":"splitsmart-backend"}
```

In a second terminal, install and start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Frontend modes

### Mock mode

Mock mode is the default and does not require MySQL or the backend:

```powershell
cd frontend
npm run dev
```

Mock data is defined in [`frontend/src/mockApi.js`](./frontend/src/mockApi.js). It is in-memory and is not persisted.

### Backend mode

Use the live Spring Boot API:

```powershell
cd frontend
$env:VITE_USE_BACKEND="true"
$env:VITE_API_URL="http://localhost:8080"
npm run dev
```

The adapter in [`frontend/src/api/client.js`](./frontend/src/api/client.js):

- Sends session cookies with `credentials: include`
- Reads the `XSRF-TOKEN` cookie
- Sends `X-XSRF-TOKEN` on state-changing requests
- Converts backend responses into the view model used by the React screens
- Surfaces structured backend errors

## API overview

All APIs are under `/api`.

### Health

- `GET /api/health`

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/csrf`

Registration JSON:

```json
{
  "fullName": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "local-password"
}
```

Login JSON:

```json
{
  "email": "aarav@example.com",
  "password": "local-password"
}
```

### Groups and members

- `GET /api/groups`
- `POST /api/groups`
- `GET /api/groups/{groupId}`
- `GET /api/groups/{groupId}/members`
- `POST /api/groups/{groupId}/members`

Only registered users can be added by email. Only the group owner can add members.

### Expenses

- `GET /api/groups/{groupId}/expenses`
- `GET /api/groups/{groupId}/expenses?category=Food`
- `GET /api/groups/{groupId}/expenses/{expenseId}`
- `POST /api/groups/{groupId}/expenses`
- `PUT /api/groups/{groupId}/expenses/{expenseId}`
- `DELETE /api/groups/{groupId}/expenses/{expenseId}`

Expense writes validate group membership, payer membership, unique participants, supported split methods, amount precision, and exact custom-share totals. The original payer or group owner can edit/delete an expense.

### Balances and settlements

- `GET /api/groups/{groupId}/balances`
- `GET /api/groups/{groupId}/settlement-suggestions`
- `GET /api/groups/{groupId}/settlements`
- `POST /api/groups/{groupId}/settlements`
- `DELETE /api/groups/{groupId}/settlements/{settlementId}`

Only a group owner can void a completed settlement. A void is recorded as a state change rather than deleting the historical row.

### Summaries

- `GET /api/groups/{groupId}/summary/monthly`

## Money and settlement rules

- Monetary values use `BigDecimal` in Java and `DECIMAL(12,2)` in MySQL.
- Amounts must be positive and have no more than two decimal places.
- Equal splits convert the total to integer paise, divide paise evenly, and assign leftover paise in ascending stable user-ID order.
- Custom shares must contain unique group members and sum exactly to the expense total.
- A payer's own share is included in their obligation when they participate.
- Net position is calculated as:

```text
amount paid for active expenses
- assigned expense shares
- completed settlements paid
+ completed settlements received
```

- Positive net position means the member should receive money.
- Negative net position means the member owes money.
- Suggestions use a deterministic greedy process that repeatedly matches the largest remaining debtor with the largest remaining creditor. This produces compact, explainable transfers but is not guaranteed to be mathematically minimal for every graph.
- Suggestions do not change balances. Only recording an actual settlement changes persisted settlement data.

## Project structure

```text
backend/
├── pom.xml
└── src/main/
    ├── java/com/splitsmart/
    │   ├── config/
    │   ├── controller/
    │   ├── dto/
    │   ├── exception/
    │   ├── model/
    │   ├── repository/
    │   └── service/
    └── resources/
        ├── application.properties
        └── db/migration/

frontend/
├── package.json
└── src/
    ├── api/
    ├── components/
    ├── hooks/
    ├── pages/
    ├── styles.css
    ├── App.jsx
    ├── main.jsx
    └── mockApi.js
```

## Security notes

- Passwords are stored only as BCrypt hashes.
- Database credentials are externalized and must not be committed.
- SQL statements use parameters rather than string concatenation.
- CORS allows only the configured frontend origin.
- Session cookies and CSRF protection are enabled for the local application flow.
- Group membership is checked in the service layer for group-scoped requests.
- React renders user text normally and does not use raw HTML rendering.

This configuration is suitable for a local student demonstration. A production deployment would additionally require HTTPS, hardened cookie settings, secret management, monitoring, backups, and a formal deployment security review.

## Troubleshooting

### Maven is not recognized

Install Maven, add its `bin` directory to `PATH`, and restart the terminal. Java must also be available through `JAVA_HOME` or the system path.

### MySQL connection failure

Check that MySQL is running, the `splitsmart` database exists, and `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` match the local database account.

### CORS error in the browser

Confirm the frontend URL matches `FRONTEND_ORIGIN`, including the port. Restart the backend after changing the environment variable.

### Authentication requests return 403

Call `GET /api/auth/csrf` before the first state-changing request. The frontend API client does this automatically before login and registration, and sends the CSRF token header for subsequent writes.

### The frontend shows mock data

Set `VITE_USE_BACKEND=true` in the same terminal used to run Vite, and verify that the backend is running on the URL configured by `VITE_API_URL`.

### Empty dashboard after registration

This is expected until the user creates a group. The live frontend displays an empty-group state rather than using fake persisted data.

## Validation

Frontend production build:

```powershell
cd frontend
npm run build
```

Backend package/build:

```powershell
cd backend
mvn -DskipTests package
```

The project currently follows the original project scope and does not include an automated test suite. Tests can be added separately if required.

## Current status

The full frontend and backend feature path is implemented. The application can run in mock mode without infrastructure or in live mode with Java, Maven, MySQL, and the Spring Boot backend configured locally.
