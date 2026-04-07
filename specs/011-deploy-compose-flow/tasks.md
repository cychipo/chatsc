# Tasks: Deploy Full Stack bằng Compose trên VPS

**Input**: Design documents from `/specs/011-deploy-compose-flow/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Không có — đây là feature deploy infrastructure, không thay đổi behavior ứng dụng.

**Organization**: Tasks được nhóm theo thứ tự thực thi để tạo stack từ đầu. Không có user story tasks vì đây là deployment-only feature không thay đổi application code.

## Format: `[ID] [P?] Description`

- **[P]**: Có thể chạy song song (file khác nhau, không phụ thuộc task chưa hoàn thành)
- Include exact file paths in descriptions

---

## Phase 1: Infrastructure Files

**Purpose**: Tạo toàn bộ deployment artifacts

- [X] T001 [P] Create `deploy/` directory at repository root
- [X] T002 [P] Create `deploy/.env.example` from research.md section 6
- [X] T003 [P] Create `deploy/Dockerfile.backend` — multi-stage build (node:22-alpine → node:22-slim), build context `..`, EXPOSE 5634, CMD `node backend/dist/src/main.js`
- [X] T004 [P] Create `deploy/Dockerfile.frontend` — multi-stage build (node:22-alpine → nginx:alpine), build context `..`, EXPOSE 5734, COPY dist from builder stage
- [X] T005 [P] Create `deploy/nginx.conf` — SPA fallback config, listen 5734, root `/usr/share/nginx/html`, `try_files $uri $uri/ /index.html`
- [X] T006 Create `deploy/docker-compose.yml` — mongo + backend + frontend services, named volume mongo-data, healthcheck cho mongo và backend, depends_on với service_healthy, restart: unless-stopped, ports 5634 và 5734 exposed

---

## Phase 2: Validation & Documentation

**Purpose**: Xác nhận hệ thống hoạt động theo spec

- [X] T007 Verify docker-compose.yml syntax: `docker compose -f deploy/docker-compose.yml config --quiet` — phải không có lỗi
- [X] T008 Verify no existing Dockerfiles collide: kiểm tra không có Dockerfile ở backend/ hoặc frontend/ root (build context phải từ deploy/)
- [X] T009 Verify quickstart.md commands match deploy artifacts: mỗi step trong quickstart.md có thể thực thi với artifact đã tạo
- [X] T010 Update plan.md summary: ghi nhận artifacts đã tạo và confirm đáp ứng FR-001 đến FR-012

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Infrastructure)**: No dependencies — có thể bắt đầu ngay
- **Phase 2 (Validation)**: Depends on Phase 1 completion — BLOCKS spec acceptance

### Parallel Opportunities

- T001 → T005: Tất cả chạy song song (file riêng biệt)
- T007 → T009: Tất cả chạy song song sau khi Phase 1 hoàn thành

---

## Implementation Strategy

### MVP First

1. Complete Phase 1: Tất cả deploy artifacts
2. **STOP and VALIDATE**: docker-compose config không lỗi
3. Complete Phase 2: Validation và documentation

### Task Distribution

```
T001-T005 (Phase 1): Có thể giao cho 1 developer, tạo song song
T006 (Phase 1): Viết cuối Phase 1 — depends on T003, T004, T005 để reference đúng paths
T007-T010 (Phase 2): Validation tasks — chạy sau khi artifacts tồn tại
```

---

## Artifact Summary

| Task | File | Description |
|---|---|---|
| T001 | `deploy/` | Directory tạo 1 lần |
| T002 | `deploy/.env.example` | Template 3 required secrets |
| T003 | `deploy/Dockerfile.backend` | Multi-stage NestJS build |
| T004 | `deploy/Dockerfile.frontend` | Multi-stage Vite SPA build |
| T005 | `deploy/nginx.conf` | SPA fallback config |
| T006 | `deploy/docker-compose.yml` | Full stack orchestration |

---

## Spec Requirement Mapping

| Requirement | Artifact | Task |
|---|---|---|
| FR-001 (full stack deploy) | docker-compose.yml | T006 |
| FR-002 (no manual assembly) | docker-compose.yml | T006 |
| FR-003 (port 5634) | docker-compose.yml + Dockerfile.backend | T003, T006 |
| FR-004 (port 5734) | docker-compose.yml + nginx.conf | T005, T006 |
| FR-005 (db in stack) | docker-compose.yml (mongo service) | T006 |
| FR-006 (backend→db connection) | docker-compose.yml MONGODB_URI | T006 |
| FR-007 (first deploy docs) | quickstart.md (existing) | Already written |
| FR-008 (redeploy docs) | quickstart.md (existing) | Already written |
| FR-009 (runtime settings) | .env.example | T002 |
| FR-010 (fail with actionable msg) | docker-compose.yml healthcheck | T006 |
| FR-011 (teardown/restart) | docker-compose.yml restart policy + quickstart.md | T006 |
| FR-012 (data persistence) | docker-compose.yml named volume | T006 |
