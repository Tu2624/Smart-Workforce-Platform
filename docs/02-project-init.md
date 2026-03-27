# 02 — Project Init
## Smart Workforce Platform

## Role

**Persona**: DevOps Engineer & Project Scaffolder
**Primary Focus**: Cấu trúc repository, cấu hình môi trường, quản lý dependency, thứ tự migration, và onboarding developer.
**Perspective**: Tư duy về tính reproducible và developer experience không có bất ngờ. Mọi thông tin ở đây phải đúng với một developer clone repo lần đầu. Khi một feature thêm service mới, env var mới, hoặc dependency mới — đây là file đầu tiên phải cập nhật.

### Responsibilities
- Duy trì cây thư mục chuẩn tắc cho cả `backend/` và `frontend/`
- Sở hữu tất cả định nghĩa biến trong `.env.example` (backend và frontend)
- Theo dõi phiên bản dependency chính xác trong bảng dependencies
- Định nghĩa và thực thi quy tắc đặt tên/thứ tự migration file (thứ tự foreign key là critical)
- Định nghĩa git branch strategy, quy ước commit message, và PR flow
- Sở hữu cấu hình tooling: ESLint rules, Prettier config, Husky hooks

### Cross-Role Awareness
| Khi bạn làm điều này... | Tham chiếu file này | Vì... |
|--------------------------|---------------------|-------|
| Thêm env var backend mới | `docs/06-deployment.md` §4 | Production ENV checklist phải bao gồm var mới |
| Thêm npm package mới | `docs/06-deployment.md` §2 | Dockerfiles dùng `npm ci` — lock files phải được commit |
| Thêm migration file mới | `docs/01-system-design.md` | Schema mới phải được thiết kế ở đây trước; thứ tự FK phải được tôn trọng |
| Thay đổi cấu trúc thư mục | `docs/03-backend.md` §1 | Module breakdown và import paths phụ thuộc vào layout thư mục |
| Thay đổi git workflow | `docs/06-deployment.md` §3 | CI/CD triggers dựa trên tên branch; đổi tên branch phá vỡ pipelines |
| Thêm background job file mới | `docs/03-backend.md` §5 | Job phải được document với schedule và trigger logic |

### Files to Consult First
- `docs/06-deployment.md` — mọi thay đổi cấu trúc hoặc env đều có deployment implications
- `docs/01-system-design.md` — trước khi thêm migration, xác nhận schema đã được finalize ở đây

---

## 1. Cấu Trúc Thư Mục (Monorepo)

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
│   │   └── app.ts              # Express app entry
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
├── docs/                       # Tài liệu dự án
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

## 2. Yêu Cầu Môi Trường

| Công cụ | Version tối thiểu |
|---------|------------------|
| Node.js | 20.x LTS |
| npm | 10.x |
| PostgreSQL | 15.x |
| Git | 2.40+ |

---

## 3. Biến Môi Trường

### `backend/.env.example`
```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_workforce
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Background jobs
CRON_PAYROLL_SCHEDULE="0 0 * * *"       # mỗi ngày 00:00
CRON_REMINDER_SCHEDULE="*/30 * * * *"   # mỗi 30 phút
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
    "migrate": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down",
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

## 5. Setup Lần Đầu

```bash
# 1. Clone repo
git clone <repo-url>
cd smart-workforce

# 2. Setup backend
cd backend
cp .env.example .env      # điền thông tin thực
npm install
npm run migrate           # tạo tables
npm run seed              # seed dữ liệu mẫu
npm run dev               # chạy ở port 3001

# 3. Setup frontend (terminal mới)
cd frontend
cp .env.example .env
npm install
npm run dev               # chạy ở port 5173

# 4. Hoặc dùng Docker
cd ..
docker-compose up -d
```

---

## 6. Dependencies Chính

### Backend
```json
{
  "dependencies": {
    "express": "^4.18",
    "pg": "^8.11",
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
    "@types/pg": "^8.10",
    "@types/jsonwebtoken": "^9.0",
    "eslint": "^8.56",
    "prettier": "^3.2",
    "husky": "^9.0"
  }
}
```

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

### Quy tắc commit (Conventional Commits)
```
feat: add shift registration endpoint
fix: correct late-check calculation
docs: update API spec for payroll module
chore: configure eslint rules
test: add unit tests for reputationCalc
refactor: extract payroll logic to service layer
```

### Pull Request Flow
1. Tạo branch từ `develop`: `git checkout -b feature/your-feature`
2. Commit theo Conventional Commits
3. Push và tạo PR vào `develop`
4. Code review → merge
5. Merge `develop` → `main` khi release

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

Dùng `node-pg-migrate`. Mỗi migration là 1 file có timestamp:

```
migrations/
├── 1710000000000_create-users.js
├── 1710000001000_create-employer-profiles.js
├── 1710000002000_create-student-profiles.js
├── 1710000003000_create-jobs.js
├── 1710000004000_create-shifts.js
├── 1710000005000_create-shift-registrations.js
├── 1710000006000_create-attendance.js
├── 1710000007000_create-payroll.js
├── 1710000008000_create-notifications.js
├── 1710000009000_create-reputation-events.js
└── 1710000010000_create-ratings.js
```

Thứ tự chạy migration phải đúng thứ tự trên (do foreign key dependencies).
- `ratings` phụ thuộc `shifts`, `users` → phải chạy sau migration shift và users.
