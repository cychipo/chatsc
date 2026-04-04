# Research: Web Google Auth

## Decision 1: Backend auth dùng NestJS module riêng với OAuth callback flow
- **Decision**: Tạo `backend/src/modules/auth/` làm boundary chính cho Google OAuth, gồm controller, service, guard/strategy và session-facing endpoints như login, callback, me, logout.
- **Rationale**: Giữ auth tách biệt với phần chat, phù hợp NestJS module structure hiện có và dễ mở rộng cho protected routes.
- **Alternatives considered**:
  - Trộn auth logic vào `app.module.ts`: nhanh nhưng khó bảo trì.
  - Dùng auth provider ngoài hoàn toàn ở frontend: không phù hợp vì backend vẫn phải tạo profile/session.

## Decision 2: Tích hợp Google OAuth qua Passport strategy trong NestJS
- **Decision**: Dùng `@nestjs/passport` + `passport-google-oauth20` để xử lý redirect đến Google và callback xác thực ở backend.
- **Rationale**: Đây là cách chuẩn trong NestJS cho OAuth provider, giúp tách rõ strategy validation và callback controller.
- **Alternatives considered**:
  - Tự gọi Google OAuth endpoints thủ công: tăng độ phức tạp và dễ sai.

## Decision 3: Duy trì phiên truy cập bằng HTTP-only session cookie
- **Decision**: Sau khi Google xác thực thành công, backend tạo session server-side và trả HTTP-only cookie cho frontend. Frontend dùng endpoint `GET /auth/me` để hydrate trạng thái.
- **Rationale**: Phù hợp yêu cầu duy trì phiên, an toàn hơn localStorage cho token, và hỗ trợ route protection rõ ràng.
- **Alternatives considered**:
  - JWT lưu ở localStorage: đơn giản hơn nhưng tăng rủi ro XSS và không cần thiết cho scope đầu.

## Decision 4: User profile được upsert theo email Google, username suy ra từ local-part email
- **Decision**: Nếu user chưa tồn tại theo email, tạo hồ sơ mới. Username mặc định lấy phần trước `@`; nếu trùng, thêm hậu tố nhất quán như `-1`, `-2` theo thứ tự khả dụng.
- **Rationale**: Khớp FR-004 đến FR-006 và vẫn giữ liên hệ rõ ràng với email gốc.
- **Alternatives considered**:
  - Bắt người dùng nhập username thủ công: trái mục tiêu zero-signup.

## Decision 5: Frontend auth flow đi qua redirect login + Zustand session store
- **Decision**: Frontend có auth page với nút Google login; click sẽ redirect tới backend auth endpoint. Zustand store giữ `currentUser`, `isAuthenticated`, `authStatus`, `errorMessage`; Axios gọi `me` và `logout` với credentials.
- **Rationale**: Giữ frontend mỏng, để backend sở hữu OAuth flow thật; Zustand đủ cho auth state scope nhỏ.
- **Alternatives considered**:
  - Xử lý toàn bộ OAuth popup logic ở frontend: phức tạp hơn và lệch boundary backend.

## Decision 6: Route protection được xử lý ở cả frontend và backend
- **Decision**: Backend bảo vệ endpoint cần auth bằng session guard. Frontend dùng protected layout/route gate để chặn truy cập UI khi chưa hydrate được phiên hợp lệ.
- **Rationale**: Đảm bảo FR-008 ở cả API và UX.
- **Alternatives considered**:
  - Chỉ chặn ở frontend: không đủ an toàn.

## Decision 7: Error handling và test strategy phải xoay quanh login failure, profile creation failure và session expiry
- **Decision**: Chuẩn hóa response lỗi auth cho callback thất bại, session hết hạn và profile creation lỗi; test gồm backend unit/integration cho strategy/service/session endpoints và frontend component/store tests cho login page, auth hydrate, protected route.
- **Rationale**: Đây là các edge case chính trong spec và ảnh hưởng trực tiếp trải nghiệm đăng nhập.
- **Alternatives considered**:
  - Chỉ smoke test happy path: không đủ phủ edge cases.