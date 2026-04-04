# Implementation Plan: Web Google Auth

**Branch**: `main` (current workspace; target feature is `002-web-chat-gateway`) | **Date**: 2026-04-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-web-chat-gateway/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Triển khai luồng đăng nhập Google cho website dựa trên codebase FE/BE đã được scaffold, trong đó backend NestJS xử lý Google OAuth callback, tạo hoặc nạp hồ sơ người dùng và duy trì session hợp lệ; frontend React/Vite hiển thị auth UI theo glassstyle, hydrate trạng thái đăng nhập và bảo vệ khu vực yêu cầu xác thực. Kế hoạch ưu tiên hoàn thiện happy path login trước, sau đó khóa chặt profile creation, session persistence và error handling cho các edge case chính.

## Technical Context

**Language/Version**: TypeScript cho cả frontend và backend; Node.js LTS cho môi trường phát triển  
**Primary Dependencies**: NestJS, MongoDB, Mongoose, Passport, passport-google-oauth20, express-session hoặc session store tương đương, React, Vite, Ant Design, Zustand, Axios 1.12, Lucide, Yarn  
**Storage**: MongoDB cho hồ sơ người dùng; session store phía server cho trạng thái truy cập  
**Testing**: Backend: Jest + Nest testing utilities; Frontend: Vitest + React Testing Library; integration validation cho login/session flow  
**Target Platform**: Web application chạy local development trên máy developer; frontend và backend chạy riêng nhưng phối hợp qua HTTP và browser redirect flow  
**Project Type**: web application monorepo với frontend app + backend service  
**Performance Goals**: 95% login hợp lệ thành công ngay lần đầu trong kịch bản test chấp nhận; 95% session hợp lệ được khôi phục thành công khi reload trong thời gian còn hiệu lực  
**Constraints**: chỉ hỗ trợ Google login cho end user; mã nguồn tiếp tục nằm trong `backend/` và `frontend/`; frontend phải giữ glassstyle theme và Lucide icons; username phải suy ra từ local-part email theo quy tắc nhất quán; session invalid phải buộc login lại  
**Scale/Scope**: một website web-first, một provider Google OAuth, user profile cơ bản, protected area cho app đã đăng nhập và session persistence trong scope auth đầu tiên

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Hiện không có constitution khả dụng ở dạng nội dung thực thi; file constitution hiện chỉ là template placeholder. Vì vậy không có gate bắt buộc cụ thể nào để chặn kế hoạch này. Re-check sau Phase 1 vẫn cho cùng kết luận: không có rule khả thi nào bị vi phạm từ tài liệu constitution hiện tại.

## Project Structure

### Documentation (this feature)

```text
specs/002-web-chat-gateway/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-interfaces.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/
│   ├── database/
│   ├── modules/
│   │   ├── auth/
│   │   ├── chat/
│   │   └── health/
│   ├── app.module.ts
│   └── main.ts
├── test/
└── .env.example
frontend/
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── auth/
│   │   └── chat/
│   ├── pages/
│   ├── services/
│   ├── store/
│   ├── theme/
│   ├── test/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── index.html
└── .env.example
specs/
```

**Structure Decision**: Dùng đúng scaffold monorepo hiện có với hai ứng dụng top-level `backend/` và `frontend/`. OAuth được triển khai chủ yếu trong `backend/src/modules/auth/` cho strategy/session/profile handling, còn frontend mở rộng `frontend/src/features/auth/`, `frontend/src/services/`, `frontend/src/store/` và app routing để xử lý login UI, hydrate session và protected navigation.

## Phase 0: Research Outputs

- [research.md](./research.md) đã chốt hướng dùng Passport Google strategy, session cookie server-side, user profile upsert theo email/Google identity, username derivation có collision handling, frontend auth store bằng Zustand và route protection hai lớp.
- Không còn mục `NEEDS CLARIFICATION` trước khi sang Phase 1 vì provider, stack và boundary FE/BE đã được xác định rõ trong spec.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) mô hình hóa User Profile, Authenticated Session, Auth Attempt và Username Derivation Rule.
- [contracts/auth-interfaces.md](./contracts/auth-interfaces.md) xác định contract cho login UI, backend OAuth endpoints, session behavior, profile creation, error handling và frontend auth state.
- [quickstart.md](./quickstart.md) mô tả env setup, local OAuth wiring, login validation và edge-case validation.

## Implementation Approach

1. Mở rộng backend auth module thành boundary thực cho Google OAuth, session endpoints, logout và current-user lookup.
2. Thêm persistence model cho user profile và logic tạo user từ Google email với username derivation/collision handling.
3. Thiết lập session management server-side và guard cho protected backend endpoints.
4. Mở rộng frontend auth feature với login page, auth store, session hydrate flow, route protection và logout handling.
5. Áp dụng glassstyle auth UI nhất quán với Ant Design + Lucide cho login state, error state và authenticated entry state.
6. Bao phủ các edge case chính: login cancel, profile creation failure, username collision, session expiry.
7. Giữ chat scope tách biệt; chỉ chuẩn bị integration points cần thiết cho authenticated area.

## Delivery Notes

- Backend đã cung cấp các endpoint `GET /auth/google`, `GET /auth/google/callback`, `GET /auth/google/failure`, `GET /auth/me` và `POST /auth/logout`.
- Google strategy hiện upsert hồ sơ người dùng qua `AuthService`, đồng thời username được tạo từ local-part email và suffix `-1`, `-2`... khi bị trùng.
- Frontend hiện hydrate session ở app bootstrap, hiển thị auth error từ query string `authError`, bảo vệ protected area bằng `ProtectedRoute`, và render authenticated summary + logout action tại home page.
- Test coverage hiện bao gồm login flow, profile derivation, session hydrate và logout flow cho cả backend và frontend.

## Complexity Tracking

Không có vi phạm constitution cần biện minh ở thời điểm này.