# Research: Deploy Full Stack bằng Compose trên VPS

## 1. MongoDB Docker Image

**Decision**: `mongo:7` (official image, tag `7`)

**Rationale**:
- MongoDB 7 là phiên bản stable hiện tại (2026)
- Official image đảm bảo compatibility với Mongoose 8
- Tag `7` tự động nhận latest patch trong major 7
- Không cần `mongo-express` hay các tool bổ sung cho production deployment

**Alternatives considered**:
- `mongo:7.0` — pin patch version, cần chủ động update
- `mongo:8` — chưa stable enough cho production, Mongoose 8 vẫn hỗ trợ MongoDB 7
- `mongo-express` — không cần thiết, tăng attack surface

**Data persistence**: Named volume `mongo-data` mount vào `/data/db` và `/data/configdb`.
**Auth & public TCP access**: MongoDB khởi tạo bằng `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD`, public qua TCP port `5635:27017`, và được reconcile bởi `mongo-bootstrap` để đảm bảo root user từ env tồn tại cả trên volume cũ.

---

## 2. Backend Dockerfile — Multi-Stage Pattern

**Decision**: 2-stage build: `node:22-alpine` (build) → `node:22-alpine-slim` (runtime)

**Stage 1 — Build**:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

**Stage 2 — Production**:
```dockerfile
FROM node:22-alpine-slim
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
EXPOSE 5634
CMD ["node", "backend/dist/src/main.js"]
```

**Rationale**:
- Alpine base image tối giản kích thước (~50MB vs ~1GB cho full node)
- `npm ci` thay vì `npm install` — reproducible builds
- Không copy `src/` vào production image, chỉ `dist/`
- NestJS không cần TypeScript runtime vì đã compile sang JS

**Alternatives considered**:
- Single-stage `node:22-slim` — kích thước lớn hơn, không cần compiler layer
- `node:22-alpine` (single-stage) — đơn giản nhưng lớn hơn production image tối ưu

---

## 3. Frontend Dockerfile — Vite SPA Pattern

**Decision**: 2-stage build: `node:22-alpine` (build) → `nginx:alpine` (serve)

**Stage 1 — Build**:
```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=http://localhost:5634/api
RUN npm run build
```

**Stage 2 — Serve**:
```dockerfile
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 5734
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx config**: SPA fallback — tất cả routes return `index.html` (cho React Router).

**Rationale**:
- Nginx Alpine image rất nhẹ (~10MB)
- SPA fallback là best practice cho React Vite apps
- Build-time env var `VITE_API_URL` đặt URL backend

**Alternatives considered**:
- `node:22-alpine-slim` + `serve` — lớn hơn nginx alpine, ít optimized
- Vite preview server — không phù hợp cho production

---

## 4. Docker Compose Configuration

### Service Dependencies & Startup Order

```yaml
services:
  mongo:
    image: mongo:7
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s

  backend:
    build: ./deploy
    depends_on:
      mongo:
        condition: service_healthy
    environment:
      MONGODB_URI: mongodb://mongo:27017/chatsc
      PORT: 5634
      # ... other env vars from .env
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5634/api/health"]
      interval: 15s
      timeout: 5s
      retries: 3
      start_period: 30s

  frontend:
    build: ./deploy
    depends_on:
      - backend
    # No healthcheck needed — nginx serves static files
