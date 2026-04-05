import { BadRequestException } from '@nestjs/common'
import { ChatService } from '../src/modules/chat/chat.service'

describe('Chat binary decode compatibility removed', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('rejects empty messages in service layer', async () => {
    const service = Object.create(ChatService.prototype) as ChatService

    await expect(service.sendMessage('conv-1', 'user-1', '   ')).rejects.toBeInstanceOf(BadRequestException)
  })
})
