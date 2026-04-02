# Hệ thống chat Socket với Linux Kernel Module

## Quickstart

### Flow chat

1. chạy server trước
2. mở 2 terminal client riêng
3. mỗi client có menu:
   - `1) login`
   - `2) register`
   - `3) exit`
4. nếu chưa có tài khoản thì chọn `register`
5. sau khi login thành công, nhập username của người muốn chat
6. khi chat:
   - client chỉ hiển thị plaintext
   - server terminal log `from/to/plaintext/encrypted`

Password hashing và message transform đều đi qua `/dev/device`.

## Yêu cầu trên Ubuntu/VPS

Cài các gói cần thiết trên host:

```bash
sudo apt update
sudo apt install -y build-essential gcc make kmod linux-headers-$(uname -r) lsof
```

## Build

```bash
make app
make driver
```

## Load kernel module

```bash
sudo make load
```

Verify:

```bash
lsmod | grep chat_driver
dmesg | tail
ls -l /dev/device
```

## Chạy server và client

Server:

```bash
make server
```

Hoặc:

```bash
./build/server 9090 users.db
```

Client ở 2 terminal khác nhau:

```bash
make client
```

Hoặc:

```bash
./build/client 127.0.0.1 9090 /dev/device
```

## Trong giao diện client

- chọn `register` để tạo user mới
- chọn `login` để vào chat
- nhập ở `chat with username>` để chọn người nhận
- khi vào chat, client sẽ hiện một khối header rõ context hiện tại, ví dụ:
  - `[chat] user=<your-user>  peer=<target-user>`
  - `[tips] /switch để đổi người chat, /quit để thoát`
- nhập tin nhắn ở `message>` rồi Enter
- history chat được rút gọn để dễ quét mắt:
  - tin nhắn đến hiện dạng `<- username  nội dung`
  - tin nhắn gửi thành công hiện dạng `-> username  nội dung`
- gõ `/switch` để đổi người chat
- gõ `/quit` để thoát

## User store

- server dùng file text đơn giản `users.db`
- format mỗi dòng: `username:sha1hex`
- file được tạo/cập nhật ở phía server

## Unload kernel module

```bash
sudo make unload
```

## Troubleshooting nhanh

- nếu `make driver` fail, kiểm tra `/lib/modules/$(uname -r)/build` có tồn tại không
- nếu `make load` fail, kiểm tra quyền root và artifact `build/chat_driver.ko`
- nếu `/dev/device` chưa có, kiểm tra `dmesg | tail`
- nếu client báo không mở được device, đảm bảo module đã load trước khi login/chat

See:
- `driver/module/README.md`
- `app/client/README.md`
- `app/server/README.md`
- `docs/demo-runbook.md`
- `docs/troubleshooting.md`
