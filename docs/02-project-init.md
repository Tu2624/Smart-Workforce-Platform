# 02 — Project Init
## Smart Workforce Platform

## Role

**Persona**: DevOps Engineer & Project Scaffolder
**Primary Focus**: Repository structure, environment configuration, dependency management, migration order, and developer onboarding.
**Perspective**: Think in terms of reproducibility and a surprise-free developer experience. Everything here must be correct for a developer cloning the repo for the first time. When a feature adds a new service, env var, or dependency — this is the first file to update.

### Responsibilities
- Maintain the canonical directory tree for both `backend/` and `frontend/`
- Own all variable definitions in `.env.example` (backend and frontend)
- Track exact dependency versions in the dependencies table
- Define and enforce migration file naming/ordering rules (foreign key order is critical)
- Define git branch strategy, commit message conventions, and PR flow
- Own tooling configuration: ESLint rules, Prettier config, Husky hooks

### Cross-Role Awareness
| When you do this... | Reference this file | Because... |
|---------------------|---------------------|------------|
| Add a new backend env var | `docs/06-deployment.md` §4 | Production ENV checklist must include the new var |
| Add a new npm package | `docs/06-deployment.md` §2 | Dockerfiles use `npm ci` — lock files must be committed |
| Add a new migration file | `docs/01-system-design.md` | New schema must be designed there first; FK order must be respected |
| Change directory structure | `docs/03-backend.md` §1 | Module breakdown and import paths depend on the directory layout |
| Change git workflow | `docs/06-deployment.md` §3 | CI/CD triggers are based on branch names; renaming breaks pipelines |
| Add a new background job file | `docs/03-backend.md` §5 | Job must be documented with schedule and trigger logic |

### Files to Consult First
- `docs/06-deployment.md` — any structural or env change has deployment implications
- `docs/01-system-design.md` — before adding a migration, confirm schema is finalized there

---

## 1. Directory Structure (Monorepo)

```
smart-workforce/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── config/             # DB, env, socket config
│   │   │   ├── database.ts
│   │   │   ├── env.ts
│   │   │   └── socket.ts
│   │   ├── modules/            # Feature modules
│   │   │   ├── auth/
│   │   │   │   ├── auth.router.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   └── auth.schema.ts
│   │   │   ├── job/
│   │   │   ├── shift/
│   │   │   ├── attendance/
│   │   │   ├── payroll/
│   │   │   ├── notification/
│   │   │   ├── report/
│   │   │   └── admin/
│   │   ├── middleware/
│   │   │   ├── authMiddleware.ts
│   │   │   ├── roleGuard.ts
│   │   │   └── errorHandler.ts
│   │   ├── jobs/               # Background jobs (node-cron)
│   │   │   ├── autoAssignShift.ts
│   │   │   ├── autoCalcPayroll.ts
│   │   │   └── sendReminders.ts
│   │   ├── utils/
│   │   │   ├── payrollCalc.ts
│   │   │   ├── reputationCalc.ts
│   │   │   └── conflictCheck.ts
│   │   └── app.ts              # Express app entry point
│   ├── migrations/             # SQL migration files
│   ├── seeds/                  # Seed data
│   ├── tests/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React + Tailwind
│   ├── src/
│   │   ├── api/                # Axios instances + API calls
│   │   ├── components/         # Shared components
│   │   │   ├── ui/             # Button, Modal, Badge, etc.
│   │   │   ├── Calendar/
│   │   │   ├── Navbar/
│   │   │   └── Notification/
│   │   ├── pages/
│   │   │   ├── auth/           # Login, Register
│   │   │   ├── student/        # Dashboard, Schedule, Payroll
│   │   │   ├── employer/       # Dashboard, Jobs, Shifts, Reports
│   │   │   └── admin/          # Users, Stats
│   │   ├── hooks/              # Custom hooks (useSocket, useAuth, etc.)
│   │   ├── store/              # Zustand stores
│   │   ├── types/              # TypeScript types
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── docs/                       # Project documentation
│   ├── 01-system-design.md
│   ├── 02-project-init.md
│   ├── 03-backend.md
│   ├── 04-frontend.md
│   ├── 05-testing.md
│   └── 06-deployment.md
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## 2. Environment Requirements

| Tool | Minimum version |
|------|----------------|
| Node.js | 20.x LTS |
| npm | 10.x |
| MySQL | 8.0+ |
| Git | 2.40+ |

---

## 3. Environment Variables

### `backend/.env.example`
```env
# Server
PORT=3001
NODE_ENV=development

# Database — MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_workforce
DB_USER=root
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Background jobs
CRON_PAYROLL_SCHEDULE="0 0 * * *"       # daily at 00:00
CRON_REMINDER_SCHEDULE="*/30 * * * *"   # every 30 minutes
```

### `frontend/.env.example`
```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

---

## 4. Scripts

### Backend (`backend/package.json`)
```json
{
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "migrate": "db-migrate up",
    "migrate:down": "db-migrate down",
    "seed": "tsx seeds/index.ts",
    "test": "jest --runInBand",
    "test:watch": "jest --watch",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

### Frontend (`frontend/package.json`)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "prettier --write src/**/*.{ts,tsx}"
  }
}
```

---

## 5. First-Time Setup

```bash
# 1. Clone repo
git clone <repo-url>
cd smart-workforce

# 2. Setup backend
cd backend
cp .env.example .env      # fill in actual values
npm install
npm run migrate           # create tables
npm run seed              # insert sample data
npm run dev               # runs on port 3001

# 3. Setup frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # runs on port 5173

# 4. Or use Docker
cd ..
docker-compose up -d
```

