# Quickstart: Trạng thái gửi/xem và hiện diện chat

## Mục tiêu
Xác minh chat trực tiếp có thể nhận tin nhắn realtime, tự hiện lại đoạn chat ở người nhận, hiển thị unread count, cập nhật trạng thái đã gửi/đã xem và typing indicator.

## Ghi chú triển khai
- Presence metadata của feature này được chuẩn hoá quanh unread count, read marker và typing signal theo conversation direct.
- Hiện tại luồng realtime cơ bản đã hỗ trợ preview reorder theo `lastMessageAt`, phát `message_delivered` tới user room để direct chat có thể nổi lại ở sidebar, và unread badge được đồng bộ khi mở conversation.
- Message list hiện trả theo thứ tự tăng dần để frontend có thể render ổn định cụm outbound, trạng thái `Đã gửi`/`Đã xem`, và typing subtitle ở header cuộc trò chuyện.

## Chuẩn bị
1. Chạy backend và frontend như môi trường phát triển hiện tại.
2. Chuẩn bị hai tài khoản người dùng A và B có thể đăng nhập đồng thời.
3. Mở A và B ở hai trình duyệt hoặc hai profile độc lập.
4. Đảm bảo websocket chat đang kết nối thành công ở cả hai phía.

## Kịch bản 1: Tin nhắn mới đẩy đoạn chat lên đầu
1. Cho A và B đã có một direct chat sẵn.
2. Ở B, chọn một đoạn chat khác hoặc đang đứng ở danh sách chat.
3. Ở A, gửi một tin nhắn mới cho B.
4. Xác nhận:
   - B nhận được tin nhắn ngay mà không reload.
   - direct chat với A nhảy lên đầu danh sách chat của B.
   - direct chat với B cũng ở vị trí mới nhất phía A.

## Kịch bản 2: Tự hiện lại đoạn chat khi B đã xoá hoặc chưa có
1. Đảm bảo direct chat giữa A và B không còn hiển thị trong danh sách của B.
2. Ở A, gửi tin nhắn cho B.
3. Xác nhận ở B:
   - conversation được tạo lại hoặc hiện lại tự động,
   - không xuất hiện hai direct chat trùng nhau với A,
   - conversation mới hiện nằm ở đầu danh sách chat.

## Kịch bản 3: Unread count tăng khi chưa mở chat
1. Để B không mở direct chat với A.
2. Cho A gửi liên tiếp 2-3 tin nhắn.
3. Xác nhận ở danh sách chat của B:
   - conversation với A hiển thị số tin chưa đọc đúng,
   - preview và thời gian hoạt động cuối được cập nhật theo tin mới nhất.

## Kịch bản 4: Bấm vào conversation thì mới đọc
1. Từ trạng thái có unread count, cho B bấm mở conversation với A.
2. Xác nhận:
   - thread được tải đúng,
   - unread count được xoá hoặc cập nhật về giá trị đúng ngay sau khi mở,
   - reload lại trang vẫn không xuất hiện unread count cũ sai lệch,
   - phía A nhận được cập nhật để trạng thái outbound gần nhất có thể chuyển sang `Đã xem`.

## Kịch bản 5: Trạng thái đã gửi / đã xem
1. Cho A gửi một tin nhắn đơn, sau đó gửi tiếp một cụm 2-3 tin liên tiếp.
2. Trước khi B mở conversation, xác nhận dưới cụm outbound gần nhất của A hiển thị trạng thái muted tương đương `Đã gửi`.
3. Cho B mở conversation và xem thread.
4. Xác nhận ở phía A trạng thái của cụm liên quan chuyển sang `Đã xem`.

## Kịch bản 6: Typing indicator
1. Mở cùng một conversation ở A và B.
2. Tại B, bắt đầu nhập nội dung nhưng chưa gửi.
3. Xác nhận ở A xuất hiện animation đang soạn tin.
4. Cho B dừng nhập hoặc gửi tin.
5. Xác nhận indicator ở A tự biến mất đúng lúc.
6. Nếu B dừng nhập mà không gửi, chờ hết hạn realtime và xác nhận indicator cũng tự biến mất.

## Kịch bản 7: Offline rồi quay lại
1. Ngắt kết nối hoặc đóng tab của B.
2. Để A gửi nhiều tin nhắn mới cho B.
3. Mở lại B.
4. Xác nhận:
   - danh sách chat ban đầu của B vẫn hiển thị conversation với A ở vị trí phù hợp,
   - unread count phản ánh đúng số tin mới,
   - khi mở conversation thì unread count được cập nhật đúng.

## Checklist xác nhận nhanh
- [ ] Conversation có tin mới nhảy lên đầu danh sách chat.
- [ ] Người nhận online nhận được message realtime không cần reload.
- [ ] Direct chat được hiện lại hoặc tạo lại đúng khi người nhận đã xoá/ẩn trước đó.
- [ ] Không tạo conversation direct trùng nhau.
- [ ] Unread count tăng đúng khi chưa mở conversation.
- [ ] Chỉ khi mở conversation thì unread count mới được xoá/cập nhật.
- [ ] Cụm tin outbound gần nhất hiển thị trạng thái đã gửi/đã xem đúng.
- [ ] Typing indicator xuất hiện và biến mất đúng ngữ cảnh.
- [ ] Trạng thái vẫn đúng sau khi reload hoặc sau khi người nhận quay lại online.
