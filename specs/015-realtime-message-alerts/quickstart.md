# Quickstart: Realtime message alerts

## Goal

Xác minh người dùng nhận được thông báo realtime trong phiên và title tab phản ánh đúng unread state theo spec.

## Preconditions

- Backend và frontend đang chạy.
- Có ít nhất 2 tài khoản người dùng hoạt động.
- Hai tài khoản đã có thể nhắn tin với nhau qua chat hiện tại.

## Scenario 1: Một người gửi, một hoặc nhiều tin chưa đọc

1. Đăng nhập User A và mở trang chat trong trình duyệt.
2. Mở User A ở một tab nhưng không chọn đọc conversation mục tiêu.
3. Đăng nhập User B ở phiên khác và gửi 1 tin nhắn cho User A.
4. Xác minh User A thấy thông báo mới trong phiên hiện tại.
5. Xác minh title tab của User A đổi thành `Bạn có 1 tin nhắn mới từ {tên User B}`.
6. Gửi thêm 2 tin nhắn từ User B.
7. Xác minh title tab đổi thành `Bạn có 3 tin nhắn mới từ {tên User B}`.

## Scenario 2: Nhiều người gửi

1. Giữ nguyên unread từ User B.
2. Đăng nhập User C ở phiên khác và gửi 1 tin nhắn cho User A.
3. Xác minh User A tiếp tục nhận thông báo trong phiên.
4. Xác minh title tab chuyển sang `Bạn có 4 tin nhắn chưa đọc`.

## Scenario 3: Đọc tin nhắn và reset title

1. Tại phiên User A, mở conversation của User B và User C để hệ thống đánh dấu đã đọc.
2. Nếu vẫn còn unread từ đúng một người gửi, xác minh title quay về mẫu `Bạn có n tin nhắn mới từ {name user}`.
3. Khi toàn bộ unread về 0, xác minh title tab trở về title mặc định của ứng dụng.

## Scenario 4: Không thông báo cho message của chính mình

1. Tại phiên User A, gửi tin nhắn mới trong conversation bất kỳ.
2. Xác minh User A không nhận thông báo mới cho chính tin nhắn họ vừa gửi.
3. Xác minh unread aggregate của User A không tăng vì hành động đó.

## Regression checks

- Reconnect socket không làm title bị kẹt ở giá trị cũ.
- Nhiều message đến sát nhau vẫn cho ra tổng unread đúng.
- Khi sender name thiếu, title vẫn hiển thị hợp lệ theo fallback đã thiết kế.