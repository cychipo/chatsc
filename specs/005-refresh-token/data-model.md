# Data Model: Refresh Token Renewal

## 1. Access Token
- **Purpose**: Cho phép client gọi protected API trong thời gian ngắn mà không cần xác thực lại liên tục.
- **Key Fields / Attributes**:
  - `subjectUserId`: định danh user sở hữu token
  - `issuedAt`: thời điểm phát hành
  - `expiresAt`: thời điểm hết hạn, tối đa 30 phút sau khi phát hành
  - `sessionId`: liên kết tới refresh session đã cấp token này
  - `tokenVersion`: phiên bản hoặc dấu hiệu giúp vô hiệu hóa token cũ khi cần
- **Relationships**:
  - Thuộc về một `Refresh Session`
  - Được dùng bởi `Protected API Request`
- **Validation Rules**:
  - Chỉ hợp lệ trước `expiresAt`
  - Chỉ được chấp nhận khi gắn với refresh session chưa bị revoke
  - Không được dùng như nguồn sự thật lâu dài cho trạng thái đăng nhập

## 2. Refresh Session
- **Purpose**: Đại diện cho quyền gia hạn phiên của một người dùng trong tối đa 7 ngày.
- **Key Fields / Attributes**:
  - `id`: định danh phiên refresh
  - `userId`: định danh user
  - `issuedAt`: thời điểm phát hành
  - `expiresAt`: thời điểm hết hạn, tối đa 7 ngày sau khi phát hành
  - `revokedAt`: thời điểm thu hồi, nếu có
  - `status`: `active`, `expired`, `revoked`
  - `lastUsedAt`: thời điểm refresh gần nhất
  - `createdBy`: nguồn phát hành, ví dụ login thành công
- **Relationships**:
  - Thuộc về một `Authenticated User`
  - Có thể phát hành nhiều `Access Token` kế tiếp trong vòng đời còn hiệu lực
  - Sinh ra nhiều `Session Renewal Event`
- **Validation Rules**:
  - Không được refresh nếu `revokedAt` tồn tại
  - Không được refresh nếu đã qua `expiresAt`
  - Logout phải chuyển trạng thái sang `revoked`

## 3. Authenticated User
- **Purpose**: Người dùng đã hoàn tất xác thực và có thể sở hữu refresh session.
- **Key Fields / Attributes**:
  - `id`
  - `email`
  - `username`
  - `displayName`
  - `avatarUrl`
  - `status`
- **Relationships**:
  - Một user có thể có nhiều `Refresh Session`
  - Một user được trả về trong response refresh/hydrate khi phiên còn hợp lệ
- **Validation Rules**:
  - Chỉ user còn active mới được cấp hoặc gia hạn phiên
  - User profile trả về phải nhất quán với user đang sở hữu refresh session

## 4. Protected API Request
- **Purpose**: Một request từ frontend tới endpoint yêu cầu access token hợp lệ.
- **Key Fields / Attributes**:
  - `requestId`: định danh nội bộ để trace nếu có
  - `accessToken`: token được gắn ở request
  - `retryCount`: số lần retry sau refresh, tối đa 1
  - `failureReason`: `expired-access-token`, `unauthorized`, hoặc lỗi không liên quan auth
- **Relationships**:
  - Sử dụng `Access Token`
  - Có thể kích hoạt `Session Renewal Event`
- **Validation Rules**:
  - Chỉ retry tự động một lần nếu lỗi là hết hạn access token
  - Không retry cho lỗi validation, permission hoặc lỗi hệ thống không liên quan auth

## 5. Session Renewal Event
- **Purpose**: Ghi nhận kết quả mỗi lần frontend/backend thử gia hạn phiên.
- **Key Fields / Attributes**:
  - `sessionId`
  - `userId`
  - `attemptedAt`
  - `result`: `succeeded` hoặc `failed`
  - `failureReason`: thiếu token, hết hạn, bị revoke, sai token, hoặc nguyên nhân hệ thống
- **Relationships**:
  - Thuộc về một `Refresh Session`
  - Tham chiếu một `Authenticated User`
- **Validation Rules**:
  - Mọi lần refresh đều phải có kết quả được ghi nhận
  - Event failed phải nêu lý do đủ để phân tích vận hành

## State Transitions

### Refresh Session Lifecycle
1. `active`: được tạo sau login thành công.
2. `active` → `active`: được dùng để refresh và cập nhật `lastUsedAt`.
3. `active` → `expired`: vượt quá `expiresAt`.
4. `active` → `revoked`: logout hoặc backend chủ động thu hồi.
5. `expired` và `revoked`: không thể quay lại `active`.

### Protected Request Recovery
1. Request gửi với access token hiện tại.
2. Nếu token còn hạn, request thành công bình thường.
3. Nếu token hết hạn, request nhận lỗi auth với mã lỗi phân biệt được.
4. Frontend kích hoạt đúng một lần refresh dùng chung.
5. Nếu refresh thành công, request ban đầu retry với access token mới.
6. Nếu refresh thất bại, frontend xóa trạng thái authenticated và yêu cầu login lại.
7. Nếu request thất bại vì lỗi business không liên quan auth, frontend trả lại lỗi gốc và không kích hoạt refresh.
