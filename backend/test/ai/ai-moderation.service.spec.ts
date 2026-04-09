import { AiModerationService } from '../../src/modules/ai/ai-moderation.service'

describe('AiModerationService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('maps AI moderation response into moderation result dto', async () => {
    const service = Object.create(AiModerationService.prototype) as AiModerationService
    const generateJson = jest.fn().mockResolvedValue({
      sentiment: 'negative',
      sentimentScore: 0.2,
      toxicityScore: 0.91,
      isToxic: true,
      warningMessage: 'Nội dung này có thể gây khó chịu.',
    })

    Object.assign(service as object, {
      aiConfigService: {
        getCurrentModel: jest.fn().mockReturnValue('gemini-1.5-flash'),
        getModerationTimeoutMs: jest.fn().mockReturnValue(5000),
      },
      aiService: { generateJson },
    })

    await expect(service.analyzeMessage('msg-1', 'đồ ngu')).resolves.toEqual({
      messageId: 'msg-1',
      sentiment: 'negative',
      sentimentScore: 0.2,
      toxicityScore: 0.91,
      isToxic: true,
      warningMessage: 'Nội dung này có thể gây khó chịu.',
    })
  })

  it('falls back to default warning for toxic messages without warning text', async () => {
    const service = Object.create(AiModerationService.prototype) as AiModerationService

    Object.assign(service as object, {
      aiConfigService: {
        getCurrentModel: jest.fn().mockReturnValue('gemini-1.5-flash'),
        getModerationTimeoutMs: jest.fn().mockReturnValue(5000),
      },
      aiService: {
        generateJson: jest.fn().mockResolvedValue({
          sentiment: 'negative',
          sentimentScore: 0.1,
          toxicityScore: 0.75,
          isToxic: true,
        }),
      },
    })

    const result = await service.analyzeMessage('msg-2', 'toxic')

    expect(result.warningMessage).toBe('Nội dung này có thể gây khó chịu.')
  })
})
