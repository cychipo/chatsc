# Implementation Plan: Hệ thống chat Socket với Linux Kernel Module

**Branch**: `001-socket-chat-kmod` | **Date**: 2026-04-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-socket-chat-kmod/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Xây dựng một hệ thống chat demo trong đó client/server chạy trực tiếp trên host Ubuntu/Linux, còn driver chạy trong host kernel để xử lý message qua device node và trả kết quả về lại client. Kế hoạch triển khai ưu tiên theo lớp: chuẩn hóa môi trường phát triển và build trên host, thiết kế vòng đời module và device interaction, sau đó tích hợp socket chat và hoàn thiện quan sát/tài liệu vận hành.

## Technical Context

**Language/Version**: C cho client, server và kernel module; môi trường phát triển Ubuntu/Linux host  
**Primary Dependencies**: GNU build tools, Linux kernel headers/module toolchain  
**Storage**: N/A  
**Testing**: build verification, smoke tests, end-to-end demo tests, manual integration validation  
**Target Platform**: Ubuntu host hoặc VPS Ubuntu với ứng dụng và module chạy trực tiếp trên host  
**Project Type**: systems programming demo / native Linux client-server application with kernel integration  
**Performance Goals**: hoàn thành demo end-to-end trong không quá 5 phút; kết quả xử lý lặp lại nhất quán cho cùng input  
**Constraints**: phải chứng minh luồng `Client -> /dev/device -> Driver -> Client`; phụ thuộc quyền truy cập host kernel; ưu tiên local/VPS demo hơn production hardening  
**Scale/Scope**: 1 host Ubuntu, 1 server, 1 hoặc ít client đồng thời, tập message mẫu phục vụ demo và kiểm thử chấp nhận

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Hiện không có constitution khả dụng ở dạng nội dung thực thi; file constitution hiện chỉ là template placeholder. Vì vậy không có gate bắt buộc cụ thể nào để chặn kế hoạch này.

## Project Structure

### Documentation (this feature)

```text
specs/001-socket-chat-kmod/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── system-interfaces.md
└── tasks.md
```

### Source Code (repository root)

```text
.specify/
.claude/
specs/
user_stories.md
app/
├── client/
└── server/
driver/
└── module/
tests/
├── integration/
└── e2e/
```

**Structure Decision**: Repo dùng single repository với ba vùng chính: `app/` cho client/server user-space, `driver/` cho kernel module, `tests/` cho smoke/integration/e2e. Điều này phù hợp với ranh giới trách nhiệm giữa user-space và kernel-space trên host Linux.

## Phase 0: Research Outputs

- [research.md](./research.md) hoàn tất, đã chốt các quyết định chính về host-native build/runtime, quy trình load module, device node, phạm vi xử lý dữ liệu và thứ tự ưu tiên tích hợp.
- Không còn mục `NEEDS CLARIFICATION` cần mở thêm trước khi sang Phase 1.

## Phase 1: Design Outputs

- [data-model.md](./data-model.md) mô tả các entity logic: Chat Message, Client Session, Device Request, Driver Processing Result, Module Lifecycle Event.
- [contracts/system-interfaces.md](./contracts/system-interfaces.md) xác định contract hành vi cho môi trường phát triển, vòng đời module, device interaction, driver processing, chat session và observability.
- [quickstart.md](./quickstart.md) mô tả luồng dựng môi trường, smoke tests và demo end-to-end.

## Implementation Approach

1. Thiết lập môi trường build Ubuntu host với đủ build tools và kernel headers.
2. Tạo skeleton cho client/server user-space và quy trình build nhất quán.
3. Tạo skeleton cho kernel module và workflow build artifact `.ko` tương thích host kernel.
4. Thiết kế workflow load/unload module trực tiếp trên host Linux.
5. Thiết kế device interaction contract và vòng đời request/response một-một.
6. Tích hợp socket flow giữa client/server sau khi device-driver loop hoạt động ổn định.
7. Hoàn thiện logging, smoke tests, e2e demo, và tài liệu quickstart.

## Complexity Tracking

Không có vi phạm constitution cần biện minh ở thời điểm này.
