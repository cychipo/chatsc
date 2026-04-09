# chatsc Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-08

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
- TypeScript 5.x cho frontend và backend; C/GCC cho dịch vụ xử lý SHA1 từ xa hiện có + NestJS 10, Mongoose 8, Passport session, jsonwebtoken, React 18, Zustand 5, Axios 1.12, Ant Design 5, dịch vụ remote processor qua TCP đã có sẵn (009-local-auth)
- MongoDB cho user/auth attempt/refresh session; cookie HTTP-only cho refresh token; browser storage cho access token runtime (009-local-auth)
- TypeScript 5.x cho frontend và backend + NestJS 10, Mongoose 8, Socket.IO, React 18, Zustand 5, Axios 1.12, Ant Design 5 (010-message-presence-status)
- MongoDB cho conversation/participant/message; trạng thái tạm thời typing qua realtime layer; browser runtime state cho chat UI (010-message-presence-status)
- TypeScript 5.x cho frontend và backend + NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Axios 1.12, Ant Design 5, Lucide React, Vitest, React Testing Library (012-chat-ui-controls)
- MongoDB cho conversation/message persistence; browser runtime state cho sidebar toggle và search popup (012-chat-ui-controls)
- TypeScript 5.x cho frontend và backend + NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Axios 1.12, Ant Design 5, @aws-sdk/client-s3 (R2/S3-compatible), Vitest, React Testing Library (013-chat-file-upload)
- MongoDB cho file attachment metadata; Cloudflare R2 cho file binary; browser runtime state cho image viewer (013-chat-file-upload)
- TypeScript 5.x + NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Axios 1.12, Ant Design 5, Socket.IO, @google/generative-ai SDK (014-gemini-ai-chat)
- MongoDB (conversation/message schemas đã có, thêm AIConfig schema mới) (014-gemini-ai-chat)

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
- 014-gemini-ai-chat: Added TypeScript 5.x + NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Axios 1.12, Ant Design 5, Socket.IO, @google/generative-ai SDK
- 013-chat-file-upload: Added TypeScript 5.x cho frontend và backend + NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Axios 1.12, Ant Design 5, @aws-sdk/client-s3 (R2/S3-compatible), Vitest, React Testing Library
- 012-chat-ui-controls: Added TypeScript 5.x cho frontend và backend + NestJS 10, Mongoose 8, React 18, Vite 6, Zustand 5, Axios 1.12, Ant Design 5, Lucide React, Vitest, React Testing Library

