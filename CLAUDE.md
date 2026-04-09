# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

This repo currently contains two distinct chat systems:

1. **Web chat app** in `frontend/` + `backend/`
   - Frontend: React 18 + Vite + Ant Design + Zustand.
   - Backend: NestJS + Mongoose + Socket.IO.
   - This is the main application for current product features: auth, conversations, realtime chat, attachments, unread state, AI suggestions/chatbot/moderation.

2. **Linux kernel-module chat stack** in `app/`, `driver/`, `tests/`, root `Makefile`
   - C client/server binaries plus a kernel module exposing `/dev/device`.
   - Used for the lower-level socket chat and device-processing workflow described in the root `README.md`.

Do not assume these two systems share the same runtime. The TypeScript app is a separate stack from the C/kernel-module workflow.

## Common commands

### Workspace install
```bash
yarn install
```

### Web app development
From repo root:
```bash
yarn dev:backend
yarn dev:frontend
yarn build:backend
yarn build:frontend
yarn test:backend
yarn test:frontend
```

Direct workspace commands:
```bash
yarn workspace backend dev
yarn workspace backend build
yarn workspace backend test
yarn workspace frontend dev
yarn workspace frontend build
yarn workspace frontend test
```

### Run a single test
Backend uses Jest with `backend/test/jest-e2e.json`:
```bash
yarn workspace backend jest --config test/jest-e2e.json test/auth-login.e2e-spec.ts
yarn workspace backend jest --config test/jest-e2e.json test/ai/ai.service.spec.ts
```

Frontend uses Vitest:
```bash
yarn workspace frontend vitest run src/test/auth-login.test.tsx
yarn workspace frontend vitest run src/test/chat-ai-ui.test.tsx
```

### Linux kernel-module chat workflow
Build everything:
```bash
make all
```

Build pieces:
```bash
make app
make driver
```

Load/unload module:
```bash
sudo make load
sudo make unload
```

Run binaries:
```bash
make server
make client
```

Run C/kernel integration tests:
```bash
make test
```

Clean C/kernel artifacts:
```bash
make clean
```

Important: the kernel-module workflow expects a native Linux host with matching kernel headers at `/lib/modules/$(uname -r)/build`.

## Web app architecture

### Backend
- `backend/src/app.module.ts` wires the app into four top-level modules: `HealthModule`, `AuthModule`, `ChatModule`, and `AiModule`.
- `backend/src/main.ts` boots Nest, applies the global API prefix from env, enables credentialed CORS, and configures `express-session` + Passport session middleware.
- MongoDB is the system of record for the web app. Mongoose is configured globally through `backend/src/database/mongoose.config.ts`.

### Backend auth model
- `backend/src/modules/auth/` owns both local auth and session/token flows.
- The frontend authenticates with short-lived access tokens plus an HTTP-only refresh-token cookie.
- Passport session support is still enabled because Google/session-based auth is part of the backend module design.
- `AuthService` and `AuthProcessingService` are the main auth orchestration layer; guards in `guards/` split session auth from bearer-token auth.
- `backend/src/config/env.config.ts` is the authoritative place for backend feature flags and required env vars.

### Backend chat model
- `backend/src/modules/chat/` is the core domain module.
- Persistence is split across conversation, participant, message, membership-event, and attachment schemas.
- `chat.controller.ts` exposes the REST surface for conversation lists, history pagination, search, membership changes, unread state, and attachment upload/download flows.
- `chat.gateway.ts` is the realtime transport on Socket.IO namespace `/chat`.
  - Socket auth uses the current access token.
  - Users join per-user rooms and per-conversation rooms.
  - Message send/read/typing events are acknowledged and then broadcast back as preview/message/read updates.
- `ChatService` is the central business-logic layer; controllers and gateways delegate to it rather than duplicating rules.

### Backend AI integration
- `backend/src/modules/ai/` is a separate module but tightly integrated with chat.
- `AiModule` depends on `ChatModule` and exposes chatbot, suggestions, moderation, and config services.
- AI realtime traffic lives on a separate Socket.IO namespace: `/ai`.
- Gemini-related timeouts, model lists, API keys, and feature toggles are controlled from `backend/src/config/env.config.ts`.
- Chat message send flow can trigger moderation and bot replies asynchronously from `chat.gateway.ts`; suggestions are requested through `ai.gateway.ts`.

### Frontend
- `frontend/src/app/routes.tsx` keeps routing minimal: auth flow and the protected home/chat flow.
- `frontend/src/store/auth.store.ts` is the session source of truth. It hydrates the session, stores the access token in memory + localStorage, and registers refresh/failure hooks into the shared HTTP client.
- `frontend/src/services/http.ts` is the single Axios instance.
  - It attaches the bearer token.
  - On `401` with `access_token_expired`, it performs a shared refresh and retries the original request.
- `frontend/src/services/chat.service.ts` wraps the REST API.
- `frontend/src/services/chat-socket.service.ts` owns the `/chat` Socket.IO lifecycle, reconnection, room join/leave, ack handling, and listener fan-out.
- `frontend/src/services/ai.service.ts` owns the separate `/ai` socket connection for suggestions/moderation events.

### Frontend chat UI
- `frontend/src/features/chat/chat.page.tsx` is the orchestration-heavy screen for the entire chat experience.
  - It coordinates conversation list state, selected conversation, message history pagination, unread handling, realtime delivery, typing indicators, notifications, attachment upload/download, search, slash commands, and AI suggestions.
  - When modifying chat UX, inspect this file first before creating new abstractions elsewhere.
- `frontend/src/features/chat/components/` contains the presentational pieces used by the page: composer, message bubbles, list, image viewer, file card, AI suggestion UI.

## Linux kernel-module architecture

- Root `Makefile` orchestrates builds for `app/client`, `app/server`, and `driver/module` into `build/`.
- The driver exposes `/dev/device` and is responsible for SHA1 hashing and message transformation; there should be no silent fallback if the device is unavailable.
- The C server manages registration/login and routes messages between connected clients.
- The C client is an interactive terminal app that talks to both the server and `/dev/device`.
- End-to-end validation for this stack is in `tests/`, and `make test` chains smoke, lifecycle, connectivity, and demo-flow scripts.

## Environment notes

Backend defaults worth knowing:
- Default API prefix: `api`
- Default backend port: `3000`
- Default MongoDB URI: `mongodb://127.0.0.1:27017/chatsc`
- Frontend dev server port: `5173`
- Frontend API base URL and AI socket namespace are controlled by Vite env vars.

Some backend features are optional but env-gated:
- remote processor / reverse encryption
- Cloudflare R2 attachment storage
- Gemini AI chatbot / suggestions / moderation

Before enabling those flows in code, check `backend/src/config/env.config.ts` for the required variables and validation rules.

## Existing documentation worth checking

- `README.md` — root setup and quickstart for the kernel-module chat flow.
- `docs/demo-runbook.md` — demo sequence for the C/kernel path.
- `docs/troubleshooting.md` — operational issues for the C/kernel path.
- `app/client/README.md`, `app/server/README.md`, `driver/module/README.md` — subsystem-specific details.

## Working guidance for this repo

- For web-app changes, prefer tracing from service/store/gateway boundaries before editing UI.
- For chat feature work, check both REST and Socket.IO paths; many features update both persisted state and realtime fan-out.
- For auth-related bugs, inspect both cookie refresh flow and in-memory access-token flow; the frontend and backend each contain part of the session logic.
- For kernel-module tasks, do not assume macOS can execute the full workflow; the documented build/load/test path targets Linux.