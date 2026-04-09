# chatsc

Hệ thống này hiện gồm **2 phần tách biệt trong cùng một repository**:

1. **Ứng dụng chat web**
   - Frontend: React + Vite + Ant Design + Zustand
   - Backend: NestJS + MongoDB + Mongoose + Socket.IO
   - Hỗ trợ: đăng nhập, refresh token, chat realtime, nhóm chat, tìm kiếm tin nhắn, upload file, unread state, AI suggestions/chatbot/moderation

2. **Hệ thống chat mức thấp dùng Linux kernel module**
   - Client/server viết bằng C
   - Driver kernel cung cấp `/dev/device`
   - Dùng cho flow xử lý mã hóa/hash qua device driver

README này mô tả đúng cả hai phần để tránh nhầm lẫn khi làm việc trong repo.

---

## 1) Kiến trúc tổng quan

### Ứng dụng chat web

- `frontend/`: giao diện web
- `backend/`: API + realtime server
- `package.json` ở root: quản lý Yarn workspace cho frontend/backend

Luồng chính:
- frontend gọi REST API qua Axios
- frontend kết nối Socket.IO namespace `/chat` cho chat realtime
- frontend kết nối Socket.IO namespace `/ai` cho AI suggestions / moderation events
- backend lưu dữ liệu trong MongoDB
- auth dùng **access token** phía client + **refresh token cookie HTTP-only**

Các module backend chính:
- `AuthModule`: local auth, session/token, profile
- `ChatModule`: conversation, participant, message, membership events, attachments, unread state, websocket chat
- `AiModule`: chatbot, suggestions, moderation
- `HealthModule`: health check

### Hệ thống chat C + kernel module

- `app/client/`: client terminal
- `app/server/`: server socket
- `driver/module/`: Linux kernel module
- `tests/`: smoke test, lifecycle test, connectivity test, demo-flow test
- `Makefile` ở root: build/test/load/unload cho toàn bộ stack này

Luồng chính:
- client/server trao đổi qua socket TCP
- password hashing và message transform đi qua `/dev/device`
- kernel module chịu trách nhiệm xử lý SHA1 và biến đổi message

---

## 2) Yêu cầu môi trường

### Cho ứng dụng web

- Node.js LTS
- Yarn 1.x
- MongoDB đang chạy local hoặc có URI truy cập được

### Cho hệ thống kernel module

- Linux host thật hoặc VM Linux
- `build-essential`, `gcc`, `make`, `kmod`, `lsof`
- kernel headers khớp với kernel đang chạy tại:

```bash
/lib/modules/$(uname -r)/build
```

Lưu ý: phần kernel module **không phù hợp để chạy đầy đủ trên macOS**. Muốn build/load/test đúng flow thì nên dùng Linux.

---

## 3) Cài dependencies cho ứng dụng web

Tại root repo:

```bash
yarn install
```

---

## 4) Chạy ứng dụng chat web

### Chạy backend

```bash
yarn dev:backend
```

Hoặc:

```bash
yarn workspace backend dev
```

Backend mặc định:
- port: `3000`
- API prefix: `api`
- MongoDB URI mặc định: `mongodb://127.0.0.1:27017/chatsc`

### Chạy frontend

```bash
yarn dev:frontend
```

Hoặc:

```bash
yarn workspace frontend dev
```

Frontend dev server mặc định chạy ở:

```bash
http://localhost:5173
```

### Build ứng dụng web

```bash
yarn build:backend
yarn build:frontend
```

Hoặc:

```bash
yarn workspace backend build
yarn workspace frontend build
```

### Chạy test ứng dụng web

```bash
yarn test:backend
yarn test:frontend
```

Hoặc:

```bash
yarn workspace backend test
yarn workspace frontend test
```

### Chạy một test cụ thể

#### Backend (Jest)

```bash
yarn workspace backend jest --config test/jest-e2e.json test/auth-login.e2e-spec.ts
```

Ví dụ test AI service:

```bash
yarn workspace backend jest --config test/jest-e2e.json test/ai/ai.service.spec.ts
```

#### Frontend (Vitest)

```bash
yarn workspace frontend vitest run src/test/auth-login.test.tsx
```

Ví dụ test UI AI:

```bash
yarn workspace frontend vitest run src/test/chat-ai-ui.test.tsx
```

---

## 5) Các biến môi trường quan trọng của backend

Backend đọc env trong `backend/src/config/env.config.ts`.

Một số giá trị mặc định quan trọng:
- `PORT=3000`
- `API_PREFIX=api`
- `MONGODB_URI=mongodb://127.0.0.1:27017/chatsc`
- `ACCESS_TOKEN_TTL_SECONDS=1800`
- `REFRESH_TOKEN_TTL_SECONDS=604800`
- `REFRESH_COOKIE_NAME=refresh_token`

### Nhóm env cho remote processor / reverse encryption
Chỉ bắt buộc khi bật feature tương ứng:
- `PROCESSOR_REMOTE_HOST`
- `PROCESSOR_REMOTE_PORT`
- `PROCESSOR_REMOTE_TIMEOUT_MS`
- `CHAT_REVERSE_ENCRYPTION_ENABLED`
- `CHAT_REVERSE_ENCRYPTION_SHARED_KEY`

### Nhóm env cho file attachment (R2 / S3-compatible)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_PUBLIC_URL`

