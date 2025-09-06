import { Injectable } from '@nestjs/common'
import { backendEnv } from '../../config/env.config'
import { ChatProcessingError } from './utils/chat-error.util'
import { Socket } from 'node:net'

const CHAT_REQUEST_SIZE = 1164
const CHAT_RESPONSE_SIZE = 588
const CHAT_MAX_USERNAME = 32
const CHAT_MAX_PASSWORD = 64
const CHAT_MAX_MESSAGE = 512
const CHAT_MAX_RESULT = 512

const REQUEST_CHAT_MESSAGE = 2
const PROCESS_SUBSTITUTION = 1
const PROCESS_SUBSTITUTION_DECRYPT = 3
const RESPONSE_ACK = 1
const STATUS_OK = 0

type ReverseEncryptionState = 'legacy' | 'encrypted' | 'decode_failed'

type RemoteResponse = {
  messageId: number
  responseType: number
  status: number
  payload: string
}

@Injectable()
export class ChatEncryptionService {
  private nextMessageId = 1

  isEnabled() {
    return backendEnv().CHAT_REVERSE_ENCRYPTION_ENABLED
  }

  async encryptForStorage(content: string, context: { senderId: string; conversationId: string }) {
    if (!this.isEnabled()) {
      return {
        content,
        reverseEncryptionState: 'legacy' as ReverseEncryptionState,
        decodeErrorCode: undefined as string | undefined,
      }
    }

    const payload = await this.processRemote(
      PROCESS_SUBSTITUTION,
      content,
      context,
      'REVERSE_ENCRYPTION_UNAVAILABLE',
      'Không thể mã hoá ngược tin nhắn để lưu trữ',
    )

    return {
      content: payload,
      reverseEncryptionState: 'encrypted' as ReverseEncryptionState,
      decodeErrorCode: undefined as string | undefined,
    }
  }

  async decryptForDisplay(
    content: string,
    reverseEncryptionState: ReverseEncryptionState | undefined,
    context: { senderId: string; conversationId: string },
  ) {
    if (reverseEncryptionState !== 'encrypted') {
      return {
        content,
        displayState: 'ready' as const,
        decodeErrorCode: undefined as string | undefined,
      }
    }

    const payload = await this.processRemote(
      PROCESS_SUBSTITUTION_DECRYPT,
      content,
      context,
      'REVERSE_DECRYPTION_UNAVAILABLE',
      'Không thể khôi phục nội dung tin nhắn để hiển thị',
    )

    return {
      content: payload,
      displayState: 'ready' as const,
      decodeErrorCode: undefined as string | undefined,
    }
  }

  private async processRemote(
    mode: number,
    content: string,
    context: { senderId: string; conversationId: string },
    failureCode: string,
    failureMessage: string,
  ) {
    const env = backendEnv()

    if (!env.PROCESSOR_REMOTE_HOST) {
      throw new ChatProcessingError('REVERSE_ENCRYPTION_CONFIG_MISSING', 'Thiếu cấu hình host của remote processor dùng chung')
    }

    if (env.PROCESSOR_REMOTE_PORT <= 0) {
      throw new ChatProcessingError('REVERSE_ENCRYPTION_CONFIG_INVALID', 'Cấu hình cổng remote processor dùng chung không hợp lệ')
    }

    const request = this.buildRequest(mode, content, context)
    const response = await this.exchange(request, env.PROCESSOR_REMOTE_HOST, env.PROCESSOR_REMOTE_PORT, env.PROCESSOR_REMOTE_TIMEOUT_MS)

    if (response.status !== STATUS_OK) {
      throw new ChatProcessingError(failureCode, `${failureMessage}: ${response.payload || 'processor-error'}`)
    }

    return response.payload
  }

  private buildRequest(mode: number, content: string, context: { senderId: string; conversationId: string }) {
    const buffer = Buffer.alloc(CHAT_REQUEST_SIZE)
    const messageId = this.nextId()

    buffer.writeUInt32LE(messageId, 0)
    buffer.writeUInt32LE(REQUEST_CHAT_MESSAGE, 4)
    buffer.writeUInt32LE(mode, 8)
    this.writeCString(buffer, 12, CHAT_MAX_USERNAME, context.senderId)
    this.writeCString(buffer, 12 + CHAT_MAX_USERNAME, CHAT_MAX_USERNAME, context.conversationId)
    this.writeCString(buffer, 12 + CHAT_MAX_USERNAME + CHAT_MAX_USERNAME + CHAT_MAX_PASSWORD, CHAT_MAX_MESSAGE, content)

    return buffer
  }

  private exchange(request: Buffer, host: string, port: number, timeoutMs: number) {
    return new Promise<RemoteResponse>((resolve, reject) => {
      const socket = new Socket()
      const chunks: Buffer[] = []
      let received = 0
      let settled = false

      const cleanup = () => {
        socket.removeAllListeners()
        socket.destroy()
      }

      const fail = (error: ChatProcessingError) => {
        if (settled) {
          return
        }
        settled = true
        cleanup()
        reject(error)
      }

      socket.setTimeout(timeoutMs)

      socket.on('connect', () => {
        socket.write(request)
      })

      socket.on('data', (chunk) => {
        chunks.push(chunk)
        received += chunk.length

        if (received < CHAT_RESPONSE_SIZE || settled) {
          return
        }

        settled = true
        const data = Buffer.concat(chunks, received).subarray(0, CHAT_RESPONSE_SIZE)
        cleanup()
        resolve(this.parseResponse(data))
      })

      socket.on('timeout', () => {
        fail(new ChatProcessingError('REVERSE_ENCRYPTION_TIMEOUT', 'Hết thời gian chờ dịch vụ mã hoá ngược phản hồi'))
      })

      socket.on('error', () => {
        fail(new ChatProcessingError('REVERSE_ENCRYPTION_CONNECTION_FAILED', 'Không kết nối được tới dịch vụ mã hoá ngược'))
      })

      socket.on('close', () => {
        if (!settled && received < CHAT_RESPONSE_SIZE) {
          fail(new ChatProcessingError('REVERSE_ENCRYPTION_IO_FAILED', 'Kết nối tới dịch vụ mã hoá ngược bị đóng sớm'))
        }
      })

      socket.connect(port, host)
    })
  }

  private parseResponse(buffer: Buffer): RemoteResponse {
    return {
      messageId: buffer.readUInt32LE(0),
      responseType: buffer.readUInt32LE(4) || RESPONSE_ACK,
      status: buffer.readInt32LE(8),
      payload: this.readCString(buffer, 76, CHAT_MAX_RESULT),
    }
  }

  private writeCString(buffer: Buffer, offset: number, size: number, value: string) {
    const encoded = Buffer.from(value, 'utf8').subarray(0, size - 1)
    encoded.copy(buffer, offset)
    buffer[offset + encoded.length] = 0
  }

  private readCString(buffer: Buffer, offset: number, size: number) {
    const slice = buffer.subarray(offset, offset + size)
    const end = slice.indexOf(0)
    return slice.subarray(0, end >= 0 ? end : size).toString('utf8')
  }

  private nextId() {
    const current = this.nextMessageId
    this.nextMessageId += 1
    return current
  }
}
