# Data Model: Web Google Auth

## 1. User Profile
- **Purpose**: Đại diện cho người dùng đăng nhập bằng Google và danh tính dùng trong hệ thống.
- **Key Fields / Attributes**:
  - `id`
  - `googleId`
  - `email`
  - `username`
  - `displayName`
  - `avatarUrl`
  - `status`
  - `createdAt`
  - `updatedAt`
- **Relationships**:
  - Có thể có nhiều Auth Attempt theo thời gian.
  - Có thể gắn với nhiều Authenticated Session nếu hệ thống cho phép nhiều phiên.
- **Validation Rules**:
  - `email` phải là duy nhất.
  - `googleId` phải là duy nhất.
  - `username` được suy ra từ local-part email và phải duy nhất sau khi áp dụng collision rule.

## 2. Authenticated Session
- **Purpose**: Đại diện cho trạng thái truy cập hợp lệ của người dùng trên website.
- **Key Fields / Attributes**:
  - `sessionId`
  - `userId`
  - `issuedAt`
  - `expiresAt`
  - `lastSeenAt`
  - `status`
- **Relationships**:
  - Thuộc về một User Profile.
- **Validation Rules**:
  - Session chỉ hợp lệ khi chưa hết hạn và chưa bị đăng xuất.
  - Session không được tạo nếu Google auth hoặc profile creation thất bại.

## 3. Auth Attempt
- **Purpose**: Theo dõi một lần bắt đầu, thành công, thất bại hoặc hủy của luồng đăng nhập Google.
- **Key Fields / Attributes**:
  - `attemptId`
  - `provider`
  - `emailCandidate`
  - `result`
  - `failureReason`
  - `startedAt`
  - `completedAt`
- **Relationships**:
  - Có thể tham chiếu User Profile nếu attempt thành công.
- **Validation Rules**:
  - `provider` trong scope này luôn là `google`.
  - `result` thuộc một trong các trạng thái `started`, `cancelled`, `failed`, `succeeded`.

## 4. Username Derivation Rule
- **Purpose**: Mô tả quy tắc suy ra username từ email Google.
- **Key Fields / Attributes**:
  - `sourceEmail`
  - `baseUsername`
  - `resolvedUsername`
  - `collisionIndex`
- **Relationships**:
  - Được dùng khi tạo mới User Profile.
- **Validation Rules**:
  - `baseUsername` lấy từ phần trước `@`.
  - Khi trùng, `resolvedUsername` phải theo quy tắc nhất quán và có thể dự đoán được.

## State Transitions

### Login Success
1. User bắt đầu Google login từ frontend.
2. Backend nhận callback xác thực thành công.
3. Hệ thống tìm hoặc tạo User Profile.
4. Hệ thống tạo Authenticated Session hợp lệ.
5. Frontend hydrate trạng thái đã đăng nhập.

### Login Cancel / Failure
1. User bắt đầu Google login.
2. Google flow bị hủy hoặc callback lỗi.
3. Auth Attempt được đánh dấu thất bại/hủy.
4. Không tạo Authenticated Session.
5. Frontend hiển thị thông báo lỗi phù hợp.

### Session Expiry / Logout
1. User đang có session hợp lệ.
2. User đăng xuất hoặc session hết hạn.
3. Session chuyển sang trạng thái không hợp lệ.
4. Frontend mất trạng thái authenticated và yêu cầu login lại.