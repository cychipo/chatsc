# Data Model: Chat File Upload

## Entities

### ChatAttachment

Represents a file that has been uploaded to R2 and associated with a conversation.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `_id` | ObjectId | Yes | Primary identifier |
| `conversationId` | ObjectId (ref Conversation) | Yes | Conversation this attachment belongs to |
| `messageId` | ObjectId (ref Message) | Yes | Message that contains this attachment |
| `uploaderId` | ObjectId (ref User) | Yes | User who uploaded the file |
| `r2Key` | string | Yes | R2 object key (path within bucket) |
| `originalName` | string | Yes | Original file name (e.g., "report.pdf") |
| `mimeType` | string | Yes | MIME type (e.g., "image/png", "application/pdf") |
| `sizeBytes` | number | Yes | File size in bytes |
| `isImage` | boolean | Yes | Whether the file is an image (image/* MIME) |
| `createdAt` | Date | Yes | Timestamp when attachment was recorded |

**Indexes**:
- `{ conversationId: 1, createdAt: -1 }` — list attachments by conversation
- `{ messageId: 1 }` — lookup by message
- `{ uploaderId: 1 }` — user's uploads (future use)

**Validation rules**:
- `sizeBytes` must be <= 25MB (26,214,400 bytes) — enforced at service layer before upload
- `originalName` must be non-empty string
- `r2Key` must follow pattern `attachments/{conversationId}/{attachmentId}/{sanitizedFileName}`
- `mimeType` must be a valid MIME type string

**State**: ChatAttachment is immutable after creation. No update operations.

---

### Message with Attachment (extended schema)

The existing `Message` schema is extended with an optional `attachment` field.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `attachment` | Object (embedded) | No | Attachment reference |
| `attachment.attachmentId` | ObjectId (ref ChatAttachment) | Yes (if attachment set) | Reference to ChatAttachment |
| `attachment.fileName` | string | Yes | Original file name |
| `attachment.mimeType` | string | Yes | MIME type |
| `attachment.sizeBytes` | number | Yes | File size |
| `attachment.isImage` | boolean | Yes | Whether file is an image |

---

### R2 Key Pattern

Format: `attachments/{conversationId}/{attachmentId}/{sanitizedOriginalName}`

Rules:
- `conversationId` — MongoDB ObjectId as hex string
- `attachmentId` — MongoDB ObjectId as hex string (generated before upload)
- `sanitizedOriginalName` — original name with non-alphanumeric characters replaced by `_`, spaces replaced by `_`, truncated to 128 chars max

Example: `attachments/507f1f77bcf86cd799439011/507f1f77bcf86cd799439012/report_final.pdf`

---

### Presigned URL Contracts

**Upload presigned URL** (backend → frontend response):
```typescript
{
  attachmentId: string    // MongoDB ObjectId string
  r2Key: string          // full R2 key path
  presignedUrl: string     // URL for PUT request, expires in 15 minutes
  expiresAt: string       // ISO timestamp
}
```

**Download presigned URL** (backend → frontend response):
```typescript
{
  presignedUrl: string    // URL for GET request, expires in 15 minutes
  expiresAt: string       // ISO timestamp
}
```

---

### Image Viewer State

Managed client-side in the chat page component. No persistence required.

| Field | Type | Description |
|-------|------|-------------|
| `isOpen` | boolean | Whether viewer is displayed |
| `attachmentId` | string | Currently viewed attachment |
| `presignedUrl` | string | Current download URL |
| `scale` | number | Current zoom level (default 1.0) |

Scale transitions: zoom in → scale += 0.25 (max 3.0), zoom out → scale -= 0.25 (min 0.5), reset → scale = 1.0.
