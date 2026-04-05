# Auth Interfaces Contract: Refresh Token Renewal

## 1. Login Completion Contract
- Backend MUST hoàn tất Google login hiện tại và trả về đủ thông tin để frontend có thể bắt đầu authenticated session với access token 30 phút và refresh capability 7 ngày.
- Sau login thành công, frontend MUST có thể hydrate trạng thái user hiện tại mà không yêu cầu người dùng thao tác thêm.
- Login thất bại MUST không tạo refresh capability hợp lệ.

## 2. Refresh Endpoint Contract
- Backend MUST cung cấp endpoint refresh riêng để nhận refresh credential hợp lệ và trả về access token mới.
- Endpoint refresh MUST từ chối khi refresh credential bị thiếu, hết hạn, không hợp lệ hoặc đã bị thu hồi.
- Refresh thành công MUST trả về access token mới có hiệu lực 30 phút và đủ dữ liệu để frontend duy trì trạng thái authenticated.
- Refresh thất bại MUST trả về unauthenticated outcome rõ ràng để frontend buộc người dùng đăng nhập lại.

## 3. Protected API Contract
- Các endpoint protected MUST yêu cầu access token hợp lệ.
- Khi access token đã hết hạn, endpoint protected MUST trả về lỗi xác thực có thể phân biệt với lỗi validation, permission hoặc business logic.
- Sau khi frontend refresh thành công, request protected ban đầu MUST có thể được gửi lại đúng một lần với access token mới.
- Nếu request retry vẫn thất bại vì lý do không liên quan token expiry, frontend MUST hiển thị lỗi thật của request đó.

## 4. Logout Contract
- Backend MUST cung cấp logout endpoint để kết thúc phiên hiện tại.
- Logout MUST làm mất hiệu lực refresh capability của phiên hiện tại.
- Sau logout, frontend MUST xóa access token đang lưu và chuyển về trạng thái unauthenticated.
- Bất kỳ lần refresh nào sau logout MUST bị từ chối.

## 5. Frontend HTTP Client Contract
- Frontend MUST gắn access token hiện tại vào protected API requests.
- Frontend MUST chỉ kích hoạt auto-refresh khi request thất bại vì access token hết hạn.
- Frontend MUST retry request thất bại tối đa một lần sau refresh thành công.
- Frontend MUST ngăn nhiều request đồng thời tạo nhiều refresh calls trùng lặp cho cùng một đợt hết hạn token.
- Frontend MUST không refresh lặp vô hạn cho cùng một request.

## 6. Frontend Auth State Contract
- Frontend auth store MUST giữ được tối thiểu:
  - `currentUser`
  - `isAuthenticated`
  - `isHydrating`
  - `errorMessage`
  - `accessToken`
- App bootstrap MUST có thể khôi phục authenticated state nếu refresh capability còn hiệu lực.
- Nếu refresh thất bại trong bootstrap hoặc giữa phiên, frontend MUST xóa auth state và đưa người dùng về luồng đăng nhập.
- Protected route hiện dùng `isAuthenticated` + `isHydrating` từ auth store để quyết định render nội dung được bảo vệ hoặc quay về auth page.

## 7. Audit and Monitoring Contract
- Backend MUST ghi nhận mỗi lần refresh thành công hoặc thất bại.
- Dữ liệu audit MUST đủ để phân biệt lỗi hết hạn, token không hợp lệ, token bị thu hồi và lỗi hệ thống.
- Backend SHOULD giữ khả năng đối chiếu refresh event với user và refresh session liên quan.
