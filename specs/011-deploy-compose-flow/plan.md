# Implementation Plan: Deploy Full Stack bằng Compose trên VPS

**Branch**: `011-deploy-compose-flow` | **Date**: 2026-04-07 | **Spec**: [link](../spec.md)

## Summary

Triển khai một deployment stack dựa trên Docker Compose để chạy toàn bộ ứng dụng (frontend React, backend NestJS, database MongoDB) trên một VPS đơn lẻ. Backend chạy trên port 5634, frontend trên 5734, MongoDB chạy trong Docker với persistent volumes. Đã tạo `deploy/Dockerfile.backend`, `deploy/Dockerfile.frontend`, `deploy/nginx.conf`, `deploy/.env.example`, `deploy/docker-compose.yml`, và `.dockerignore` để hỗ trợ deploy từ repository hiện tại bằng Yarn workspace.

## Technical Context

**Language/Version**: TypeScript 5.x (frontend + backend)  
**Primary Dependencies**: NestJS 10, Mongoose 8, React 18, Vite 6, MongoDB (trong Docker)  
**Storage**: MongoDB 7+ trong Docker container (persisted volume)  
**Testing**: Không thay đổi — feature deploy không thêm test mới  
**Target Platform**: Linux VPS (Docker runtime)  
**Project Type**: Docker Compose deployment (infra/cfg, không phải library/service)  
**Performance Goals**: Không áp dụng  
**Constraints**: Backend port 5634, frontend port 5734, single-node VPS, no TLS/DNS/reverse-proxy  
**Scale/Scope**: 1 backend + 1 frontend + 1 MongoDB container

### Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                   VPS                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐ │
│  │  mongo   │  │  backend │  │   frontend   │ │
│  │  :27017  │  │  :5634   │  │    :5734     │ │
│  └────┬─────┘  └────┬─────┘  └──────┬───────┘ │
│       │              │                │         │
│       └──────────────┼────────────────┘         │
│                      │                          │
│              internal network                    │
└─────────────────────────────────────────────────┘
  BE Port 5634 ◄───── FE Port 5734 (browser)
```

## Constitution Check

*GATE: Constitution file `.specify/memory/constitution.md` is empty — no gates apply.*

**Complexity Tracking**: Không có violations cần justify.

## Project Structure

### Documentation (this feature)

```text
specs/011-deploy-compose-flow/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output (deploy procedure)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root — artifacts created)

```text
deploy/
├── .env.example         # Template for required environment variables
├── Dockerfile.backend   # Multi-stage build for NestJS backend
├── Dockerfile.frontend # Multi-stage build for React/Vite frontend
└── docker-compose.yml  # Full stack: mongo + backend + frontend

backend/ (existing, no changes)
frontend/ (existing, minimal changes — only if needed for Dockerfile)
```

**Structure Decision**: Tạo thư mục `deploy/` chứa toàn bộ artifact cần thiết cho deployment. Dockerfiles đặt trong `deploy/` sử dụng build context ngược ra ngoài (`../backend`, `../frontend`) để không cần copy vào repo gốc.

## Phase 0: Research

### Unknowns to Resolve

1. **MongoDB Docker image version**: Chọn tag phù hợp (official MongoDB image vs. community recommendation cho production-lite trên VPS)
2. **Backend Dockerfile pattern**: Multi-stage build tối ưu cho NestJS — build stage (node:22-alpine) + production stage (node:22-alpine-slim)
3. **Frontend Dockerfile pattern**: Multi-stage build cho Vite SPA — build stage (node:22-alpine) + serve stage (nginx:alpine)
4. **Health check & restart policy**: Docker Compose healthcheck cho backend và mongo; restart policy đảm bảo startup order
5. **Data persistence**: Named volume cho MongoDB data, bind mount cho logs (optional)
6. **Secrets handling**: .env.example cần liệt kê đầy đủ các biến môi trường bắt buộc, với validation rõ ràng

### Research Findings

Xem `research.md` cho chi tiết đầy đủ.

## Phase 1: Design & Contracts

### Data Model (Deployment Entities)

Xem `data-model.md`.

### Interface Contracts

Đây là hệ thống deployment chứ không phải thư viện/service — không có external interface contract cần định nghĩa. Contracts duy nhất là:
- **Runtime environment**: Các biến môi trường bắt buộc (xem `data-model.md`)
- **Network**: Backend port 5634, frontend port 5734, MongoDB internal port 27017

### Quickstart

Xem `quickstart.md` — tài liệu deploy cho operator.

## Phase 2: Tasks

Tạo bằng `/speckit.tasks` sau khi plan này được approve.

## Generated Artifacts

| Artifact | Path | Phase |
|---|---|---|
| Research | `specs/011-deploy-compose-flow/research.md` | Phase 0 |
| Data Model | `specs/011-deploy-compose-flow/data-model.md` | Phase 1 |
| Quickstart | `specs/011-deploy-compose-flow/quickstart.md` | Phase 1 |
| Plan | `specs/011-deploy-compose-flow/plan.md` | (this file) |
| Deploy env template | `deploy/.env.example` | Implementation |
| Backend Dockerfile | `deploy/Dockerfile.backend` | Implementation |
| Frontend Dockerfile | `deploy/Dockerfile.frontend` | Implementation |
| Nginx config | `deploy/nginx.conf` | Implementation |
| Docker Compose | `deploy/docker-compose.yml` | Implementation |
| Docker ignore | `.dockerignore` | Implementation |
