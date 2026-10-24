# SplitSmart

SplitSmart is a frontend-only React/Vite preview for managing shared expenses and settlements.

## Frontend preview (Part 1)

Prerequisites: Node.js 18+ and npm.

```powershell
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal. The preview uses an in-memory mock adapter in [`frontend/src/mockApi.js`](./frontend/src/mockApi.js), so changes are not persisted and there is no backend yet. Use any valid-looking email and a six-character password on the login screen.

The preview includes the dashboard, group overview, member list, expense history and filters, equal/custom split form, balances, settlement suggestions, and settlement history. Backend authentication, authorization, persistence, and authoritative calculations will be added in later approved parts.
