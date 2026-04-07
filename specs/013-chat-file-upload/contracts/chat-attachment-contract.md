# Contract: Chat File Attachment

## 1. Presigned Upload URL Contract

### Purpose
Returns a presigned PUT URL allowing the client to upload a file directly to Cloudflare R2.

### Request
`POST /chat/attachments/presigned-upload`
```json
{
  "conversationId": "string (MongoDB ObjectId)",
  "fileName": "string",
  "mimeType": "string",
  "sizeBytes": "number"
}
```

### Rules
- Requester must be an active participant of `conversationId`.
- `sizeBytes` must be > 0 and <= 25,214,400 (25MB). Reject otherwise.
- `mimeType` must be a non-empty string.
- `fileName` must be a non-empty string; will be sanitized for R2 key.
- An `ChatAttachment` record is created in MongoDB **before** the response is returned, with status pending or the R2 key pre-allocated.

### Response (200)
```json
{
  "success": true,
  "data": {
    "attachmentId": "string (MongoDB ObjectId)",
    "r2Key": "string",
    "presignedUrl": "string (full R2 presigned PUT URL)",
    "expiresAt": "string (ISO 8601)"
  }
}
```

### Errors
- `400`: Invalid fileName, mimeType, sizeBytes out of range.
- `403`: User is not an active participant.
- `404`: Conversation not found.
- `500`: R2 or credential error.

---

## 2. Confirm Attachment Contract

### Purpose
Confirms that a file was successfully uploaded to R2 so the message can be created and the attachment record is finalized.

### Request
`POST /chat/conversations/:conversationId/attachments`
```json
{
  "attachmentId": "string (MongoDB ObjectId)"
}
```

### Rules
- `attachmentId` must refer to a pending ChatAttachment owned by the requester.
- This endpoint creates the message with the attachment reference and marks the ChatAttachment as confirmed.
- The message is delivered via the existing realtime channel.

### Response (201)
```json
{
  "success": true,
  "data": {
    "message": {
      "messageId": "string",
      "conversationId": "string",
      "senderId": "string",
      "attachment": {
        "attachmentId": "string",
        "fileName": "string",
        "mimeType": "string",
        "sizeBytes": "number",
        "isImage": "boolean"
      },
      "sentAt": "string (ISO 8601)"
    }
  }
}
```

### Errors
- `400`: Missing attachmentId.
- `403`: Attachment does not belong to this user.
- `404`: Attachment not found.

---

## 3. Presigned Download URL Contract

### Purpose
Returns a presigned GET URL so the client can download a file directly from R2.

### Request
`GET /chat/attachments/:attachmentId/download`

### Rules
- Requester must be an active participant of the conversation that owns this attachment.
- Backend generates a presigned GET URL with 15-minute expiry and returns it.
- Alternatively, the endpoint can issue a `302` redirect to the presigned URL.

### Response (200)
```json
{
  "success": true,
  "data": {
    "presignedUrl": "string",
    "expiresAt": "string (ISO 8601)",
    "fileName": "string",
    "mimeType": "string",
    "sizeBytes": "number"
  }
}
```

### Errors
- `403`: User is not a participant.
- `404`: Attachment not found.

---

## 4. List Conversation Attachments Contract

### Purpose
Returns attachment metadata for all files shared in a conversation (for history).

### Request
`GET /chat/conversations/:conversationId/attachments`

### Query Parameters
- `before`: ISO timestamp cursor for pagination (optional)
- `limit`: Number of results (default 20, max 50)

### Rules
- Requester must be an active participant of the conversation.
- Returns attachments ordered by `createdAt` descending.

### Response (200)
```json
{
  "success": true,
  "data": {
    "attachments": [
      {
        "attachmentId": "string",
        "conversationId": "string",
        "uploaderId": "string",
        "fileName": "string",
        "mimeType": "string",
        "sizeBytes": "number",
        "isImage": "boolean",
        "createdAt": "string (ISO 8601)"
      }
    ],
    "hasMore": "boolean"
  }
}
```

---

## 5. Message with Attachment Payload (Realtime / History)

When an attachment is confirmed, the message delivered via realtime or returned by history includes:

```typescript
{
  messageId: string
  conversationId: string
  senderId: string
  sentAt: string  // ISO 8601
  attachment: {
    attachmentId: string
    fileName: string
    mimeType: string
    sizeBytes: number
    isImage: boolean
  }
}
```

No `presignedUrl` is included in the realtime/history payload. Clients request the download URL on demand via contract #3.

---

## 6. Image Viewer Controls Contract

The image viewer is a pure frontend concern. Required controls:
- **Zoom in**: Increase display scale by 0.25, max 3.0.
- **Zoom out**: Decrease display scale by 0.25, min 0.5.
- **Reset**: Return to scale 1.0.
- **Download**: Call contract #3 to get a fresh presigned URL and trigger browser download.

Viewer must support mouse wheel zoom (optional enhancement) and close on Escape key or backdrop click.
