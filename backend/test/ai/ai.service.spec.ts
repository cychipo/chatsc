jest.mock('@google/generative-ai', () => {
  class MockGoogleGenerativeAI {
    constructor(private readonly apiKey: string) {}

    getGenerativeModel({ model }: { model: string }) {
      return {
        generateContent: mockGenerateContent(this.apiKey, model),
      }
    }
  }

  return {
    GoogleGenerativeAI: MockGoogleGenerativeAI,
    HarmBlockThreshold: { BLOCK_MEDIUM_AND_ABOVE: 'BLOCK_MEDIUM_AND_ABOVE' },
    HarmCategory: {
      HARM_CATEGORY_HARASSMENT: 'HARM_CATEGORY_HARASSMENT',
      HARM_CATEGORY_HATE_SPEECH: 'HARM_CATEGORY_HATE_SPEECH',
      HARM_CATEGORY_SEXUALLY_EXPLICIT: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      HARM_CATEGORY_DANGEROUS_CONTENT: 'HARM_CATEGORY_DANGEROUS_CONTENT',
    },
  }
})

import { BadRequestException, ServiceUnavailableException } from '@nestjs/common'
import { AiService } from '../../src/modules/ai/ai.service'

const mockGenerateContent = jest.fn()

describe('AiService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useRealTimers()
  })

  it('generates text successfully with current key and model', async () => {
    const service = new AiService({
      getApiKeys: jest.fn().mockReturnValue(['key-1']),
      getModels: jest.fn().mockReturnValue(['model-1']),
      getCurrentApiKey: jest.fn().mockReturnValue('key-1'),
      getCurrentModel: jest.fn().mockReturnValue('model-1'),
      getRequestTimeoutMs: jest.fn().mockReturnValue(1000),
      rotateApiKey: jest.fn().mockReturnValue('key-1'),
      rotateModel: jest.fn().mockReturnValue('model-1'),
      markKeyFailure: jest.fn(),
      markKeySuccess: jest.fn(),
    } as never)

    mockGenerateContent.mockResolvedValue({
      response: Promise.resolve({ text: () => 'Xin chào' }),
    })

    await expect(service.generateText({
      model: 'model-1',
      messages: [{ role: 'user', text: 'hello' }],
    })).resolves.toBe('Xin chào')
  })

  it('rotates model and api key when requests fail, then succeeds', async () => {
    const rotateModel = jest.fn().mockReturnValueOnce('model-2')
    const rotateApiKey = jest.fn().mockReturnValue('key-2')
    const getCurrentApiKey = jest.fn().mockReturnValueOnce('key-1').mockReturnValueOnce('key-2')

    const service = new AiService({
      getApiKeys: jest.fn().mockReturnValue(['key-1', 'key-2']),
      getModels: jest.fn().mockReturnValue(['model-1', 'model-2']),
      getCurrentApiKey,
      getCurrentModel: jest.fn().mockReturnValue('model-1'),
      getRequestTimeoutMs: jest.fn().mockReturnValue(1000),
      rotateApiKey,
      rotateModel,
      markKeyFailure: jest.fn(),
      markKeySuccess: jest.fn(),
    } as never)

    mockGenerateContent
      .mockRejectedValueOnce(new Error('quota exceeded 429'))
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ response: Promise.resolve({ text: () => 'done' }) })

    await expect(service.generateText({
      model: 'model-1',
      messages: [{ role: 'user', text: 'hello' }],
    })).resolves.toBe('done')

    expect(rotateModel).toHaveBeenCalled()
    expect(rotateApiKey).toHaveBeenCalled()
  })

  it('throws invalid response for malformed json', async () => {
    const service = new AiService({
      getApiKeys: jest.fn().mockReturnValue(['key-1']),
      getModels: jest.fn().mockReturnValue(['model-1']),
      getCurrentApiKey: jest.fn().mockReturnValue('key-1'),
      getCurrentModel: jest.fn().mockReturnValue('model-1'),
      getRequestTimeoutMs: jest.fn().mockReturnValue(1000),
      rotateApiKey: jest.fn().mockReturnValue('key-1'),
      rotateModel: jest.fn().mockReturnValue('model-1'),
      markKeyFailure: jest.fn(),
      markKeySuccess: jest.fn(),
    } as never)

    mockGenerateContent.mockResolvedValue({
      response: Promise.resolve({ text: () => 'not-json' }),
    })

    await expect(service.generateJson({
      model: 'model-1',
      responseMimeType: 'application/json',
      messages: [{ role: 'user', text: 'hello' }],
    })).rejects.toBeInstanceOf(BadRequestException)
  })

  it('times out when generation exceeds timeout', async () => {
    jest.useFakeTimers()

    const service = new AiService({
      getApiKeys: jest.fn().mockReturnValue(['key-1']),
      getModels: jest.fn().mockReturnValue(['model-1']),
      getCurrentApiKey: jest.fn().mockReturnValue('key-1'),
      getCurrentModel: jest.fn().mockReturnValue('model-1'),
      getRequestTimeoutMs: jest.fn().mockReturnValue(10),
      rotateApiKey: jest.fn().mockReturnValue('key-1'),
      rotateModel: jest.fn().mockReturnValue('model-1'),
      markKeyFailure: jest.fn(),
      markKeySuccess: jest.fn(),
    } as never)

    mockGenerateContent.mockImplementation(
      () => new Promise(() => undefined),
    )

    const promise = service.generateText({
      model: 'model-1',
      timeoutMs: 10,
      messages: [{ role: 'user', text: 'hello' }],
    })

    jest.advanceTimersByTime(20)

    await expect(promise).rejects.toBeInstanceOf(ServiceUnavailableException)
  })
})
