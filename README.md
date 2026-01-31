# SLA Compliance Tracker

Full-stack SLA tracking app (React + Vite + TypeScript + Tailwind, Node/Express + TypeScript + MongoDB).


## 🔗 Database Setup & Reorganization

**Important**: The MongoDB database has been reorganized to separate SLA Tracker data from the API Tester project. Please review the documentation before starting.

### Quick Database Links
- **START HERE**: [DB_IMPLEMENTATION_SUMMARY.md](./DB_IMPLEMENTATION_SUMMARY.md) - Executive summary & quick start
- **Data Analysis**: [DATABASE_ANALYSIS_REPORT.md](./DATABASE_ANALYSIS_REPORT.md) - Detailed data review
- **Migration Guide**: [DB_REORGANIZATION_GUIDE.md](./DB_REORGANIZATION_GUIDE.md) - Step-by-step migration
- **Setup Instructions**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) - Connection configuration
- **Architecture**: [DATABASE_ARCHITECTURE_DIAGRAMS.md](./DATABASE_ARCHITECTURE_DIAGRAMS.md) - Visual diagrams
- **API Tester Setup**: [API_TESTER_SETUP.md](./API_TESTER_SETUP.md) - Cleanup & database separation for API Tester
- **Deliverables**: [DELIVERABLES_SUMMARY.md](./DELIVERABLES_SUMMARY.md) - Complete project summary

**API Tester Cleanup & Setup**:
1. `cd backend && node scripts/cleanup-api-tester.js --dry-run` (preview)
2. `cd backend && node scripts/cleanup-api-tester.js` (execute)
3. `cd backend && node scripts/migrate-db.js` (migrate)

**See Also**: [API_TESTER_QUICK_REFERENCE.md](./API_TESTER_QUICK_REFERENCE.md) for quick start

---

## Quick Start

Prereqs: Node 18+, npm, MongoDB connection string.

```bash
# 1) Install deps
cd backend && npm install
cd ../frontend && npm install

# 2) Configure env
cd ../backend
cp .env.example .env   # fill MONGODB_URI, JWT_SECRET, EMAIL_*, FRONTEND_URL

# 3) Build + seed sample data (creates alpha@example.com / Password123!)
npm run build
node scripts/seed.js

# 4) Run servers
npm start               # backend on http://localhost:5000
cd ../frontend
npm run dev             # frontend on http://localhost:5173
```

## Default Credentials
- Email: alpha@example.com
- Password: Password123!

## Useful Commands (backend)
- `npm run build` – compile TypeScript
- `npm start` – run compiled server
- `npm run dev` – ts-node with watch (if configured)
- `node scripts/seed.js` – reseed demo data

## API Base
Frontend is configured to call the backend at `http://localhost:5000/api` via `frontend/.env` (`VITE_API_URL`).

## Repo Layout
```
backend/   # Express API, Mongo models, metrics/alerts/reporting
frontend/  # React UI (Vite), hooks for metrics/tickets/policies
```

## Architecture
- Frontend: React + Vite + TypeScript + Tailwind. Routing via `react-router-dom`, auth token stored in `localStorage`, API calls through Axios client in [frontend/src/services/api.ts](frontend/src/services/api.ts). Base URL comes from [frontend/.env](frontend/.env) (`VITE_API_URL`).
- Backend: Node/Express + TypeScript with JWT auth middleware ([backend/src/middleware/auth.ts](backend/src/middleware/auth.ts)), CORS enabled, feature routes mounted under `/api` ([backend/src/server.ts](backend/src/server.ts)). Core domains: tickets, policies, metrics, reports.
- Database: MongoDB via Mongoose models ([backend/src/models](backend/src/models)) — `Team`, `Ticket`, `SLAPolicy`.
- Metrics: Computed server-side in [backend/src/services/slaCalculator.ts](backend/src/services/slaCalculator.ts) and exposed via the metrics/reporting routes.
- Auth Flow: Register/Login returns a JWT; the frontend stores it and sends it as `Authorization: Bearer <token>`. Protected API routes require a valid token.
- CORS & Env: Backend allows dev origins; set `FRONTEND_URL` in backend `.env`. Frontend points to `http://localhost:5000/api` by default via `VITE_API_URL`.
- Key Paths:
	- Backend: [backend/src/routes](backend/src/routes), [backend/src/models](backend/src/models), [backend/src/services](backend/src/services)
	- Frontend: [frontend/src/pages](frontend/src/pages), [frontend/src/components](frontend/src/components), [frontend/src/hooks](frontend/src/hooks)

## Troubleshooting
- Connection refused / CORS: ensure backend is running on 5000; `VITE_API_URL` matches; FRONTEND_URL in backend `.env` includes the dev port.
- Login fails: rerun seed script, then use default credentials above.
- Ports busy: free 5000/5173 or let Vite pick another port and update FRONTEND_URL if needed.
