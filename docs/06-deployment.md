# 06 — Deployment
## Smart Workforce Platform

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
