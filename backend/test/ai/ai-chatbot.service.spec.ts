import { AiChatbotService } from '../../src/modules/ai/ai-chatbot.service'

describe('AiChatbotService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('detects chatbot triggers', () => {
    const service = Object.create(AiChatbotService.prototype) as AiChatbotService

    expect(service.shouldReply('/ai xin chao')).toBe(true)
    expect(service.shouldReply('hello @chatai')).toBe(true)
    expect(service.shouldReply('hello everyone')).toBe(false)
  })

  it('removes chatbot trigger tokens from prompt', () => {
    const service = Object.create(AiChatbotService.prototype) as AiChatbotService

    expect(service.buildPrompt('/ai hello')).toBe('hello')
    expect(service.buildPrompt('@chatai giúp mình')).toBe('giúp mình')
  })

  it('builds AI request with recent conversation context and configured timeout', async () => {
    const service = Object.create(AiChatbotService.prototype) as AiChatbotService
    const getMessages = jest.fn().mockResolvedValue([
      { senderId: 'user-1', content: 'Xin chào' },
      { senderId: 'user-2', content: 'Mình cần hỗ trợ' },
    ])
    const generateText = jest.fn().mockResolvedValue('Phản hồi AI')

    Object.assign(service as object, {
      chatService: { getMessages },
      aiConfigService: {
        getMaxContextMessages: jest.fn().mockReturnValue(10),
        getCurrentModel: jest.fn().mockReturnValue('gemini-1.5-flash'),
        getRequestTimeoutMs: jest.fn().mockReturnValue(9000),
      },
      aiService: { generateText },
    })

    const result = await service.generateResponse('conv-1', '/ai tư vấn giúp mình')

    expect(getMessages).toHaveBeenCalledWith('conv-1', undefined, 10)
    expect(generateText).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      timeoutMs: 9000,
      messages: [
        expect.objectContaining({
          role: 'user',
          text: expect.stringContaining('Current user request: tư vấn giúp mình'),
        }),
      ],
    })
    expect(generateText.mock.calls[0][0].messages[0].text).toContain('user: Xin chào')
    expect(generateText.mock.calls[0][0].messages[0].text).toContain('user: Mình cần hỗ trợ')
    expect(result).toBe('Phản hồi AI')
  })
})
