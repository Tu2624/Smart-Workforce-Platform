# 06 — Deployment
## Smart Workforce Platform

## Role

**Persona**: DevOps & Release Engineer
**Primary Focus**: Docker image definitions, CI/CD pipeline configuration, tính đầy đủ của environment variables, an toàn migration trên production, và release gate checklists.
**Perspective**: Bạn chịu trách nhiệm về khoảng cách giữa "hoạt động trên máy tôi" và "đang chạy trên production." Mỗi file trong docs set đều có deployment consequences: env var mới, migration mới, test dependency mới. Khi làm việc trong file này, quét các file docs khác để tìm mọi thay đổi kể từ lần release cuối và xác minh deployment implications đã được xử lý ở đây.

### Responsibilities
- Duy trì Dockerfile definitions cho backend (multi-stage) và frontend (nginx)
- Sở hữu docker-compose setup cho cả development và production
- Định nghĩa và duy trì GitHub Actions CI pipeline (test jobs, E2E job, deploy job)
- Duy trì production ENV variable checklist (phải đầy đủ tuyệt đối)
- Định nghĩa quy trình migration deployment an toàn và rollback plan
- Định nghĩa release checklist (mỗi item phải verifiable, không phải aspirational)
- Sở hữu health check endpoint contract

### Cross-Role Awareness
| Khi bạn làm điều này... | Tham chiếu file này | Vì... |
|--------------------------|---------------------|-------|
| Cập nhật ENV checklist | `docs/02-project-init.md` §3 | `.env.example` là nguồn sự thật về vars nào tồn tại |
| Thêm build step vào Dockerfile | `docs/02-project-init.md` §6 | Package manager và lock file location xác định `npm ci` path đúng |
| Cấu hình CI migration step | `docs/02-project-init.md` §9 | Thứ tự migration file và DB connection pattern được định nghĩa ở đó |
| Cấu hình CI chạy tests | `docs/05-testing.md` | Test commands, seed strategy, và env vars cần thiết cho tests được định nghĩa ở đó |
| Thêm health check configuration | `docs/03-backend.md` | Endpoint `/api/health` phải tồn tại như route thực trong backend |
| Cập nhật release checklist | tất cả docs files | Mỗi layer (schema, API, frontend, tests) đóng góp release gate items riêng |
| Cấu hình WebSocket proxy trong nginx | `docs/01-system-design.md` §5 | Socket.io event paths và upgrade requirements được derive từ event map |

### Files to Consult First
- `docs/02-project-init.md` — cho env vars, dependency versions, migration ordering
- `docs/05-testing.md` — cho CI test commands, seed strategy, test account credentials
- `docs/03-backend.md` — xác nhận health check endpoint spec đã được implement

---

## 1. Environments

| Environment | Mục đích | URL |
|-------------|----------|-----|
| **Development** | Local dev, hot-reload | `localhost:5173` (FE), `localhost:3001` (BE) |
| **Staging** | Test trước release, giống production | `staging.smart-workforce.com` |
| **Production** | Live app | `smart-workforce.com` |

---

## 2. Docker Setup

### `docker-compose.yml` (Development)
```yaml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    container_name: sw_postgres
    environment:
      POSTGRES_DB: smart_workforce
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: sw_backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=smart_workforce
      - DB_USER=postgres
      - DB_PASSWORD=postgres
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
    command: npm run dev

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    container_name: sw_frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3001/api
      - VITE_SOCKET_URL=http://localhost:3001

volumes:
  postgres_data:
```

### `backend/Dockerfile` (Production)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --omit=dev
EXPOSE 3001
CMD ["node", "dist/app.js"]
```

### `frontend/Dockerfile` (Production)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### `frontend/nginx.conf`
```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 3. CI/CD Pipeline (GitHub Actions)

### `.github/workflows/ci.yml`
```yaml
name: CI

on:
  push:
    branches: [develop, main]
  pull_request:
    branches: [develop, main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: smart_workforce_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install backend deps
        run: cd backend && npm ci

      - name: Run migrations
        run: cd backend && npm run migrate
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: smart_workforce_test
          DB_USER: postgres
          DB_PASSWORD: postgres

      - name: Run backend tests
        run: cd backend && npm test
        env:
          NODE_ENV: test
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: smart_workforce_test
          DB_USER: postgres
          DB_PASSWORD: postgres
          JWT_SECRET: test_secret

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend deps
        run: cd frontend && npm ci

      - name: Run frontend tests
        run: cd frontend && npm test

      - name: Build frontend
        run: cd frontend && npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: [backend-test, frontend-test]
    if: github.ref == 'refs/heads/develop'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Start services
        run: docker-compose up -d
        timeout-minutes: 3

      - name: Wait for services
        run: sleep 15

      - name: Install Playwright
        run: cd frontend && npx playwright install chromium

      - name: Run E2E tests
        run: cd frontend && npm run test:e2e
```

### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker images
        run: |
          docker build -t sw-backend:latest ./backend
          docker build -t sw-frontend:latest ./frontend

      # Thêm bước deploy lên server (SSH, Railway, Render, etc.)
      - name: Deploy
        run: echo "Add deployment steps here"
```

---

## 4. ENV Variables Checklist

### Backend Production
```
✅ PORT                  — port server (default 3001)
✅ NODE_ENV              — "production"
✅ DB_HOST               — PostgreSQL host
✅ DB_PORT               — PostgreSQL port
✅ DB_NAME               — tên database
✅ DB_USER               — user DB
✅ DB_PASSWORD           — password DB (dùng secrets manager)
✅ JWT_SECRET            — chuỗi ngẫu nhiên ≥ 32 ký tự
✅ JWT_EXPIRES_IN        — "7d"
✅ CORS_ORIGIN           — URL frontend production
✅ CRON_PAYROLL_SCHEDULE — cron expression
✅ CRON_REMINDER_SCHEDULE— cron expression
```

### Frontend Production
```
✅ VITE_API_URL          — URL backend API production
✅ VITE_SOCKET_URL       — URL Socket.io production
```

---

## 5. Database Migration Strategy

### Development
```bash
npm run migrate          # chạy tất cả migration mới
npm run migrate:down     # rollback 1 migration
```

### Production
- Migration chạy **trước** khi deploy app mới
- Luôn chạy migration theo thứ tự số timestamp
- Không bao giờ sửa migration đã chạy — tạo migration mới để thay đổi schema
- Backup DB trước mỗi lần migrate production

### Rollback Plan
```bash
# Nếu migration thất bại:
npm run migrate:down     # rollback migration vừa chạy
# Deploy lại version cũ của app
# Điều tra lỗi → fix migration → deploy lại
```

---

## 6. Health Check

### Backend endpoint: `GET /api/health`
```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 3600,
  "timestamp": "2024-03-25T10:00:00Z"
}
```

Dùng cho:
- Docker healthcheck
- Load balancer health probe
- Monitoring (Uptime Robot, Better Stack)

---

## 7. Deployment Checklist (mỗi release)

```
□ Tất cả tests pass trên CI
□ E2E tests pass
□ Backup database production
□ Chạy migrations trên production DB
□ Deploy backend image mới
□ Verify /api/health trả về 200
□ Deploy frontend image mới
□ Smoke test: đăng nhập, tạo shift, checkin
□ Monitor logs 15 phút sau deploy
```
