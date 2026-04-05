import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { ChatDecodeError } from './binary-message.util'

export function mapChatError(err: unknown): never {
  if (err instanceof ChatDecodeError) {
    throw new BadRequestException({
      error: 'DECODE_ERROR',
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
