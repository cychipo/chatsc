# Research: Refresh Token Renewal

## 1. Token transport strategy

- **Decision**: Dùng access token sống ngắn ở response body và lưu tại frontend auth state; dùng refresh token sống dài hơn trong cookie HTTP-only gửi tự động về backend.
- **Rationale**: Frontend cần truy cập access token để gắn vào protected API requests, trong khi refresh token nên khó bị truy cập từ JavaScript hơn và phù hợp cho luồng tự động làm mới phiên.
- **Alternatives considered**:
  - Lưu cả access token và refresh token ở localStorage: đơn giản hơn nhưng tăng bề mặt rủi ro cho token dài hạn.
  - Dùng session cookie duy nhất như hiện tại: không đáp ứng yêu cầu access token 30 phút + refresh token 7 ngày và auto-retry theo spec.

## 2. Refresh endpoint contract

- **Decision**: Tạo endpoint refresh chuyên biệt trong auth module để trả về access token mới và trạng thái user/session liên quan.
- **Rationale**: Endpoint chuyên biệt giúp tách bạch rõ giữa hydrate profile (`/auth/me`) và renew session (`/auth/refresh`), dễ test, dễ log, và dễ kiểm soát lỗi refresh.
- **Alternatives considered**:
  - Tự động refresh bên trong mọi protected endpoint: khó chuẩn hóa contract lỗi, khó quan sát, và tạo coupling cao.
  - Tái sử dụng `/auth/me` để refresh ngầm: làm mờ semantics của endpoint và khó kiểm tra luồng retry.

## 3. Backend refresh persistence

- **Decision**: Lưu refresh session phía backend với thông tin user, expiry, trạng thái revoked và metadata cơ bản của lần phát hành.
- **Rationale**: Spec yêu cầu refresh token có thể bị invalid/revoked trước 7 ngày và cần audit renewal event. Điều này cần một nguồn trạng thái phía server thay vì chỉ token tự chứa dữ liệu.
- **Alternatives considered**:
  - Refresh token hoàn toàn stateless: khó revoke chọn lọc và khó audit.
  - Chỉ dùng session store hiện có: không khớp contract JWT-like access/refresh lifetimes mà feature đang yêu cầu.

## 4. Frontend auto-refresh concurrency

- **Decision**: Dùng một promise refresh dùng chung trong Axios interceptor để chặn việc nhiều request đồng thời cùng gọi refresh.
- **Rationale**: Edge case trong spec yêu cầu tránh các lần gia hạn xung đột và phải khôi phục request nhất quán khi access token vừa hết hạn.
- **Alternatives considered**:
  - Mỗi request tự refresh độc lập: dễ gây race condition, ghi đè token mới, và tăng tải không cần thiết.
  - Không retry tự động: trái với yêu cầu chính của feature.

## 5. Protected API authentication model

- **Decision**: Chuyển protected API business routes sang xác thực bearer access token, trong khi OAuth handshake và refresh cookie vẫn do auth module xử lý.
- **Rationale**: Feature mô tả rõ request API bị lỗi do token hết hạn rồi được refresh và retry. Điều này phù hợp với contract bearer access token hơn session-only guard hiện tại.
- **Alternatives considered**:
  - Tiếp tục dùng session guard cho tất cả protected endpoints và chỉ thêm refresh cho frontend: không tạo giá trị thực vì protected API không đọc access token.
  - Thay thế toàn bộ flow OAuth hiện có ngay lập tức: phạm vi lớn hơn yêu cầu, tăng rủi ro migration.

## 6. App bootstrap and session hydration

- **Decision**: Khi app khởi động, frontend sẽ thử renew session để lấy access token nếu refresh cookie còn hiệu lực, sau đó mới gọi endpoint profile hoặc dùng payload refresh response để hydrate store.
- **Rationale**: Với access token chỉ sống 30 phút, app reload sau một thời gian cần cách lấy access token mới trước khi các protected route hoạt động ổn định.
- **Alternatives considered**:
  - Chỉ gọi `/auth/me` lúc bootstrap: không đủ nếu endpoint profile sau này yêu cầu bearer token.
  - Lưu access token bền vững lâu dài ở frontend: mâu thuẫn với yêu cầu short-lived token và làm tăng nguy cơ dùng token cũ.
