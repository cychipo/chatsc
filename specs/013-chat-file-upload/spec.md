# Đặc tả tính năng: Gửi file trong chat

**Nhánh feature**: `013-chat-file-upload`
**Ngày tạo**: 2026-04-08
**Trạng thái**: Bản nháp
**Mô tả gốc**: "bạn tạo cho tôi spec cho phần gửi file khi chat nhé, người dùng có thể gửi bất cứ file nào, không thể gửi folder, giới hạn file 25mb, file gửi lên sẽ lưu ở cloudflare r2, nếu là ảnh thì ở ui có thể hiện ảnh luôn, còn file thì chỉ hiện card kèm nút download để người dùng tải về được, nếu ảnh bấm vào xem được, có các nút phóng to, thu nhỏ, reset, download ( toàn bộ các nút là icon), bạn có thể dùng component của antd nếu có"

## Kịch bản người dùng & Kiểm thử *(bắt buộc)*

### Câu chuyện người dùng 1 - Gửi và hiển thị ảnh trong chat (Ưu tiên: P1)

Là người dùng chat, tôi muốn upload và gửi file ảnh để có thể chia sẻ nội dung hình ảnh với những người tham gia trong cuộc trò chuyện.

**Tại sao ưu tiên này**: Chia sẻ ảnh là trường hợp gửi file phổ biến nhất trong ứng dụng chat và trực tiếp nâng cao giao tiếp giữa người dùng.

**Kiểm thử độc lập**: Có thể kiểm thử bằng cách mở một cuộc trò chuyện, chọn file ảnh dưới 25MB, xác nhận ảnh hiển thị trong luồng tin nhắn, và xác nhận ảnh có thể mở trong trình xem ảnh với các điều khiển phóng to và tải về.

**Kịch bản chấp nhận**:

1. **Cho** người dùng đang ở trong một cuộc trò chuyện, **Khi** người dùng chọn file ảnh (JPEG, PNG, GIF, WebP, v.v.) dưới 25MB, **Thì** ảnh hiển thị trong luồng tin nhắn dưới dạng xem trước.
2. **Cho** người dùng đang ở trong một cuộc trò chuyện, **Khi** người dùng chọn một thư mục hoặc file vượt quá 25MB, **Thì** hệ thống hiển thị lỗi rõ ràng và file không được upload.
3. **Cho** ảnh được hiển thị trong luồng chat, **Khi** người dùng bấm vào ảnh, **Thì** trình xem ảnh mở ra với các nút điều khiển phóng to, thu nhỏ, reset, và tải về.
4. **Cho** trình xem ảnh đang mở, **Khi** người dùng bấm nút tải về, **Thì** ảnh gốc được tải về thiết bị của người dùng.
5. **Cho** trình xem ảnh đang mở, **Khi** người dùng đóng nó, **Thì** trình xem ảnh đóng lại và luồng tin nhắn vẫn hiển thị.

---

### Câu chuyện người dùng 2 - Gửi file không phải ảnh (Ưu tiên: P2)

Là người dùng chat, tôi muốn upload và gửi tài liệu, PDF hoặc các loại file khác không phải ảnh để có thể chia sẻ mọi loại nội dung với những người tham gia.

**Tại sao ưu tiên này**: Hỗ trợ gửi mọi loại file mở rộng khả năng cộng tác, nhưng tính năng này phụ thuộc vào luồng gửi ảnh đã hoạt động.

**Kiểm thử độc lập**: Có thể kiểm thử bằng cách mở một cuộc trò chuyện, chọn file không phải ảnh dưới 25MB, xác nhận nó hiển thị dưới dạng card file kèm nút tải về, và xác nhận file có thể tải về.

**Kịch bản chấp nhận**:

1. **Cho** người dùng đang ở trong một cuộc trò chuyện, **Khi** người dùng chọn file không phải ảnh (PDF, tài liệu, file nén, v.v.) dưới 25MB, **Thì** tin nhắn hiển thị trong luồng dưới dạng card file gồm tên file, loại file và kích thước.
2. **Cho** card file được hiển thị trong luồng chat, **Khi** người dùng bấm nút tải về trên card đó, **Thì** file được tải về thiết bị của người dùng.
3. **Cho** người dùng đang ở trong một cuộc trò chuyện, **Khi** người dùng chọn file vượt quá 25MB, **Thì** hệ thống hiển thị lỗi giới hạn kích thước và upload không tiếp tục.

---

### Câu chuyện người dùng 3 - Tải về các file đã chia sẻ (Ưu tiên: P3)

Là người dùng chat, tôi muốn tải về các file đã được chia sẻ trong cuộc trò chuyện trước đó để có thể truy cập nội dung ngay cả sau một thời gian.

**Tại sao ưu tiên này**: Tải lại file đã chia sẻ là hành động phổ biến nhưng phụ thuộc vào việc hiển thị file và upload đã hoạt động.

**Kiểm thử độc lập**: Có thể kiểm thử bằng cách mở cuộc trò chuyện đã có tin nhắn chứa file, bấm nút tải về trên card file, và xác nhận file được lưu vào thiết bị.

**Kịch bản chấp nhận**:

1. **Cho** cuộc trò chuyện chứa tin nhắn có card file, **Khi** người dùng bấm nút tải về trên card đó, **Thì** file được lấy từ bộ nhớ và lưu vào thiết bị của người dùng.
2. **Cho** cuộc trò chuyện chứa tin nhắn ảnh, **Khi** người dùng bấm nút tải về trong trình xem ảnh, **Thì** ảnh gốc được tải về thiết bị của người dùng.

---

### Các trường hợp biên

