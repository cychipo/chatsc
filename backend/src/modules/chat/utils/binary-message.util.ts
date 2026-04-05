/**
 * Decode binary UTF-8 payload from client.
 * Throws ChatDecodeError if payload is invalid UTF-8.
 */
export class ChatDecodeError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ChatDecodeError'
  }
}

export function decodeBinaryMessage(buffer: Buffer): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    const text = decoder.decode(buffer)
    if (!text.trim()) {
      throw new ChatDecodeError('EMPTY_MESSAGE', 'Message content cannot be empty')
    }
    return text
  } catch (err) {
    if (err instanceof ChatDecodeError) {
      throw err
    }
    throw new ChatDecodeError('INVALID_UTF8', 'Failed to decode binary payload as UTF-8')
  }
}
