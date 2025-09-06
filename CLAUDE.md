# chatsc Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-05

## Active Technologies
- TypeScript cho cả frontend và backend; Node.js LTS cho môi trường phát triển + NestJS, MongoDB, Mongoose, React, Vite, Ant Design, Zustand, Axios 1.12, Lucide, Yarn (004-chat-groups)
- MongoDB (004-chat-groups)
- TypeScript 5.x cho frontend và backend + NestJS 10, Mongoose 8, Passport, React 18, Zustand 5, Axios 1.12 (005-refresh-token)
- MongoDB cho backend persistence; client-side browser storage cho access token runtime; cookie HTTP-only cho refresh token (005-refresh-token)
- TypeScript 5.x (frontend + backend), Node.js LTS + NestJS 10, Mongoose 8, React 18, Zustand 5, Axios 1.12, Ant Design 5 (003-chat-groups)
- MongoDB (conversation, participant, message, membership-event) (003-chat-groups)
- TypeScript 5.x cho frontend và backend + NestJS 10, Mongoose 8, React 18, Zustand 5, Axios 1.12, cơ chế realtime phù hợp với NestJS cho WebSocket transpor (006-socket-chat)
- MongoDB cho conversation/message persistence; không cần storage mới cho live delivery (006-socket-chat)
- C with GCC on Linux for the processing daemon and existing C client/server binaries + POSIX sockets, pthreads, the existing shared protocol structs, the existing device access flow, Linux kernel character device access (007-remote-encryption-service)
- N/A for the processing daemon; existing file-backed user database remains unchanged (007-remote-encryption-service)
- TypeScript 5.x cho backend và frontend; C/GCC cho dịch vụ xử lý từ xa hiện có + NestJS 10, Mongoose 8, React 18, Zustand 5, Axios 1.12, Socket.IO, dịch vụ xử lý từ xa qua TCP đã có sẵn (008-reverse-kernel-encryption)

- C cho client, server và kernel module; môi trường phát triển Ubuntu/Linux host, GNU build tools, Linux kernel module toolchain (001-socket-chat-kmod)

## Project Structure

```text
src/
tests/
```

## Commands

# Add commands for C cho client, server và kernel module; môi trường phát triển Ubuntu/Linux host

## Code Style

C cho client, server và kernel module; môi trường phát triển Ubuntu/Linux host: Follow standard conventions

## Recent Changes
- 008-reverse-kernel-encryption: Added TypeScript 5.x cho backend và frontend; C/GCC cho dịch vụ xử lý từ xa hiện có + NestJS 10, Mongoose 8, React 18, Zustand 5, Axios 1.12, Socket.IO, dịch vụ xử lý từ xa qua TCP đã có sẵn
- 007-remote-encryption-service: Added C with GCC on Linux for the processing daemon and existing C client/server binaries + POSIX sockets, pthreads, the existing shared protocol structs, the existing device access flow, Linux kernel character device access
- 006-socket-chat: Added TypeScript 5.x cho frontend và backend + NestJS 10, Mongoose 8, React 18, Zustand 5, Axios 1.12, cơ chế realtime phù hợp với NestJS cho WebSocket transpor