### Nhóm env cho Gemini AI
- `GEMINI_API_KEYS`
- `GEMINI_MODELS`
- `GEMINI_REQUEST_TIMEOUT_MS`
- `GEMINI_MODERATION_TIMEOUT_MS`
- `GEMINI_SUGGESTION_TIMEOUT_MS`
- `GEMINI_MAX_CONTEXT_MESSAGES`
- `AI_CHATBOT_ENABLED`
- `AI_SUGGESTIONS_ENABLED`
- `AI_MODERATION_ENABLED`

---

## 6) Cách hoạt động của ứng dụng chat web

### Backend

- `backend/src/main.ts`
  - khởi tạo NestJS
  - bật CORS có credentials
  - gắn `express-session` + Passport
  - áp dụng global API prefix

- `backend/src/app.module.ts`
  - đăng ký `ConfigModule`
  - kết nối MongoDB qua Mongoose
  - load `HealthModule`, `AuthModule`, `ChatModule`, `AiModule`

### Auth

- frontend giữ access token trong memory + localStorage
- refresh token nằm trong cookie HTTP-only
- Axios interceptor tự refresh khi gặp `401` với mã `access_token_expired`
- backend vẫn dùng Passport session middleware vì kiến trúc auth có cả session-based flow

### Chat realtime

- namespace Socket.IO chính: `/chat`
- client gửi access token khi connect websocket
- backend join user vào user-room và conversation-room
- các event chính:
  - join conversation
  - leave conversation
  - send message
  - mark read
  - typing presence
- backend phát lại:
  - `message_delivered`
  - `conversation_preview_updated`
  - `conversation_read_updated`
  - `typing_presence_updated`
  - `connection_status_changed`
  - `ai:moderation:result`

### AI

- namespace AI riêng: `/ai`
- hỗ trợ:
  - chatbot trả lời trong conversation
  - smart reply suggestions
  - moderation kết quả cho tin nhắn
- AI được cấu hình/tắt mở bằng env flag backend

### Frontend

Các điểm quan trọng:
- `frontend/src/store/auth.store.ts`: nguồn sự thật cho session phía client
- `frontend/src/services/http.ts`: Axios instance chung + refresh flow
- `frontend/src/services/chat.service.ts`: wrapper REST API
- `frontend/src/services/chat-socket.service.ts`: quản lý socket `/chat`
- `frontend/src/services/ai.service.ts`: quản lý socket `/ai`
- `frontend/src/features/chat/chat.page.tsx`: màn hình điều phối chính của toàn bộ chat UI

`chat.page.tsx` hiện đang gánh nhiều logic như:
- chọn conversation
- tải history và phân trang
- unread state
- typing indicator
- browser notification
- upload/download attachment
- image viewer
- search messages
- slash command `/ai`
- AI suggestions cache

Khi sửa hành vi chat UI, nên đọc file này trước.

---

## 7) Chạy hệ thống chat C + kernel module

### Build toàn bộ

```bash
make all
```

### Build riêng app client/server

```bash
make app
```

### Build driver

```bash
make driver
```

### Load kernel module

```bash
sudo make load
```

### Verify

```bash
lsmod | grep chat_driver
dmesg | tail
ls -l /dev/device
```

### Chạy server

```bash
make server
```

Hoặc:

```bash
./build/server 9090 users.db
```

### Chạy client

Mở 2 terminal riêng:

```bash
make client
```

Hoặc:

```bash
./build/client 127.0.0.1 9090 /dev/device
```

### Flow demo

1. chạy server trước
2. mở 2 client ở 2 terminal khác nhau
3. chọn `register` nếu chưa có tài khoản
4. chọn `login`
5. nhập username người muốn chat tại `chat with username>`
6. nhắn tin qua lại
7. thử `/switch` để đổi peer
8. thử `/quit` để thoát

Kỳ vọng:
- client chỉ thấy plaintext
- server log cả `from/to/plaintext/encrypted`
- hashing và message transform đi qua `/dev/device`

### Unload module

```bash
sudo make unload
```

---

## 8) Chạy test cho hệ thống kernel module

```bash
make test
```

Lệnh này chạy chuỗi test:
- smoke setup
- module build
- module lifecycle
- socket connectivity
- demo flow e2e

### Dọn artifact

```bash
make clean
```

---

## 9) Tài liệu liên quan

- `CLAUDE.md`: hướng dẫn cho Claude Code khi làm việc với repo này
- `docs/demo-runbook.md`: runbook demo cho flow C/kernel
- `docs/troubleshooting.md`: lỗi thường gặp cho stack C/kernel
- `app/client/README.md`: chi tiết flow client terminal
- `app/server/README.md`: chi tiết startup flow server C
- `driver/module/README.md`: chi tiết build/load/unload driver

---

## 10) Ghi chú quan trọng khi phát triển

- Đừng nhầm giữa **web app** và **kernel-module chat stack**: đây là 2 hệ thống khác nhau cùng nằm trong một repo.
- Với tính năng chat web, thường phải kiểm tra cả **REST path** và **Socket.IO path** vì nhiều thay đổi ảnh hưởng cả persisted state lẫn realtime fan-out.
- Với bug auth, cần kiểm tra đồng thời:
  - refresh token cookie flow ở backend
  - access token / refresh logic ở frontend
- Với flow attachment hoặc AI, hãy kiểm tra env backend trước vì nhiều tính năng phụ thuộc cấu hình ngoài.
- Với phần kernel module, nếu `/dev/device` không có hoặc module chưa load, client-side processing phải fail thay vì fallback im lặng.