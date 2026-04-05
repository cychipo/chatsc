# Quickstart: Gửi tin nhắn qua Socket

## Mục tiêu
Kiểm tra nhanh luồng chat realtime sau khi feature được implement.

## Chuẩn bị
1. Đăng nhập bằng hai tài khoản hợp lệ.
2. Mở cùng một cuộc trò chuyện trên hai phiên khác nhau.
3. Đảm bảo cả hai phiên đều có quyền truy cập vào conversation đó.
4. Mở DevTools Network và xác nhận có kết nối WebSocket tới namespace `/chat`.

## Kịch bản kiểm thử chính

### 1. Kết nối realtime thành công
1. Mở trang chat ở cả hai phiên.
2. Xác nhận UI thể hiện trạng thái `Đã kết nối realtime`.
3. Mở cùng một conversation ở cả hai phía.
4. Xác nhận không còn request REST per-message khi gửi message mới.

### 2. Gửi tin nhắn realtime
1. Ở phiên A, nhập tin nhắn và nhấn Enter.
2. Xác nhận tin nhắn xuất hiện ngay ở thread phía A.
3. Xác nhận tin nhắn xuất hiện ngay ở thread phía B mà không cần refresh.
4. Xác nhận preview conversation ở sidebar được cập nhật ở cả hai phía.

### 3. Shift+Enter xuống dòng
1. Ở phiên A, nhập nhiều dòng bằng Shift+Enter.
2. Nhấn Enter để gửi.
3. Xác nhận nội dung nhiều dòng được giữ nguyên khi hiển thị.
4. Xác nhận input không bị cao bất thường khi chưa nhập nhiều dòng.

### 4. Chặn gửi tin nhắn rỗng
1. Nhập chỉ khoảng trắng.
2. Thử gửi.
3. Xác nhận không có tin nhắn nào được tạo.
4. Xác nhận UI hiện lỗi rõ ràng.

### 5. Reconnect sau mất kết nối tạm thời
1. Ngắt mạng hoặc chặn kết nối socket ở phiên A.
2. Xác nhận UI báo `Mất kết nối realtime` hoặc `Đang kết nối lại realtime`.
3. Khôi phục kết nối.
4. Xác nhận UI trở lại trạng thái `Đã kết nối realtime`.
5. Gửi tiếp một tin nhắn mới và xác nhận luồng realtime hoạt động lại.

### 6. Không nhận trùng message
1. Gửi một tin nhắn trong lúc reconnect hoặc ngay sau reconnect.
2. Xác nhận cùng một tin nhắn chỉ xuất hiện một lần trong thread.

## Kết quả mong đợi
- Tin nhắn mới đi qua kết nối realtime socket, không phụ thuộc REST per-message.
- Người nhận thấy tin nhắn mới trong thời gian gần như tức thì.
- Trạng thái kết nối được hiển thị rõ.
- Không có duplicate message trong cùng một phiên client.
- Input chat giữ chiều cao gọn khi nội dung ngắn.
