import { Injectable } from '@nestjs/common'
import { Socket } from 'node:net'
import { backendEnv } from '../../config/env.config'

const CHAT_REQUEST_SIZE = 1164
const CHAT_RESPONSE_SIZE = 588
const CHAT_MAX_USERNAME = 32
const CHAT_MAX_PASSWORD = 64
const CHAT_MAX_RESULT = 512

const REQUEST_AUTH_LOGIN = 1
const PROCESS_SHA1 = 2
const RESPONSE_ACK = 1
const STATUS_OK = 0

export class AuthProcessingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

type RemoteResponse = {
  messageId: number
  responseType: number
  status: number
  payload: string
}

@Injectable()
export class AuthProcessingService {
  private nextMessageId = 1

  isLocalAuthEnabled() {
    return backendEnv().AUTH_LOCAL_ENABLED
  }

  async hashPasswordWithSha1(email: string, password: string) {
    const env = backendEnv()

    if (!env.PROCESSOR_REMOTE_HOST) {
      throw new AuthProcessingError(
        'LOCAL_AUTH_SHA1_CONFIG_MISSING',
        'Thiếu cấu hình host của remote processor dùng chung',
      )
    }

    const request = this.buildSha1Request(email, password)
    const response = await this.exchange(
      request,
      env.PROCESSOR_REMOTE_HOST,
      env.PROCESSOR_REMOTE_PORT,
      env.PROCESSOR_REMOTE_TIMEOUT_MS,
    )

    if (response.status !== STATUS_OK) {
      throw new AuthProcessingError(
        'LOCAL_AUTH_SHA1_UNAVAILABLE',
        `Không thể xử lý SHA1 cho local auth: ${response.payload || 'processor-error'}`,
      )
    }

    return response.payload
  }

  private buildSha1Request(email: string, password: string) {
    const buffer = Buffer.alloc(CHAT_REQUEST_SIZE)
    const messageId = this.nextId()

    buffer.writeUInt32LE(messageId, 0)
    buffer.writeUInt32LE(REQUEST_AUTH_LOGIN, 4)
    buffer.writeUInt32LE(PROCESS_SHA1, 8)
    this.writeCString(buffer, 12, CHAT_MAX_USERNAME, email)
    this.writeCString(
      buffer,
      12 + CHAT_MAX_USERNAME + CHAT_MAX_USERNAME,
      CHAT_MAX_PASSWORD,
      password,
    )

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

      const fail = (error: AuthProcessingError) => {
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
        fail(new AuthProcessingError('LOCAL_AUTH_SHA1_TIMEOUT', 'Hết thời gian chờ dịch vụ SHA1 cho local auth phản hồi'))
      })

      socket.on('error', () => {
        fail(new AuthProcessingError('LOCAL_AUTH_SHA1_CONNECTION_FAILED', 'Không kết nối được tới dịch vụ SHA1 cho local auth'))
      })

      socket.on('close', () => {
        if (!settled && received < CHAT_RESPONSE_SIZE) {
          fail(new AuthProcessingError('LOCAL_AUTH_SHA1_IO_FAILED', 'Kết nối tới dịch vụ SHA1 cho local auth bị đóng sớm'))
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
