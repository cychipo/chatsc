import { AiSuggestionsService } from '../../src/modules/ai/ai-suggestions.service'

describe('AiSuggestionsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns empty suggestions when last message is blank', async () => {
    const service = Object.create(AiSuggestionsService.prototype) as AiSuggestionsService

    Object.assign(service as object, {
      chatService: {
        getMessages: jest.fn().mockResolvedValue([{ content: '   ' }]),
      },
      aiConfigService: {},
      aiService: {
        generateJson: jest.fn(),
      },
    })

    await expect(service.generateSuggestions('conv-1')).resolves.toEqual([])
  })

  it('returns exactly three non-empty suggestions with configured timeout', async () => {
    const service = Object.create(AiSuggestionsService.prototype) as AiSuggestionsService
    const getMessages = jest.fn().mockResolvedValue([
      { content: 'Hello there' },
      { content: 'Can you help me check this?' },
      { content: 'Sure, give me a second' },
      { content: 'Thanks a lot' },
    ])
    const generateJson = jest.fn().mockResolvedValue(['Sure, let me check', 'Give me a moment', 'I can help', 'extra'])

    Object.assign(service as object, {
      chatService: {
        getMessages,
      },
      aiConfigService: {
        getCurrentModel: jest.fn().mockReturnValue('gemini-1.5-flash'),
        getSuggestionTimeoutMs: jest.fn().mockReturnValue(1000),
      },
      aiService: { generateJson },
    })

    const result = await service.generateSuggestions('conv-1')

    expect(getMessages).toHaveBeenCalledWith('conv-1', undefined, 10)
    expect(generateJson).toHaveBeenCalledWith({
      model: 'gemini-1.5-flash',
      responseMimeType: 'application/json',
      timeoutMs: 1000,
      messages: [expect.objectContaining({ role: 'user' })],
    })
    expect(generateJson.mock.calls[0][0].messages[0].text).toContain('Base the reply language primarily on the latest 2-3 messages in the conversation.')
    expect(generateJson.mock.calls[0][0].messages[0].text).toContain('Message 1: Hello there')
    expect(generateJson.mock.calls[0][0].messages[0].text).toContain('Latest message: Thanks a lot')
    expect(result).toEqual(['Sure, let me check', 'Give me a moment', 'I can help'])
  })
})