- Nếu người dùng kéo và thả một thư mục vào vùng soạn tin nhắn, hệ thống phải từ chối với thông báo lỗi rõ ràng.
- Nếu người dùng chọn nhiều file cùng lúc, hệ thống phải xử lý từng file riêng lẻ hoặc hiển thị thông báo phù hợp.
- Nếu upload đang tiến hành mà người dùng rời khỏi cuộc trò chuyện, hệ thống nên hủy upload để tránh file bị treo.
- Nếu bộ nhớ file tạm thời không khả dụng, hệ thống phải hiển thị lỗi thân thiện và cho phép thử lại.
- Nếu tên file quá dài, card file phải cắt ngắn hoặc xuống dòng mà không làm hỏng bố cục.
- Nếu file ảnh đã upload bị hỏng hoặc không thể xem, hệ thống phải hiển thị ảnh placeholder kèm tên file thay vì ảnh lỗi.

## Yêu cầu *(bắt buộc)*

### Yêu cầu chức năng

- **FR-001**: Hệ thống PHẢI cho phép người dùng đã xác thực chọn bất kỳ loại file nào để upload trong cuộc trò chuyện chat.
- **FR-002**: Hệ thống PHẢI từ chối việc chọn thư mục và hiển thị thông báo lỗi rõ ràng.
- **FR-003**: Hệ thống PHẢI từ chối các file vượt quá 25MB và hiển thị lỗi giới hạn kích thước trước khi bắt đầu upload.
- **FR-004**: Hệ thống PHẢI upload các file đã chọn lên Cloudflare R2 và liên kết chúng với cuộc trò chuyện nơi file được gửi.
- **FR-005**: Hệ thống PHẢI hiển thị file ảnh (JPEG, PNG, GIF, WebP, SVG) trực tiếp trong luồng tin nhắn dưới dạng xem trước ảnh.
- **FR-006**: Hệ thống PHẢI hiển thị các file không phải ảnh dưới dạng card file gồm tên file, biểu tượng hoặc phần mở rộng loại file, kích thước file, và nút tải về.
- **FR-007**: Hệ thống PHẢI mở trình xem ảnh khi người dùng bấm vào ảnh, hiển thị các nút phóng to, thu nhỏ, reset, và tải về dưới dạng biểu tượng.
- **FR-008**: Hệ thống PHẢI cho phép người dùng tải về bất kỳ file đã chia sẻ nào từ cuộc trò chuyện vào bất kỳ lúc nào.
- **FR-009**: Hệ thống PHẢI bao gồm các key cấu hình R2 trong file template biến môi trường backend để có thể thiết lập trước khi deploy.
- **FR-010**: Hệ thống PHẢI đảm bảo chỉ những người tham gia đang hoạt động của cuộc trò chuyện mới có thể upload và xem file của cuộc trò chuyện đó.

### Các thực thể chính

- **File đính kèm**: Đại diện cho một file đã upload lên cuộc trò chuyện, bao gồm vị trí lưu trữ (R2 key/URL), tên file gốc, loại MIME, kích thước file tính bằng byte, và danh tính người upload.
- **Tin nhắn kèm file**: Đại diện cho một tin nhắn chat chứa tham chiếu file đính kèm, liên kết file với cuộc trò chuyện và người gửi.
- **Trạng thái trình xem file**: Đại diện cho trạng thái mở/đóng và mức zoom hiện tại của trình xem ảnh.

## Tiêu chí thành công *(bắt buộc)*

### Kết quả đo lường được

- **SC-001**: Người dùng có thể upload thành công một file ảnh dưới 25MB và thấy nó xuất hiện trong luồng chat trong vòng 5 giây sau khi chọn.
- **SC-002**: Người dùng có thể upload thành công một file không phải ảnh dưới 25MB và thấy card file kèm nút tải về hoạt động.
- **SC-003**: Khi một file vượt quá 25MB được chọn, hệ thống hiển thị lỗi trước khi bất kỳ upload nào bắt đầu trong 100% trường hợp.
- **SC-004**: Khi một thư mục được chọn, hệ thống từ chối với thông báo lỗi trong 100% trường hợp.
- **SC-005**: 100% các file ảnh đã upload có thể xem qua trình xem ảnh với đầy đủ bốn điều khiển (phóng to, thu nhỏ, reset, tải về).
- **SC-006**: Các key cấu hình R2 được ghi chú trong file template biến môi trường backend và được tham chiếu trong tài liệu deploy để upload trên production hoạt động đúng.

## Các giả định

- Người dùng có kết nối internet ổn định đủ để upload các file lên đến 25MB trong thời gian hợp lý.
- Các bucket R2 được cấu hình với CORS và quyền truy cập URL công khai hoặc presigned phù hợp để lấy file.
- Thông tin xác thực R2 (access key, secret key, account ID, bucket name) do người dùng cung cấp và thêm vào cấu hình biến môi trường backend trước khi deploy.
- Cơ sở hạ tầng tin nhắn chat hiện có (giao hàng realtime, lịch sử tin nhắn, kiểm tra người tham gia) sẽ được mở rộng để hỗ trợ tin nhắn kèm file đính kèm.
- Việc tải file sử dụng URL R2 presigned hoặc công khai; không có xử lý hoặc chuyển đổi file nào được thực hiện trên server.
- Component Image có sẵn của Ant Design sẽ được sử dụng cho trình xem ảnh để tận dụng chức năng phóng to/điều khiển đã có.
- Siêu dữ liệu file (tên, loại, kích thước, R2 key, người upload, cuộc trò chuyện) được lưu trong MongoDB để hỗ trợ lịch sử tin nhắn và truy cập tải về.
