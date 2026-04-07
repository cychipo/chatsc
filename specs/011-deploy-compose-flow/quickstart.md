# Deploy Quickstart: Full Stack bằng Docker Compose trên VPS

## Mục lục

1. [Prerequisites](#prerequisites)
2. [First-time Deploy](#first-time-deploy)
3. [Redeploy (Update Code)](#redeploy-update-code)
4. [Restart Sau Reboot](#restart-sau-reboot)
5. [Teardown](#teardown)
6. [Troubleshooting](#troubleshooting)
7. [Runtime Settings](#runtime-settings)

---

## Prerequisites

VPS đích cần:

```bash
# 1. Docker Engine 24.0+
docker --version
# Docker version 24.0.x or higher

# 2. Docker Compose Plugin v2.20+
docker compose version
# Docker Compose version v2.20.x or higher

# 3. Git
git --version

# 4. Ports 5635 và 5734 available
# Kiểm tra: không có process nào đang listen trên 2 port này
ss -tlnp | grep -E '5635|5734'
```

### Cài đặt Docker (nếu chưa có)

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Docker Compose Plugin
sudo apt-get install docker-compose-plugin
```

---

## First-time Deploy

### Bước 1: Clone Repository

```bash
git clone <repository-url>
cd <repository-name>
```

### Bước 2: Tạo .env từ template

```bash
cp deploy/.env.example deploy/.env
```

### Bước 3: Fill in Required Secrets

Mở `deploy/.env` và điền các giá trị bắt buộc:

```bash
# Required — THAY BẰNG GIÁ TRỊ THỰC
SESSION_SECRET=your-long-random-session-secret-here
ACCESS_TOKEN_SECRET=your-long-random-access-token-secret-here
REFRESH_TOKEN_SECRET=your-long-random-refresh-token-secret-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://chatsc.fayedark.com/api/auth/google/callback
MONGO_USERNAME=your-mongo-username
MONGO_PASSWORD=your-mongo-password
```

**Cách tạo secret ngẫu nhiên:**
```bash
openssl rand -hex 32
```

### Bước 4: Khởi chạy Stack

```bash
docker compose -f deploy/docker-compose.yml up -d
```

Docker sẽ:
1. Build backend Docker image (lần đầu, ~2-5 phút)
2. Build frontend Docker image (lần đầu, ~1-3 phút)
3. Pull MongoDB image
4. Start MongoDB, chờ healthcheck pass
5. Run `mongo-bootstrap` để create/update root user theo env nếu cần
6. Start Backend, chờ healthcheck pass
7. Start Frontend

### Bước 5: Kiểm tra Trạng thái

```bash
docker compose -f deploy/docker-compose.yml ps
```

Expected output:
```
NAME       IMAGE       COMMAND                  SERVICE   CREATED   STATUS                    PORTS
mongo      mongo:7     "docker-entrypoint.s…"   mongo     ...       Up (healthy)              0.0.0.0:5635->27017/tcp
backend    deploy-b…   "node backend/dist/src/main.js" backend ...       Up (healthy)              
frontend   deploy-f…   "/docker-entrypoint.…"   frontend  ...       Up                         0.0.0.0:5734->5734/tcp
```

### Bước 6: Verify Services

```bash
# Frontend
curl http://localhost:5734

# Backend healthcheck qua nginx proxy
curl http://localhost:5734/api/health

# MongoDB TCP port public
mongosh "mongodb://<MONGO_USERNAME>:<MONGO_PASSWORD>@localhost:5635/chatsc?authSource=admin"
```

---

## Redeploy (Update Code)

Khi có code mới từ repository:

```bash
# 1. Pull latest code
git pull

# 2. Rebuild và restart với code mới
docker compose -f deploy/docker-compose.yml up -d --build

# 3. Kiểm tra
docker compose -f deploy/docker-compose.yml ps
```

**Lưu ý:**
- `--build` đảm bảo images được rebuild với code mới
- Named volume `mongo-data` giữ nguyên — database data không bị mất
- Các service restart tự động với `unless-stopped` policy

---

## Restart Sau Reboot

Docker daemon tự động khởi động containers với `restart: unless-stopped` policy.

Nếu cần khởi động thủ công:

```bash
docker compose -f deploy/docker-compose.yml up -d
```

---

## Teardown

### Chỉ tắt services, **GIỮ DATA**:

```bash
docker compose -f deploy/docker-compose.yml down
```

### Tắt services và **XOÁ DATA** (irreversible):

```bash
docker compose -f deploy/docker-compose.yml down -v
```

---

## Troubleshooting

### Container không start, logs:

```bash
# Xem logs của một service cụ thể
docker compose -f deploy/docker-compose.yml logs backend
docker compose -f deploy/docker-compose.yml logs mongo

# Xem tất cả logs
docker compose -f deploy/docker-compose.yml logs
```

### Port đã bị chiếm:

```bash
# Tìm process chiếm port
ss -tlnp | grep 5635
ss -tlnp | grep 5734

# Kill process hoặc thay đổi port trong docker-compose.yml
```

### Backend healthcheck fails:

```bash
# Kiểm tra MongoDB có healthy không
docker compose -f deploy/docker-compose.yml exec mongo mongosh "mongodb://$MONGO_USERNAME:$MONGO_PASSWORD@localhost:27017/admin?authSource=admin" --eval "db.adminCommand('ping')"

# Kiểm tra backend logs
docker compose -f deploy/docker-compose.yml logs backend

# Thường do thiếu env var bắt buộc — kiểm tra .env đã fill đủ chưa
```

### Database connection errors:

Backend sẽ không start nếu `mongo-bootstrap` chưa reconcile xong root user hoặc MongoDB chưa healthy.

```bash
# Kiểm tra bootstrap logs
docker compose -f deploy/docker-compose.yml logs mongo-bootstrap

# Kiểm tra mongo auth trực tiếp
docker compose -f deploy/docker-compose.yml exec mongo mongosh "mongodb://$MONGO_USERNAME:$MONGO_PASSWORD@localhost:27017/admin?authSource=admin" --eval "db.adminCommand('ping')"

# Chạy lại bootstrap nếu cần
docker compose -f deploy/docker-compose.yml up mongo-bootstrap
```

### Xem resource usage:

```bash
docker compose -f deploy/docker-compose.yml top
```

---

## Runtime Settings

### .env Variables

| Variable | Required | Mô tả |
|---|---|---|
| `SESSION_SECRET` | **YES** | Secret cho express-session — dùng `openssl rand -hex 32` |
| `ACCESS_TOKEN_SECRET` | **YES** | JWT access token signing key |
| `REFRESH_TOKEN_SECRET` | **YES** | JWT refresh token signing key |
| `GOOGLE_CLIENT_ID` | **YES** | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | **YES** | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | **YES** | Callback URL cho Google OAuth |
| `MONGO_USERNAME` | **YES** | MongoDB root username |
| `MONGO_PASSWORD` | **YES** | MongoDB root password |
| `REFRESH_COOKIE_NAME` | No | Default: `refresh_token` |
| `API_PREFIX` | No | Default: `api` |
| `AUTH_LOCAL_ENABLED` | No | Default: `false` |
| `CHAT_REVERSE_ENCRYPTION_ENABLED` | No | Default: `false` |
| `PROCESSOR_REMOTE_HOST` | Conditional* | Required nếu reverse encryption enabled |
| `PROCESSOR_REMOTE_PORT` | No | Default: `9191` |
| `CHAT_REVERSE_ENCRYPTION_SHARED_KEY` | Conditional* | Required nếu reverse encryption enabled |

*Conditional: Bắt buộc khi `AUTH_LOCAL_ENABLED=true` hoặc `CHAT_REVERSE_ENCRYPTION_ENABLED=true`

### Auto-set by docker-compose (không cần fill)

| Variable | Value |
|---|---|
| `MONGODB_URI` | `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@mongo:27017/chatsc?authSource=admin` |
| `PORT` | `5634` |
| `FRONTEND_APP_URL` | `https://chatsc.fayedark.com` |

### Frontend Build-time

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `/api` (default production path via nginx proxy) |

---

## Port Summary

| Service | Internal Port | Host Port | Protocol |
|---|---|---|---|
| MongoDB | 27017 | **5635** | TCP |
| Mongo bootstrap | n/a | (none) | one-shot internal job |
| Backend | 5634 | (none — internal only) | HTTP |
| Frontend | 5734 | **5734** | HTTP |

Truy cập từ browser: `https://chatsc.fayedark.com` hoặc `http://<vps-ip>:5734`
Backend API từ browser: same-origin `/api`
MongoDB TCP: `<vps-ip>:5635`