```

**Key decisions**:
- `depends_on` với `mongo-bootstrap: service_completed_successfully` — backend không start cho đến khi MongoDB sẵn sàng và root user từ env đã được create/update xong
- Healthcheck dùng `wget --spider` thay vì `curl` — có sẵn trong alpine image
- Named volume `mongo-data` — đảm bảo data tồn tại qua các lần restart/redeploy
- `restart: unless-stopped` — tự động restart khi VPS reboot

### Network

Default bridge network của Docker Compose đủ cho 3 container trên cùng 1 host. Không cần custom network config.

### Port Conflicts

docker-compose sẽ fail nếu port 5634 hoặc 5734 đã bị chiếm. `docker-compose up` sẽ báo lỗi rõ ràng: "Port is already allocated". Đây là hành vi mặc định và đáp ứng FR-010.

---

## 5. Environment Variables — Required Secrets

### Backend Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Auto | Set by docker-compose: `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017/chatsc?authSource=admin` |
| `PORT` | Auto | Fixed: `5634` |
| `SESSION_SECRET` | **YES** | Secret cho express-session |
| `ACCESS_TOKEN_SECRET` | **YES** | JWT access token signing key |
| `REFRESH_TOKEN_SECRET` | **YES** | JWT refresh token signing key |
| `GOOGLE_CLIENT_ID` | **YES** | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | **YES** | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | **YES** | Google OAuth callback URL |
| `REFRESH_COOKIE_NAME` | No | Default: `refresh_token` |
| `FRONTEND_APP_URL` | Auto | Set by docker-compose: `https://chatsc.fayedark.com` |
| `API_PREFIX` | No | Default: `api` |
| `AUTH_LOCAL_ENABLED` | No | Default: `false` |
| `CHAT_REVERSE_ENCRYPTION_ENABLED` | No | Default: `false` |
| `PROCESSOR_REMOTE_HOST` | Conditional | Required if reverse encryption enabled |
| `PROCESSOR_REMOTE_PORT` | No | Default: `9191` |
| `CHAT_REVERSE_ENCRYPTION_SHARED_KEY` | Conditional | Required if reverse encryption enabled |

### Frontend Environment Variables (build-time)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | **YES** | Production frontend API base path — set to `/api` so nginx can proxy to backend container |

---

## 6. .env Example Structure

```bash
# ======================
# Required (operator must fill before deploy)
# ======================

# Backend secrets
SESSION_SECRET=replace-with-a-long-random-string
ACCESS_TOKEN_SECRET=replace-with-a-long-random-string
REFRESH_TOKEN_SECRET=replace-with-a-long-random-string
GOOGLE_CLIENT_ID=replace-with-google-client-id
GOOGLE_CLIENT_SECRET=replace-with-google-client-secret
GOOGLE_CALLBACK_URL=https://chatsc.fayedark.com/api/auth/google/callback
MONGO_USERNAME=replace-with-mongo-username
MONGO_PASSWORD=replace-with-mongo-password

# ======================
# Optional (defaults work for basic deploy)
# ======================

# AUTH_LOCAL_ENABLED=true
# Uncomment if you need local username/password login:
# PROCESSOR_REMOTE_HOST=your-processor-host
# PROCESSOR_REMOTE_PORT=9191
# CHAT_REVERSE_ENCRYPTION_ENABLED=true
# CHAT_REVERSE_ENCRYPTION_SHARED_KEY=your-shared-key
```

---

## 7. Build Context Strategy

Dockerfiles đặt trong `deploy/` directory, sử dụng build context ngược ra ngoài:

```
deploy/
├── docker-compose.yml   # context: .
├── Dockerfile.backend   # context: ../backend
├── Dockerfile.frontend  # context: ../frontend
└── nginx.conf           # context: deploy
```

```yaml
# docker-compose.yml
services:
  backend:
    build:
      context: ..
      dockerfile: deploy/Dockerfile.backend
  frontend:
    build:
      context: ..
      dockerfile: deploy/Dockerfile.frontend
```

**Rationale**: Giữ Dockerfiles gần nhau trong `deploy/` thay vì rải trong backend/frontend. Không cần copy source vào repo mới.

---

## 8. Reverse Proxy Strategy

- Frontend browser requests go to same-origin `/api/*`
- `nginx` in `deploy/nginx.conf` proxies `/api/` → `http://backend:5634/api/`
- `nginx` proxies websocket `/chat` → `http://backend:5634/chat`
- `mongo-bootstrap` runs as one-shot reconcile step before backend starts
- Backend container stays internal-only; MongoDB remains publicly reachable on TCP `5635`

---

## 9. Restart & Recovery

- **`restart: unless-stopped`** trên tất cả services — tự động lên khi VPS reboot
- **`docker-compose down`** — hạ toàn bộ stack
- **`docker-compose up -d`** — đưa stack lên lại
- **`docker-compose up -d --build`** — rebuild + restart (cho redeploy)
- Data tồn tại trong named volume `mongo-data` — không bị mất khi down/up thông thường
- **`docker-compose down -v`** — xoá volumes (chủ động xoá data)

---

## 10. VPS Prerequisites (Documented in quickstart.md)

1. Docker Engine 24.0+
2. Docker Compose Plugin v2.20+
3. Git (để clone repository)
4. Cổng 5634 và 5734 phải available trên VPS
