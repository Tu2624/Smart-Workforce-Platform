# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Smart Workforce Platform** — A part-time workforce management system for students. Three roles: `admin`, `employer`, `student`. Built as a monorepo with separate `backend/` and `frontend/` directories.

## Commands

### Backend (`cd backend`)
```bash
npm run dev          # tsx watch — hot reload at http://localhost:3001
npm run build        # tsc compile to dist/
npm run migrate      # run pending DB migrations (node-pg-migrate)
npm run migrate:down # rollback last migration
npm run seed         # seed test data (see README for test accounts)
npm run test         # Jest (runs from backend/tests/)
npm run test:watch   # Jest watch mode
npm run lint         # ESLint on src/
```

### Frontend (`cd frontend`)
```bash
npm run dev          # Vite dev server at http://localhost:5173
npm run build        # tsc + vite build
npm run test         # Vitest
npm run test:e2e     # Playwright e2e
npm run lint         # ESLint on src/
```

### Docker (full stack)
```bash
docker-compose up -d   # starts postgres + backend (auto-migrates) + frontend
```

## Architecture

### Backend (`backend/src/`)

**Module structure** — each feature is a self-contained folder under `modules/`:
```
modules/<name>/
  <name>.router.ts      # Express routes with authMiddleware + roleGuard
  <name>.controller.ts  # req/res handling, calls service
  <name>.service.ts     # business logic + raw pg queries
  <name>.schema.ts      # Zod validation schemas
```

Modules: `auth`, `job`, `shift`, `attendance`, `payroll`, `notification`, `report`, `admin`

**Entry point** `src/app.ts` — wires Express, Socket.io, all routers, error handler, and starts background cron jobs.

**Auth flow** — JWT-based. `authMiddleware` verifies Bearer token and attaches `req.user: { id, email, role }`. `roleGuard(...roles)` restricts routes by role. Both are applied per-router, not globally.

**Database** — raw `pg` (no ORM). `src/config/database.ts` exports a pool. Services use `pool.query()` directly. Schema is managed via `node-pg-migrate` files in `migrations/`.

**Realtime** — Socket.io initialized in `src/config/socket.ts`. Use `notifyUser(userId, event, data)` or `notifyShiftRoom(shiftId, event, data)` from any service. Clients join personal rooms (`user_<id>`) and shift rooms (`shift_<id>`).

**Background jobs** (`src/jobs/`):
- `autoCalcPayroll.ts` — cron default `0 0 * * *`
- `sendReminders.ts` — cron default `*/30 * * * *`
- `autoAssignShift.ts` — called programmatically (not scheduled)

**Utilities** (`src/utils/`):
- `conflictCheck.ts` — shift overlap detection
- `payrollCalc.ts` — wage calculation logic
- `reputationCalc.ts` — student reputation scoring

### Frontend (`frontend/src/`)

**State** — Zustand stores in `store/`. `authStore.ts` uses `persist` middleware (localStorage key `auth-store`). JWT token is also stored directly in `localStorage` under key `token`.

**API layer** — `api/client.ts` is an axios instance that auto-attaches `Authorization: Bearer <token>` and redirects to `/login` on 401. Individual resource modules (`api/jobs.ts`, `api/shifts.ts`, etc.) import this client.

**Routing** — React Router v6, pages split by role under `pages/admin/`, `pages/employer/`, `pages/student/`, `pages/auth/`.

**Sockets** — `hooks/useSocket.ts` and `hooks/useNotificationSocket.ts` wrap socket.io-client. Components use these hooks to subscribe to real-time events.

**Env vars** — `VITE_API_URL` (default `/api`) and `VITE_SOCKET_URL` configure the backend connection.

## Key Design Decisions

- **No ORM**: all SQL is written manually in service files. Use parameterized queries (`$1`, `$2`) — never string interpolation.
- **Validation at router level**: Zod schemas in `*.schema.ts` are applied as middleware before controllers.
- **Tests live in `backend/tests/`** (not co-located with source). Jest runs with `--runInBand` to avoid DB connection race conditions.
- **Migrations are append-only**: never edit existing migration files; always add a new one.

## Skills (Slash Commands)

Ba lệnh tắt để làm việc đúng quy trình. Gõ trực tiếp trong Claude Code chat.

### `/feature <tên feature>`
**Dùng khi**: Bắt đầu implement bất kỳ feature nào — kể cả nhỏ.

Skill này đọc `docs/system-overview.md`, tra Feature Impact Matrix, và tạo checklist 6 bước cụ thể cho feature đó. Đây là bước bắt buộc trước khi code.

```
/feature auth và đăng ký tài khoản
/feature quản lý ca làm (shift CRUD)
/feature check-in check-out với late detection
/feature tính lương tự động
```

### `/check`
**Dùng khi**: Trước khi `git commit` — sau khi xong một feature hoặc một phần lớn.

Verify 4 cross-layer contracts (DB↔API, API↔Frontend, Socket↔Hook, Rule↔Test) chưa bị break. Báo cáo ✅ / ⚠️ / ❌ cho từng contract.

```
/check
/check sau khi thêm enum value mới cho shift status
```

### `/contracts <topic>`
**Dùng khi**: Chạm vào 4 điểm nhạy cảm nhất — auth/JWT, enum values, Socket.io events, business rule constants.

Load cross-layer awareness và liệt kê cụ thể những gì cần kiểm tra trước khi thay đổi.

```
/contracts JWT token và role guard
/contracts attendance.status enum
/contracts socket event shift:approved
/contracts payroll bonus penalty formula
```

### Workflow thực tế cho mỗi feature

```
1. /feature <tên>          ← đọc context, nhận checklist
2. ... implement code ...
3. /contracts <topic>      ← khi chạm auth/enum/socket/rule
4. /check                  ← trước khi commit
5. git commit
```
