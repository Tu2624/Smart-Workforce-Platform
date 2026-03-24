# Smart Workforce Platform

Hệ thống quản lý và tự động hóa nhân sự cho sinh viên part-time.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 15
- **Auth**: JWT
- **Realtime**: Socket.io

## Quick Start

### Yêu cầu
- Node.js 20.x LTS
- PostgreSQL 15.x
- npm 10.x

### Setup thủ công

```bash
# 1. Backend
cd backend
cp .env.example .env        # điền DB password và JWT secret
npm install
npm run migrate             # tạo tables
npm run seed                # seed dữ liệu test
npm run dev                 # http://localhost:3001

# 2. Frontend (terminal mới)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

### Setup với Docker

```bash
docker-compose up -d
# Backend tự động chạy migrate khi khởi động
```

## Tài khoản test

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | Admin123! |
| Employer | employer1@test.com | Employer123! |
| Student | student1@test.com | Student123! |
| Student | student2@test.com | Student123! |

## Tài liệu

Xem thư mục `docs/` để biết chi tiết:

- `docs/01-system-design.md` — Kiến trúc, DB schema, Socket events
- `docs/02-project-init.md` — Setup môi trường, cấu trúc thư mục
- `docs/03-backend.md` — API endpoints, business logic
- `docs/04-frontend.md` — Routes, components, UI flows
- `docs/05-testing.md` — Test cases, test data
- `docs/06-deployment.md` — Docker, CI/CD, deployment checklist

## Scripts

### Backend
```bash
npm run dev          # dev server (tsx watch)
npm run build        # TypeScript compile
npm run start        # chạy production build
npm run migrate      # chạy DB migrations
npm run migrate:down # rollback 1 migration
npm run seed         # seed test data
npm run test         # Jest tests
npm run lint         # ESLint
```

### Frontend
```bash
npm run dev          # Vite dev server
npm run build        # production build
npm run test         # Vitest
npm run test:e2e     # Playwright e2e
npm run lint         # ESLint
```