---

## 6. Main Dependencies

### Backend
```json
{
  "dependencies": {
    "express": "^4.18",
    "mysql2": "^3.6",
    "uuid": "^9.0",
    "bcryptjs": "^2.4",
    "jsonwebtoken": "^9.0",
    "socket.io": "^4.7",
    "node-cron": "^3.0",
    "zod": "^3.22",
    "cors": "^2.8",
    "helmet": "^7.0",
    "morgan": "^1.10"
  },
  "devDependencies": {
    "typescript": "^5.3",
    "tsx": "^4.7",
    "jest": "^29",
    "supertest": "^6.3",
    "@types/express": "^4.17",
    "@types/uuid": "^9.0",
    "@types/jsonwebtoken": "^9.0",
    "db-migrate": "^0.11",
    "db-migrate-mysql": "^0.2",
    "eslint": "^8.56",
    "prettier": "^3.2",
    "husky": "^9.0"
  }
}
```

> **Changes from PostgreSQL**:
> - `pg` → `mysql2` (MySQL driver, uses `mysql2/promise` for Promise API)
> - `uuid` added — generate UUID in TypeScript before INSERT (MySQL has no `RETURNING`)
> - `@types/pg` → `@types/uuid`
> - `db-migrate` + `db-migrate-mysql` — replaces `node-pg-migrate`

### Frontend
```json
{
  "dependencies": {
    "react": "^18.2",
    "react-dom": "^18.2",
    "react-router-dom": "^6.21",
    "axios": "^1.6",
    "socket.io-client": "^4.7",
    "zustand": "^4.5",
    "react-big-calendar": "^1.11",
    "date-fns": "^3.3",
    "react-hook-form": "^7.49",
    "zod": "^3.22",
    "@hookform/resolvers": "^3.3"
  },
  "devDependencies": {
    "typescript": "^5.3",
    "vite": "^5.0",
    "@vitejs/plugin-react": "^4.2",
    "tailwindcss": "^3.4",
    "autoprefixer": "^10.4",
    "postcss": "^8.4",
    "vitest": "^1.2",
    "@testing-library/react": "^14.1",
    "@playwright/test": "^1.41"
  }
}
```

---

## 7. Git Workflow

### Branch Strategy
```
main          ← production-ready code (protected)
├── develop   ← integration branch
│   ├── feature/auth-module
│   ├── feature/shift-management
│   ├── feature/payroll-calc
│   ├── fix/checkin-late-detection
│   └── chore/setup-ci
```

### Commit Conventions (Conventional Commits)
```
feat: add shift registration endpoint
fix: correct late-check calculation
docs: update API spec for payroll module
chore: configure eslint rules
test: add unit tests for reputationCalc
refactor: extract payroll logic to service layer
```

### Pull Request Flow
1. Create branch from `develop`: `git checkout -b feature/your-feature`
2. Commit using Conventional Commits
3. Push and open PR into `develop`
4. Code review → merge
5. Merge `develop` → `main` on release

---

## 8. Tooling

### ESLint (`backend/.eslintrc.json`)
```json
{
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

### Prettier (`.prettierrc`)
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

### Husky (pre-commit hook)
```bash
# .husky/pre-commit
npm run lint
npm run test -- --passWithNoTests
```

---

## 9. Database Migration Strategy

Uses `db-migrate` + `db-migrate-mysql`. This tool requires a config file `backend/database.json`:

```json
{
  "dev": {
    "driver": "mysql",
    "host": { "ENV": "DB_HOST" },
    "port": { "ENV": "DB_PORT" },
    "database": { "ENV": "DB_NAME" },
    "user": { "ENV": "DB_USER" },
    "password": { "ENV": "DB_PASSWORD" },
    "timezone": "+07:00"
  },
  "test": {
    "driver": "mysql",
    "host": { "ENV": "DB_HOST" },
    "port": { "ENV": "DB_PORT" },
    "database": { "ENV": "DB_NAME" },
    "user": { "ENV": "DB_USER" },
    "password": { "ENV": "DB_PASSWORD" },
    "timezone": "+07:00"
  }
}
```

Each migration is a JavaScript file with `exports.up` and `exports.down`:

```javascript
// migrations/20240101000000-create-users.js
'use strict'
exports.up = function(db) {
  return db.runSql(`
    CREATE TABLE users (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
      ...
    ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `)
}
exports.down = function(db) {
  return db.runSql('DROP TABLE IF EXISTS users')
}
exports._meta = { version: 1 }
```

### Migration list (FK dependency order — DO NOT change this order)
```
migrations/
├── 20240101000000-create-users.js
├── 20240101000100-create-employer-profiles.js
├── 20240101000200-create-student-profiles.js
├── 20240101000300-create-jobs.js
├── 20240101000400-create-shifts.js
├── 20240101000500-create-shift-registrations.js
├── 20240101000600-create-attendance.js
├── 20240101000700-create-payroll.js
├── 20240101000800-create-payroll-items.js
├── 20240101000900-create-notifications.js
├── 20240101001000-create-reputation-events.js
└── 20240101001100-create-ratings.js
```

Migrations must run in the order above (due to foreign key dependencies).
- `ratings` depends on `shifts`, `users` → must run after the shifts and users migrations.
- `payroll_items` depends on `payroll`, `shifts`, `attendance` → must run after all three.

### Commands
```bash
npm run migrate         # db-migrate up — run all new migrations
npm run migrate:down    # db-migrate down — rollback 1 migration
npx db-migrate down --count 3  # rollback 3 migrations (different from node-pg-migrate: must use --count)
npx db-migrate status   # view status of each migration
```
