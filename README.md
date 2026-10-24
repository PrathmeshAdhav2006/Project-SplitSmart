# SplitSmart

SplitSmart is a frontend-only React/Vite preview for managing shared expenses and settlements.

## Frontend preview (Part 1)

Prerequisites: Node.js 18+ and npm.

```powershell
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The preview uses an in-memory mock adapter in [`frontend/src/mockApi.js`](./frontend/src/mockApi.js) by default. To use the Spring Boot API, set `VITE_USE_BACKEND=true` and optionally `VITE_API_URL=http://localhost:8080` before starting Vite. The API mode requires the backend and MySQL to be running.

The preview includes the dashboard, group overview, member list, expense history and filters, equal/custom split form, balances, settlement suggestions, and settlement history. Mock mode is not persisted; API mode sends cookies and CSRF headers to the backend.
