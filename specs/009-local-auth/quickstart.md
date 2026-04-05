# Quickstart: Xác thực bằng tài khoản thường

## Mục tiêu
Xác minh người dùng có thể đăng ký và đăng nhập bằng tài khoản thường, đồng thời hệ thống vẫn giữ nguyên cơ chế phiên hiện có và không làm hỏng Google login.

## Chuẩn bị
1. Chạy backend và frontend như môi trường phát triển hiện tại.
2. Đảm bảo MongoDB đang hoạt động.
3. Đảm bảo cấu hình remote processor dùng chung đã sẵn sàng nếu local auth dùng Linux-backed SHA1 processing.
4. Mở ứng dụng ở trạng thái chưa đăng nhập.

## Kịch bản 1: Đăng ký tài khoản thường thành công
1. Mở màn hình xác thực.
2. Chuyển sang luồng đăng ký tài khoản thường.
3. Nhập email, username, display name, password và confirm password hợp lệ.
4. Gửi biểu mẫu.
5. Xác nhận:
   - người dùng được vào khu vực đã bảo vệ ngay sau khi đăng ký,
   - endpoint `GET /auth/me` trả đúng user mới,
   - refresh cookie đã được thiết lập,
   - DB có user mới với local credential metadata,
   - không có plaintext password bị lưu.

## Kịch bản 2: Chặn đăng ký trùng email/username
1. Dùng lại email của user đã tồn tại để đăng ký.
2. Xác nhận hệ thống từ chối và hiển thị lỗi email đã tồn tại.
3. Lặp lại với username trùng.
4. Xác nhận không tạo thêm user mới trong DB.

## Kịch bản 3: Validation đăng ký
1. Gửi form thiếu trường bắt buộc.
2. Gửi form với confirm password không khớp.
3. Xác nhận hệ thống không tạo tài khoản và hiển thị lỗi tương ứng.

## Kịch bản 4: Đăng nhập local thành công
1. Đăng xuất khỏi phiên hiện tại.
2. Chuyển sang luồng đăng nhập local.
3. Nhập đúng email và password của tài khoản vừa đăng ký.
4. Gửi biểu mẫu.
5. Xác nhận:
   - đăng nhập thành công,
   - auth store/phiên frontend trở về trạng thái authenticated,
   - `GET /auth/me` trả đúng user,
   - refresh cookie được cấp lại,
   - có bản ghi auth attempt thành công.

## Kịch bản 5: Đăng nhập local thất bại an toàn
1. Thử email đúng nhưng password sai.
2. Thử email không tồn tại.
3. Xác nhận cả hai trường hợp đều trả lỗi chung an toàn, không tiết lộ field nào sai.
4. Xác nhận không có session hợp lệ mới được tạo.

## Kịch bản 6: Tài khoản không hỗ trợ local auth
1. Chọn một tài khoản chỉ có Google login.
2. Thử đăng nhập qua local auth.
3. Xác nhận hệ thống chặn đúng luồng và trả lỗi phù hợp.

## Kịch bản 7: Tương thích với Google login hiện có
1. Từ màn hình auth, xác nhận vẫn nhìn thấy lựa chọn Google login.
2. Xác nhận có thể chuyển qua lại giữa Google, đăng nhập thường và đăng ký thường ngay trên cùng card auth.
3. Đăng nhập bằng Google như cũ.
4. Xác nhận người dùng Google vẫn vào hệ thống bình thường.
5. Đăng xuất và thử local auth lại để xác nhận hai luồng cùng tồn tại ổn định.

## Kịch bản 8: Lỗi xử lý SHA1 remote
1. Làm cho backend không thể gọi được dịch vụ xử lý SHA1 remote.
2. Thử đăng ký hoặc đăng nhập local.
3. Xác nhận hệ thống trả lỗi rõ ràng, không tạo user nửa chừng và không tạo phiên lỗi.

## Checklist xác nhận nhanh
- [ ] Đăng ký local thành công tạo user mới và đăng nhập ngay.
- [ ] Email trùng bị chặn.
- [ ] Username trùng bị chặn.
- [ ] Confirm password sai bị chặn.
- [ ] Login local đúng thông tin thành công.
- [ ] Login local sai thông tin thất bại an toàn.
- [ ] Tài khoản Google-only không login local sai luồng.
- [ ] Google login cũ vẫn hoạt động.
- [ ] Auth attempt được ghi nhận cho register/login local.
- [ ] Không có plaintext password bị lưu trong DB/log.
