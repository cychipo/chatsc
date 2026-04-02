# Hệ thống chat Socket với Docker và Linux Kernel Module

## Quickstart

### Flow mới

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

## Chạy local trên máy host

1. `make app`
2. `./build/server 9090 users.db`
3. build và load driver
4. terminal 1: `./build/client 127.0.0.1 9090 /dev/device`
5. terminal 2: `./build/client 127.0.0.1 9090 /dev/device`
6. đăng ký / đăng nhập rồi chọn peer để chat

## Chạy bằng Docker

### User-space

1. `make docker-build`
2. `make docker-app`
3. `make docker-server`
4. ở 2 terminal khác nhau chạy `make docker-chat`

### Kernel module trên Docker Desktop/macOS

1. inspect metadata của Docker Desktop VM:
   - `make docker-driver-env-report`
2. chạy preflight:
   - `make docker-driver-check`
3. nếu build tree chưa sẵn có, thử dựng tree prepared từ metadata LinuxKit:
   - `make docker-driver-prepare`
4. build module:
   - `make docker-driver`
   - hoặc `make docker-driver KERNEL_BUILD_DIR=/path/to/prepared/kernel/tree`
5. load module:
   - `make docker-load`
6. nếu `docker-driver-check` hoặc `docker-driver-prepare` fail, nghĩa là Docker Desktop VM hiện tại thiếu input cần thiết; repo sẽ fail-fast thay vì build mù. `kheaders.tar.xz` chỉ là header bundle phụ trợ, không phải full prepared build tree

## Trong giao diện client

- `register` để tạo user mới
- `login` để vào chat
- nhập `chat with username>` để chọn người nhận
- gõ nội dung chat rồi Enter
- gõ `/switch` để đổi người chat
- gõ `/quit` để thoát

## User store

- server dùng file text đơn giản `users.db`
- format mỗi dòng: `username:sha1hex`
- file được tạo/cập nhật ở phía server

## Kernel module

1. `make docker-driver-env-report`
2. `make docker-driver-check`
3. `make docker-driver-prepare`
4. `make docker-driver` hoặc `make docker-driver KERNEL_BUILD_DIR=/path/to/prepared/kernel/tree`
5. `make docker-load`
6. chạy client với device thật: `./build/client 127.0.0.1 9090 /dev/device` hoặc `make docker-chat`
7. register/login rồi chat giữa 2 terminal client
8. `make docker-unload`

See:
- `docker/dev/README.md`
- `docker/runtime/README.md`
- `driver/module/README.md`
- `docs/demo-runbook.md`
- `docs/troubleshooting.md`
