import { BadRequestException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common'
import { ChatDecodeError } from './binary-message.util'

export class ChatProcessingError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ChatProcessingError'
  }
}

export function mapChatError(err: unknown): never {
  if (err instanceof ChatDecodeError) {
    throw new BadRequestException({
      error: 'DECODE_ERROR',
      code: err.code,
      message: err.message,
    })
  }
  if (err instanceof ChatProcessingError) {
    throw new ServiceUnavailableException({
      error: 'CHAT_PROCESSING_ERROR',
      code: err.code,
      message: err.message,
    })
  }
  if (err instanceof ForbiddenException || err instanceof BadRequestException) {
    throw err
  }
  throw new BadRequestException({
    error: 'CHAT_ERROR',
    message: err instanceof Error ? err.message : 'Unknown chat error',
  })
}
