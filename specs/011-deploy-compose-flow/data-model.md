# Data Model: Deploy Compose Flow

## Deployment Stack Entity

Toàn bộ môi trường ứng dụng chạy trên VPS thông qua Docker Compose.

### Components

| Component | Image/Build | Port | Volume | Restart Policy |
|---|---|---|---|---|
| `mongo` | `mongo:7` | `27017` (internal), `5635` (public TCP) | `mongo-data:/data/db` | `unless-stopped` |
| `backend` | `Dockerfile.backend` | `5634` (internal only) | (none) | `unless-stopped` |
| `frontend` | `Dockerfile.frontend` | `5734` (exposed) | (none) | `unless-stopped` |

### Relationships

- `mongo-bootstrap` **depends on** `mongo` and ensures root user from env exists / has synced password
- `backend` **depends on** `mongo-bootstrap` (via `service_completed_successfully`)
- `frontend` **depends on** `backend` (via nginx reverse proxy over internal Docker network)
- `mongo-data` **persists** all MongoDB data across restarts/redeploys
- `mongo` requires `MONGO_USERNAME` and `MONGO_PASSWORD` for authenticated access

---

## Service Runtime Configuration Entity

Tập hợp các biến môi trường cần thiết để các service khởi động đúng.

### Backend Variables

| Name | Required | Default | Source |
|---|---|---|---|
| `MONGODB_URI` | Auto | `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017/chatsc?authSource=admin` | docker-compose |
| `PORT` | Auto | `5634` | docker-compose |
| `SESSION_SECRET` | **YES** | — | Operator fills `.env` |
| `ACCESS_TOKEN_SECRET` | **YES** | — | Operator fills `.env` |
| `REFRESH_TOKEN_SECRET` | **YES** | — | Operator fills `.env` |
| `GOOGLE_CLIENT_ID` | **YES** | — | Operator fills `.env` |
| `GOOGLE_CLIENT_SECRET` | **YES** | — | Operator fills `.env` |
| `GOOGLE_CALLBACK_URL` | **YES** | `https://chatsc.fayedark.com/api/auth/google/callback` | Operator fills `.env` |
| `MONGO_USERNAME` | **YES** | — | Operator fills `.env` |
| `MONGO_PASSWORD` | **YES** | — | Operator fills `.env` |
| `REFRESH_COOKIE_NAME` | No | `refresh_token` | env.config.ts |
| `FRONTEND_APP_URL` | Auto | `https://chatsc.fayedark.com` | docker-compose |
| `API_PREFIX` | No | `api` | env.config.ts |
| `AUTH_LOCAL_ENABLED` | No | `false` | env.config.ts |
| `CHAT_REVERSE_ENCRYPTION_ENABLED` | No | `false` | env.config.ts |
| `PROCESSOR_REMOTE_HOST` | Conditional | — | Operator fills `.env` |
| `PROCESSOR_REMOTE_PORT` | No | `9191` | env.config.ts |
| `CHAT_REVERSE_ENCRYPTION_SHARED_KEY` | Conditional | — | Operator fills `.env` |

### Validation Rules

- `SESSION_SECRET` — phải có giá trị, không được rỗng hoặc placeholder
- `ACCESS_TOKEN_SECRET` — phải có giá trị, không được rỗng hoặc placeholder
- `REFRESH_TOKEN_SECRET` — phải có giá trị, không được rỗng hoặc placeholder
- Nếu `AUTH_LOCAL_ENABLED=true` hoặc `CHAT_REVERSE_ENCRYPTION_ENABLED=true`: `PROCESSOR_REMOTE_HOST` bắt buộc
- Nếu `CHAT_REVERSE_ENCRYPTION_ENABLED=true`: `CHAT_REVERSE_ENCRYPTION_SHARED_KEY` bắt buộc
- Backend sẽ throw `Error` khi validation fails → container exit → healthcheck fail → operator thấy rõ lỗi

### Frontend Variables (Build-time)

| Name | Required | Default | Source |
|---|---|---|---|
| `VITE_API_BASE_URL` | **YES** | `/api` | docker-compose ARG |

### Nginx Configuration

```nginx
server {
  listen 5734;
  root /usr/share/nginx/html;
  index index.html;

  location /api/ {
    proxy_pass http://backend:5634/api/;
  }

  location /chat {
    proxy_pass http://backend:5634/chat;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

---

## Persistent Application Data Entity

Chỉ MongoDB data cần persistence. Các service khác stateless.

| Volume Name | Mount Path | Contents | Survives |
|---|---|---|---|
| `mongo-data` | `/data/db` | MongoDB data files | `down` (data kept) |
| `mongo-data` | `/data/configdb` | MongoDB config | `down` (data kept) |
| `mongo-data` | — | — | `down -v` (DATA LOSS) |

---

## Operator Deployment Procedure Entity

### First-time Deploy Steps

1. Clone repository lên VPS
2. Copy `deploy/.env.example` → `deploy/.env`
3. Fill in required secrets trong `.env`
4. Chạy `docker compose -f deploy/docker-compose.yml up -d`
5. Kiểm tra: `docker compose -f deploy/docker-compose.yml ps`
6. Verify: `curl http://localhost:5634/api/health` và `curl http://localhost:5734`

### Redeploy Steps

1. `git pull` (hoặc checkout revision mới)
2. `docker compose -f deploy/docker-compose.yml up -d --build`
3. Verify: `docker compose -f deploy/docker-compose.yml ps`

### Restart After VPS Reboot

1. `docker compose -f deploy/docker-compose.yml up -d`
2. (Volumes tự động mount lại)

### Tear Down

1. `docker compose -f deploy/docker-compose.yml down` (keep data)
2. `docker compose -f deploy/docker-compose.yml down -v` (DELETE ALL DATA)
