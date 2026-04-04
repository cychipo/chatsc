# Research: Nền tảng codebase FE + BE

## Decision 1: Tổ chức repository theo hai ứng dụng top-level `backend/` và `frontend/`
- **Decision**: Dùng monorepo một repository với hai thư mục ứng dụng top-level đúng theo spec: `backend/` cho NestJS service và `frontend/` cho React/Vite app. Root giữ tài nguyên cắt ngang như `.gitignore`, `specs/`, `mockups/` và script chung.
- **Rationale**: Khớp trực tiếp FR-014, làm ranh giới trách nhiệm rõ ràng, dễ onboarding và phù hợp cho phát triển full-stack nhưng vẫn chạy độc lập từng phía.
- **Alternatives considered**:
  - `apps/backend` + `apps/frontend`: hợp với monorepo lớn hơn nhưng lệch yêu cầu thư mục top-level.
  - Tách 2 repository: tăng chi phí phối hợp, trái assumption cùng một repository.

## Decision 2: Backend dùng cấu trúc NestJS theo domain + shared infrastructure
- **Decision**: Trong `backend/src`, tổ chức `main.ts`, `app.module.ts`, `config/`, `common/`, `database/`, `modules/health`, và sau này mở rộng `modules/auth`, `modules/chat`.
- **Rationale**: Đây là cấu trúc dễ mở rộng cho auth/chat, giữ rõ phần cấu hình, hạ tầng Mongo/Mongoose và feature modules theo convention NestJS.
- **Alternatives considered**:
  - Layer-first toàn cục (`controllers/`, `services/`, `schemas/`): đơn giản lúc đầu nhưng khó scale theo feature.
  - Hexagonal đầy đủ ngay từ đầu: quá nặng cho nền tảng ban đầu.

## Decision 3: Frontend dùng cấu trúc React/Vite theo app shell + feature areas
- **Decision**: Trong `frontend/src`, tổ chức `main.tsx`, `App.tsx`, `app/`, `components/`, `features/`, `pages/`, `store/`, `services/`, `theme/`, `lib/`, `types/`.
- **Rationale**: Tách rõ shell ứng dụng, reusable UI, domain features và integration layer; đủ đơn giản cho phase đầu nhưng còn chỗ cho auth/chat.
- **Alternatives considered**:
  - Chỉ tách `components/` và `pages/`: nhanh nhưng dễ gom business logic rải rác.
  - Feature-only toàn bộ từ đầu: hơi nặng khi app còn nhỏ.

## Decision 4: Quản lý môi trường tách riêng từng app, thống nhất bằng naming convention
- **Decision**: Mỗi app có file env mẫu riêng (`backend/.env.example`, `frontend/.env.example`). Backend đọc qua Nest ConfigModule; frontend dùng biến `VITE_*`. Convention dùng tên rõ nguồn gốc như `MONGODB_URI`, `PORT`, `VITE_API_BASE_URL`.
- **Rationale**: Khớp FR-010, FR-021 và cho phép frontend/backend chạy độc lập mà không trộn biến môi trường.
- **Alternatives considered**:
  - Một `.env` dùng chung ở root: tiện lúc đầu nhưng mơ hồ ownership và dễ rò biến backend sang frontend.

## Decision 5: API contract frontend-backend đi qua lớp HTTP service tập trung
- **Decision**: Frontend đặt Axios instance và API modules trong `frontend/src/services/`; backend public route theo prefix `/api`. Dùng một chỗ cấu hình base URL, interceptors và mapping response.
- **Rationale**: Tạo vị trí rõ ràng cho giao tiếp FE→BE theo FR-009, tránh gọi HTTP rải rác trong component.
- **Alternatives considered**:
  - Gọi Axios trực tiếp trong component/store: khó bảo trì.

## Decision 6: Testing strategy riêng cho từng app, giữ naming nhất quán
- **Decision**: Backend dùng Jest + Nest testing utilities cho unit/integration; frontend dùng Vitest + React Testing Library cho unit/component. Có thể thêm e2e sau ở từng app hoặc root `tests/` khi cần full-stack.
- **Rationale**: Cho phép chạy kiểm tra phù hợp cho từng khu vực ứng dụng theo FR-011 mà không bắt buộc một test runner chung.
- **Alternatives considered**:
  - Một test stack duy nhất cho cả repo: không thực tế vì frontend/backend khác runtime.

## Decision 7: Glassstyle theme được đóng gói ở lớp cấu hình giao diện toàn cục
- **Decision**: Tạo `frontend/src/theme/` chứa token màu, border, shadow, blur và component overrides; tích hợp qua Ant Design `ConfigProvider` ở app root. Lucide là bộ icon duy nhất trên toàn UI.
- **Rationale**: Khớp FR-017 đến FR-019 và phản ánh trực tiếp design token trong mockup `mockups/design-system.html` như nền gradient cam, glass surface, border mềm và shadow kính.
- **Alternatives considered**:
  - Inline style theo từng màn: không giữ được consistency.
  - CSS framework riêng cho theme: lệch yêu cầu dùng Ant Design làm nền UI.