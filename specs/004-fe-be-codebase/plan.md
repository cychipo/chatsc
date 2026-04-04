# Implementation Plan: Nền tảng codebase FE + BE

**Branch**: `main` (current workspace; target feature is `004-fe-be-codebase`) | **Date**: 2026-04-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-fe-be-codebase/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Thiết lập một nền tảng monorepo web với hai ứng dụng top-level `backend/` và `frontend/`, trong đó backend dùng NestJS + MongoDB + Mongoose còn frontend dùng React + Vite + Ant Design + Zustand + Axios 1.12 + Lucide. Kế hoạch ưu tiên khóa chặt cấu trúc dự án, convention môi trường và lớp giao tiếp FE→BE ngay từ đầu để các tính năng auth và chat có thể được thêm sau này mà không cần tái cấu trúc lớn.

## Technical Context

**Language/Version**: TypeScript cho cả frontend và backend; Node.js LTS cho môi trường phát triển  
**Primary Dependencies**: NestJS, MongoDB, Mongoose, React, Vite, Ant Design, Zustand, Axios 1.12, Lucide, Yarn  
**Storage**: MongoDB  
**Testing**: Backend: Jest + Nest testing utilities; Frontend: Vitest + React Testing Library; smoke validation cho local run  
**Target Platform**: Web application chạy local development trên máy developer, frontend và backend chạy độc lập  
**Project Type**: web application monorepo với frontend app + backend service  
**Performance Goals**: bootstrap được cả hai ứng dụng cục bộ ổn định; thời gian phản hồi local đủ cho workflow phát triển interactive; không có mục tiêu throughput production trong phase nền tảng  
**Constraints**: phải giữ đúng hai thư mục top-level `backend` và `frontend`; dùng Yarn cho package/task workflow; frontend phải áp dụng glassstyle theme qua Ant Design và chỉ dùng Lucide cho icon  
**Scale/Scope**: một repository, hai ứng dụng web, scope nền tảng cho auth/chat tương lai và onboarding developer mới

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Hiện không có constitution khả dụng ở dạng nội dung thực thi; file constitution hiện chỉ là template placeholder. Vì vậy không có gate bắt buộc cụ thể nào để chặn kế hoạch này. Re-check sau Phase 1 vẫn cho cùng kết luận: không có rule khả thi nào bị vi phạm từ tài liệu constitution hiện tại.

## Project Structure

### Documentation (this feature)

```text
specs/004-fe-be-codebase/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── system-interfaces.md
└── tasks.md
```

### Source Code (repository root)

```text
.specify/
.claude/
backend/
├── src/
│   ├── common/
│   ├── config/
│   ├── database/
│   ├── modules/
│   │   ├── health/
│   │   ├── auth/
│   │   └── chat/
│   ├── app.module.ts
│   └── main.ts
├── test/
├── .env.example
└── package.json
frontend/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   └── chat/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── store/
│   ├── theme/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── .env.example
└── package.json
mockups/
specs/
```

**Structure Decision**: Chọn cấu trúc web application với hai ứng dụng top-level `backend/` và `frontend/` đúng theo spec. Mỗi app có source, env mẫu, script và test riêng; root chỉ giữ tài nguyên cấp repository. Backend được tổ chức theo NestJS modules để sẵn chỗ cho auth/chat. Frontend giữ app shell, services, store, theme và feature areas để dễ mở rộng full-stack theo domain.

## Phase 0: Research Outputs

- [research.md](./research.md) đã chốt các quyết định về repo structure, module layout, env strategy, API service organization, testing strategy và glassstyle theme integration.
- Không còn mục `NEEDS CLARIFICATION` sau nghiên cứu vì stack và ràng buộc chính đã được xác định rõ trong spec.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) mô hình hóa Frontend Application Area, Backend Application Area, Project Convention, Environment Configuration, Frontend-Backend Communication Contract và Theme Configuration.
- [contracts/system-interfaces.md](./contracts/system-interfaces.md) xác định contract tổ chức repository, boundary từng app, env ownership, HTTP integration, theme và testing.
- [quickstart.md](./quickstart.md) mô tả cách chuẩn bị môi trường local, cấu hình env, chạy từng app độc lập và định vị nơi mở rộng auth/chat.

## Implementation Approach

1. Tạo hai ứng dụng top-level `backend/` và `frontend/` với Yarn workflow riêng nhưng thống nhất convention naming.
2. Dựng backend NestJS skeleton với MongoDB/Mongoose integration points, config module và module boundary rõ ràng.
3. Dựng frontend React/Vite skeleton với Ant Design, Zustand, Axios layer, Lucide và glassstyle shell tối thiểu ngay từ giai đoạn đầu.
4. Thiết lập env ownership riêng cho từng app bằng `.env.example` và runtime loading tương ứng.
5. Chuẩn hóa lớp giao tiếp FE→BE qua service layer phía frontend và API prefix nhất quán phía backend.
6. Thiết lập test entrypoints riêng cho frontend và backend bằng các file cấu hình cụ thể để developer chạy đúng nhóm kiểm tra theo phạm vi thay đổi.
7. Giữ sẵn vị trí mở rộng cho auth/chat mà không thêm abstraction thừa ngoài nhu cầu nền tảng.

## Delivered Scaffold Notes

Scaffold hiện đã được dựng trong workspace hiện tại với các thành phần chính sau:
- Root Yarn workspace trong `package.json`
- Backend NestJS skeleton với `main.ts`, `app.module.ts`, config/env loader, MongoDB config và các module `health`, `auth`, `chat`
- Frontend React/Vite skeleton với `main.tsx`, `App.tsx`, Ant Design provider, glassstyle theme tokens, Axios service layer, Zustand store và feature placeholders cho `auth`/`chat`
- Quickstart, data model và system contract đã được cập nhật để phản ánh scaffold thực tế

## Complexity Tracking

Không có vi phạm constitution cần biện minh ở thời điểm này.