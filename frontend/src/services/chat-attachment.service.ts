import axios from 'axios'
import type { AuthRequestConfig } from './http'
import { http } from './http'
import type { ChatAttachment, Message } from '../types/chat'

type ApiResponse<T> = {
  success: true
  data: T
}

type PresignedUploadResponse = {
  attachmentId: string
  r2Key: string
  presignedUrl: string
  expiresAt: string
}

type DownloadUrlResponse = {
  presignedUrl: string
  expiresAt: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

type ConversationAttachmentsResponse = {
  attachments: Array<ChatAttachment & { createdAt: string }>
  hasMore: boolean
}

type AttachmentStatusResponse = {
  attachmentId: string
  status: 'draft' | 'uploaded' | 'attached'
  messageId?: string
  uploadedAt?: string
  confirmedAt?: string
}

function unwrap<T>(response: ApiResponse<T>) {
  return response.data
}

export async function getPresignedUploadUrl(input: {
  conversationId: string
  fileName: string
  mimeType: string
  sizeBytes: number
}) {
  const { data } = await http.post<ApiResponse<PresignedUploadResponse>>('/chat/attachments/presigned-upload', input)
  return unwrap(data)
}

export type AttachmentUploadError = Error & {
  detailMessage?: string
  statusCode?: number
}

export async function uploadFileToPresignedUrl(
  presignedUrl: string,
  file: File,
  signal?: AbortSignal,
  onProgress?: (progress: number) => void,
) {
  const config: AuthRequestConfig = {
    signal,
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    withCredentials: false,
    skipAuthRefresh: true,
    baseURL: '',
    onUploadProgress: (event) => {
      if (!event.total || !onProgress) {
        return
      }

      onProgress(Math.min(100, Math.round((event.loaded / event.total) * 100)))
    },
  }

  try {
    await http.put(presignedUrl, file, config)
  } catch (error) {
    throw await buildAttachmentUploadError(error)
  }
}

async function buildAttachmentUploadError(error: unknown): Promise<AttachmentUploadError> {
  if (!axios.isAxiosError(error)) {
    const fallback = new Error('Không thể upload tệp.') as AttachmentUploadError
    fallback.detailMessage = 'Không nhận được phản hồi hợp lệ từ dịch vụ upload.'
    return fallback
  }

  const statusCode = error.response?.status
  const contentType = String(error.response?.headers?.['content-type'] ?? '')
  let detailMessage = ''

  if (typeof error.response?.data === 'string') {
    detailMessage = extractUploadErrorMessage(error.response.data, contentType)
  } else if (error.message === 'Network Error') {
    detailMessage = 'Trình duyệt không thể kết nối tới R2. Hãy kiểm tra CORS bucket, presigned URL còn hạn, và mạng.'
  } else if (statusCode) {
    detailMessage = `Dịch vụ upload trả về lỗi HTTP ${statusCode}.`
  } else {
    detailMessage = error.message || 'Upload thất bại.'
  }

  const uploadError = new Error('Không thể upload tệp.') as AttachmentUploadError
  uploadError.detailMessage = detailMessage
  uploadError.statusCode = statusCode
  return uploadError
}

function extractUploadErrorMessage(payload: string, contentType: string) {
  const trimmed = payload.trim()

  if (!trimmed) {
    return 'Dịch vụ upload không trả về nội dung lỗi.'
  }

  if (contentType.includes('xml') || trimmed.startsWith('<?xml') || trimmed.startsWith('<Error>')) {
    const codeMatch = trimmed.match(/<Code>(.*?)<\/Code>/)
    const messageMatch = trimmed.match(/<Message>(.*?)<\/Message>/)
    const requestIdMatch = trimmed.match(/<RequestId>(.*?)<\/RequestId>/)
    const code = codeMatch?.[1]?.trim()
    const message = messageMatch?.[1]?.trim()
    const requestId = requestIdMatch?.[1]?.trim()

    const segments = [
      code ? `R2 code: ${code}.` : '',
      message ? `Message: ${message}.` : '',
      requestId ? `Request ID: ${requestId}.` : '',
    ].filter(Boolean)

    return segments.join(' ') || 'R2 trả về lỗi XML nhưng không đọc được nội dung chi tiết.'
  }

  return trimmed.length > 300 ? `${trimmed.slice(0, 300)}…` : trimmed
}

export async function markAttachmentUploaded(conversationId: string, attachmentId: string) {
  const { data } = await http.post<ApiResponse<ChatAttachment>>(
    `/chat/conversations/${conversationId}/attachments/uploaded`,
    { attachmentId },
  )
  return unwrap(data)
}

export async function confirmAttachment(conversationId: string, attachmentId: string) {
  const { data } = await http.post<ApiResponse<{ message: Message }>>(
    `/chat/conversations/${conversationId}/attachments`,
    { attachmentId },
  )
  return unwrap(data)
}

export async function getAttachmentStatus(attachmentId: string) {
  const { data } = await http.get<ApiResponse<AttachmentStatusResponse>>(`/chat/attachments/${attachmentId}/status`)
  return unwrap(data)
}

export async function getPresignedDownloadUrl(attachmentId: string) {
  const { data } = await http.get<ApiResponse<DownloadUrlResponse>>(`/chat/attachments/${attachmentId}/download`)
  return unwrap(data)
}

export async function listConversationAttachments(conversationId: string, params?: { before?: string; limit?: number }) {
  const { data } = await http.get<ApiResponse<ConversationAttachmentsResponse>>(
    `/chat/conversations/${conversationId}/attachments`,
    { params },
  )
  return unwrap(data)
}

export async function triggerBrowserDownload(presignedUrl: string, fileName: string) {
  const anchor = document.createElement('a')
  anchor.href = presignedUrl
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}
