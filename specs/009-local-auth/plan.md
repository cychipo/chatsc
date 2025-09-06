# Implementation Plan: Xác thực bằng tài khoản thường

**Branch**: `009-local-auth` | **Date**: 2026-04-05 | **Spec**: [/Users/tgiap.dev/devs/chatsc/specs/009-local-auth/spec.md](/Users/tgiap.dev/devs/chatsc/specs/009-local-auth/spec.md)
**Input**: Feature specification from `/specs/009-local-auth/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Thêm luồng xác thực bằng tài khoản thường song song với Google login hiện có, bao gồm đăng ký tài khoản mới, đăng nhập lại bằng email + mật khẩu, dùng chung cơ chế cấp access token/refresh token hiện tại, và tận dụng Linux-backed SHA1 processing qua remote processor dùng chung đã có để xử lý mật khẩu local.

## Technical Context

**Language/Version**: TypeScript 5.x cho frontend và backend; C/GCC cho dịch vụ xử lý SHA1 từ xa hiện có  
**Primary Dependencies**: NestJS 10, Mongoose 8, Passport session, jsonwebtoken, React 18, Zustand 5, Axios 1.12, Ant Design 5, dịch vụ remote processor qua TCP đã có sẵn  
**Storage**: MongoDB cho user/auth attempt/refresh session; cookie HTTP-only cho refresh token; browser storage cho access token runtime  
**Testing**: Build validation hiện có cho frontend/backend; kiểm thử tích hợp thủ công theo quickstart; có thể bổ sung test auth service/controller nếu cần trong implementation  
**Target Platform**: Web application với backend NestJS và frontend React chạy trên môi trường phát triển hiện tại  
**Project Type**: Web application  
**Performance Goals**: Đăng ký/đăng nhập local hoàn tất trong trải nghiệm web thông thường mà không tạo bước chờ bất thường; không làm suy giảm trải nghiệm auth hiện có  
**Constraints**: Không làm hỏng Google login hiện tại; không lưu plaintext password; không để lộ field sai trong lỗi login; chỉ mở rộng trên cơ chế session/token hiện có; local auth cần phụ thuộc vào Linux-backed SHA1 processing đã có  
**Scale/Scope**: Một màn hình auth frontend, một module auth backend, một schema user dùng chung, một hợp đồng API cho register/login local song song với Google login

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Constitution file hiện vẫn là placeholder, chưa định nghĩa nguyên tắc/gate thực tế để áp dụng cưỡng bức.
- Không có gate cụ thể nào được khai báo để chặn feature này.
- Re-check sau Phase 1: không phát hiện mâu thuẫn mới với cấu trúc project hiện tại.

## Project Structure

### Documentation (this feature)

```text
specs/009-local-auth/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── local-auth-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── config/
│   └── modules/
│       └── auth/
│           ├── auth.controller.ts
│           ├── auth.module.ts
│           ├── auth.service.ts
│           ├── guards/
│           ├── schemas/
│           │   ├── auth-attempt.schema.ts
│           │   ├── refresh-session.schema.ts
│           │   └── user.schema.ts
│           ├── strategies/
│           ├── types/
│           └── utils/
└── tests/

frontend/
├── src/
│   ├── features/
│   │   └── auth/
│   │       └── auth.page.tsx
│   ├── services/
│   │   └── auth.service.ts
│   ├── store/
│   │   └── auth.store.ts
│   └── types/
│       └── auth.ts
└── tests/

app/
├── processor/
└── shared/
```

**Structure Decision**: Dùng cấu trúc web application hiện tại với thay đổi chính ở `backend/src/modules/auth/` và `frontend/src/features/auth/`, đồng thời tái sử dụng dịch vụ remote processor hiện có từ feature 007 thay vì tạo subsystem auth riêng.

## Phase 0: Research

### Kết luận nghiên cứu
1. Mở rộng `User` hiện có để hỗ trợ local credential song song với Google login.
2. Dùng email + password cho login local; username vẫn là định danh công khai.
3. Reuse cơ chế issue/refresh/revoke token hiện có cho local auth.
4. Ghi nhận `AuthAttempt` cho local register/login với provider riêng.
5. Mở rộng một `AuthPage` hiện tại để hiển thị rõ Google login, local login và local register.
6. Dùng Linux-backed SHA1 processing qua remote processor hiện có để băm mật khẩu local.

## Phase 1: Design & Contracts

### Backend design
- Mở rộng `UserSchema` để cho phép tồn tại user chỉ-Google, chỉ-local, hoặc kết hợp nếu cần mở rộng sau này.
- Bổ sung contract/service cho:
  - đăng ký local account,
  - đăng nhập local account,
  - xác minh local password qua SHA1 remote processor,
  - issue token pair giống Google login.
- Mở rộng `AuthController` với endpoint register/login local nhưng giữ nguyên `me`, `refresh`, `logout`, `google/*`.
- Chuẩn hoá `AuthAttempt.provider`, `result`, `failureReason` cho register/login local.
- Tận dụng remote processor dùng chung hiện có để gọi mode SHA1; auth flow phải fail rõ nếu không xử lý SHA1 được.

### Frontend design
- Mở rộng `AuthPage` hiện tại thành giao diện nhiều trạng thái: Google login, local login, local register.
- Giữ nguyên `AuthStore` và cơ chế hydrate/refresh session, chỉ thêm action gọi register/login local.
- Reuse shape response session hiện tại để không phải đổi contract ở store.
- Hiển thị lỗi validation/form submit rõ ràng, nhưng lỗi login sai thông tin phải là lỗi chung an toàn.

### Contracts created
- `contracts/local-auth-contract.md`: xác định request/response/failure cases cho `POST /auth/register`, `POST /auth/login`, và hành vi giữ nguyên của `me/refresh/logout`.

### Data model created
- `data-model.md`: mô tả `User`, `localAuth`, `Local Registration Submission`, `Local Login Submission`, `Auth Attempt`, `Refresh Session`.

### Quickstart created
- `quickstart.md`: xác minh đăng ký local, đăng nhập local, chặn duplicate, validation, coexist với Google login, và lỗi SHA1 remote.

## Post-Design Constitution Check

- Constitution vẫn không có rule cụ thể ngoài placeholder.
- Thiết kế này giữ simple path: mở rộng module auth hiện có, không tách service/platform mới không cần thiết.
- Không có vi phạm nào cần ghi vào Complexity Tracking.

## Complexity Tracking

Không có mục nào cần biện minh ở thời điểm lập plan này.
