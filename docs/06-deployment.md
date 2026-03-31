# 06 — Deployment
## Smart Workforce Platform

## Role

**Persona**: DevOps & Release Engineer
**Primary Focus**: Docker image definitions, CI/CD pipeline configuration, environment variable completeness, safe production migrations, and release gate checklists.
**Perspective**: You are responsible for the gap between "works on my machine" and "running in production." Every file in the docs set has deployment consequences: new env vars, new migrations, new test dependencies. When working in this file, scan the other docs files for any changes since the last release and verify deployment implications have been addressed here.

### Responsibilities
- Maintain Dockerfile definitions for backend (multi-stage) and frontend (nginx)
- Own docker-compose setup for both development and production
- Define and maintain the GitHub Actions CI pipeline (test jobs, E2E job, deploy job)
- Maintain the production ENV variable checklist (must be complete and exhaustive)
- Define safe migration deployment procedure and rollback plan
- Define release checklist (every item must be verifiable, not aspirational)
- Own the health check endpoint contract

### Cross-Role Awareness
| When you do this... | Reference this file | Because... |
|---------------------|---------------------|------------|
| Update ENV checklist | `docs/02-project-init.md` §3 | `.env.example` is the source of truth for which vars exist |
| Add a build step to Dockerfile | `docs/02-project-init.md` §6 | Package manager and lock file location determine the correct `npm ci` path |
| Configure CI migration step | `docs/02-project-init.md` §9 | Migration file order and DB connection pattern are defined there |
| Configure CI to run tests | `docs/05-testing.md` | Test commands, seed strategy, and required env vars are defined there |
| Add health check configuration | `docs/03-backend.md` | The `/api/health` endpoint must exist as a real route in the backend |
| Update release checklist | all docs files | Every layer (schema, API, frontend, tests) contributes its own release gate items |
| Configure WebSocket proxy in nginx | `docs/01-system-design.md` §5 | Socket.io event paths and upgrade requirements are derived from the event map |

### Files to Consult First
- `docs/02-project-init.md` — for env vars, dependency versions, migration ordering
- `docs/05-testing.md` — for CI test commands, seed strategy, test account credentials
- `docs/03-backend.md` — confirm the health check endpoint spec has been implemented

---

## 1. Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| **Development** | Local dev, hot-reload | `localhost:5173` (FE), `localhost:3001` (BE) |
| **Staging** | Pre-release testing, mirrors production | `staging.smart-workforce.com` |
| **Production** | Live app | `smart-workforce.com` |

---

## 2. Docker Setup

### `docker-compose.yml` (Development)
```yaml
version: '3.9'

services:
  mysql:
    image: mysql:8.0
    container_name: sw_mysql
    environment:
      MYSQL_DATABASE: smart_workforce
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_USER: sw_user
      MYSQL_PASSWORD: sw_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-prootpassword"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 30s  # MySQL 8 starts slower than PostgreSQL, this time is needed

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    container_name: sw_backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - DB_HOST=mysql        # service name in compose
      - DB_PORT=3306
      - DB_NAME=smart_workforce
      - DB_USER=sw_user
      - DB_PASSWORD=sw_password
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      mysql:
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
  mysql_data:
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
      mysql:
        image: mysql:8.0
        env:
          MYSQL_DATABASE: smart_workforce_test
          MYSQL_ROOT_PASSWORD: rootpassword
          MYSQL_USER: sw_user
          MYSQL_PASSWORD: sw_password
        options: >-
          --health-cmd="mysqladmin ping -h localhost -u root -prootpassword"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=10

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
          DB_HOST: 127.0.0.1   # use 127.0.0.1 instead of localhost in CI — MySQL on Linux uses Unix socket for "localhost"
          DB_PORT: 3306
          DB_NAME: smart_workforce_test
          DB_USER: sw_user
          DB_PASSWORD: sw_password

      - name: Run backend tests
        run: cd backend && npm test
        env:
          NODE_ENV: test
          DB_HOST: 127.0.0.1
          DB_PORT: 3306
          DB_NAME: smart_workforce_test
          DB_USER: sw_user
          DB_PASSWORD: sw_password
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

      # Add deployment steps to server (SSH, Railway, Render, etc.)
      - name: Deploy
        run: echo "Add deployment steps here"
```

---

## 4. ENV Variables Checklist

### Backend Production
```
✅ PORT                  — server port (default 3001)
✅ NODE_ENV              — "production"
✅ DB_HOST               — MySQL host
✅ DB_PORT               — MySQL port (default 3306)
✅ DB_NAME               — database name
✅ DB_USER               — MySQL user
✅ DB_PASSWORD           — DB password (use secrets manager)
✅ JWT_SECRET            — random string ≥ 32 characters
✅ JWT_EXPIRES_IN        — "7d"
✅ CORS_ORIGIN           — production frontend URL
✅ CRON_PAYROLL_SCHEDULE — cron expression
✅ CRON_REMINDER_SCHEDULE— cron expression
```

### Frontend Production
```
✅ VITE_API_URL          — production backend API URL
✅ VITE_SOCKET_URL       — production Socket.io URL
```

---

## 5. Database Migration Strategy

### Development
```bash
npm run migrate          # run all new migrations
npm run migrate:down     # rollback 1 migration
```

### Production
- Migrations run **before** deploying the new app version
- Always run migrations in timestamp order
- Never edit a migration that has already run — create a new migration to change the schema
- Back up the DB before every production migration

### Rollback Plan
```bash
# If migration fails:
npm run migrate:down     # rollback the migration that just ran
# Redeploy the old app version
# Investigate the error → fix the migration → redeploy
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

Used for:
- Docker healthcheck
- Load balancer health probe
- Monitoring (Uptime Robot, Better Stack)

---

## 7. Deployment Checklist (per release)

```
□ All tests pass in CI
□ E2E tests pass
□ Back up production database
□ Run migrations on production DB
□ Deploy new backend image
□ Verify /api/health returns 200
□ Deploy new frontend image
□ Smoke test: login, create shift, check in
□ Monitor logs for 15 minutes after deploy
```
