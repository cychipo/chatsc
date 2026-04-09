export type BackendEnv = {
  PORT: number
  MONGODB_URI: string
  API_PREFIX: string
  ACCESS_TOKEN_SECRET: string
  ACCESS_TOKEN_TTL_SECONDS: number
  REFRESH_TOKEN_SECRET: string
  REFRESH_TOKEN_TTL_SECONDS: number
  REFRESH_COOKIE_NAME: string
  AUTH_LOCAL_ENABLED: boolean
  PROCESSOR_REMOTE_HOST: string
  PROCESSOR_REMOTE_PORT: number
  PROCESSOR_REMOTE_TIMEOUT_MS: number
  CHAT_REVERSE_ENCRYPTION_ENABLED: boolean
  CHAT_REVERSE_ENCRYPTION_SHARED_KEY: string
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_NAME: string
  R2_PUBLIC_URL: string
  GEMINI_API_KEYS: string
  GEMINI_MODELS: string
  GEMINI_REQUEST_TIMEOUT_MS: number
  GEMINI_MODERATION_TIMEOUT_MS: number
  GEMINI_SUGGESTION_TIMEOUT_MS: number
  GEMINI_MAX_CONTEXT_MESSAGES: number
  AI_CHATBOT_ENABLED: boolean
  AI_SUGGESTIONS_ENABLED: boolean
  AI_MODERATION_ENABLED: boolean
}

export const backendEnv = (): BackendEnv => {
  const env = {
    PORT: Number(process.env.PORT ?? 3000),
    MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/chatsc',
    API_PREFIX: process.env.API_PREFIX ?? 'api',
    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? 'replace-with-access-token-secret',
    ACCESS_TOKEN_TTL_SECONDS: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 1800),
    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? 'replace-with-refresh-token-secret',
    REFRESH_TOKEN_TTL_SECONDS: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 604800),
    REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME ?? 'refresh_token',
    AUTH_LOCAL_ENABLED: process.env.AUTH_LOCAL_ENABLED === 'true',
    PROCESSOR_REMOTE_HOST:
      process.env.PROCESSOR_REMOTE_HOST ??
      process.env.CHAT_REVERSE_ENCRYPTION_HOST ??
      '',
    PROCESSOR_REMOTE_PORT: Number(
      process.env.PROCESSOR_REMOTE_PORT ??
        process.env.CHAT_REVERSE_ENCRYPTION_PORT ??
        9191,
    ),
    PROCESSOR_REMOTE_TIMEOUT_MS: Number(
      process.env.PROCESSOR_REMOTE_TIMEOUT_MS ??
        process.env.CHAT_REVERSE_ENCRYPTION_TIMEOUT_MS ??
        5000,
    ),
    CHAT_REVERSE_ENCRYPTION_ENABLED: process.env.CHAT_REVERSE_ENCRYPTION_ENABLED === 'true',
    CHAT_REVERSE_ENCRYPTION_SHARED_KEY: process.env.CHAT_REVERSE_ENCRYPTION_SHARED_KEY ?? '',
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID ?? '',
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ?? '',
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ?? '',
    R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ?? '',
    R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ?? '',
    GEMINI_API_KEYS: process.env.GEMINI_API_KEYS ?? '',
    GEMINI_MODELS: process.env.GEMINI_MODELS ?? 'gemini-1.5-flash',
    GEMINI_REQUEST_TIMEOUT_MS: Number(process.env.GEMINI_REQUEST_TIMEOUT_MS ?? 30000),
    GEMINI_MODERATION_TIMEOUT_MS: Number(process.env.GEMINI_MODERATION_TIMEOUT_MS ?? 5000),
    GEMINI_SUGGESTION_TIMEOUT_MS: Number(process.env.GEMINI_SUGGESTION_TIMEOUT_MS ?? 10000),
    GEMINI_MAX_CONTEXT_MESSAGES: Number(process.env.GEMINI_MAX_CONTEXT_MESSAGES ?? 10),
    AI_CHATBOT_ENABLED: process.env.AI_CHATBOT_ENABLED !== 'false',
    AI_SUGGESTIONS_ENABLED: process.env.AI_SUGGESTIONS_ENABLED !== 'false',
    AI_MODERATION_ENABLED: process.env.AI_MODERATION_ENABLED !== 'false',
  }

  if (env.AUTH_LOCAL_ENABLED || env.CHAT_REVERSE_ENCRYPTION_ENABLED) {
    if (!env.PROCESSOR_REMOTE_HOST) {
      throw new Error('PROCESSOR_REMOTE_HOST is required when remote processor features are enabled')
    }
    if (!Number.isFinite(env.PROCESSOR_REMOTE_PORT) || env.PROCESSOR_REMOTE_PORT <= 0) {
      throw new Error('PROCESSOR_REMOTE_PORT must be a positive number when remote processor features are enabled')
    }
    if (!Number.isFinite(env.PROCESSOR_REMOTE_TIMEOUT_MS) || env.PROCESSOR_REMOTE_TIMEOUT_MS <= 0) {
      throw new Error('PROCESSOR_REMOTE_TIMEOUT_MS must be a positive number when remote processor features are enabled')
    }
  }

  if (env.CHAT_REVERSE_ENCRYPTION_ENABLED && !env.CHAT_REVERSE_ENCRYPTION_SHARED_KEY) {
    throw new Error('CHAT_REVERSE_ENCRYPTION_SHARED_KEY is required when reverse encryption is enabled')
  }

  if (!Number.isFinite(env.GEMINI_REQUEST_TIMEOUT_MS) || env.GEMINI_REQUEST_TIMEOUT_MS <= 0) {
    throw new Error('GEMINI_REQUEST_TIMEOUT_MS must be a positive number')
  }
  if (!Number.isFinite(env.GEMINI_MODERATION_TIMEOUT_MS) || env.GEMINI_MODERATION_TIMEOUT_MS <= 0) {
    throw new Error('GEMINI_MODERATION_TIMEOUT_MS must be a positive number')
  }
  if (!Number.isFinite(env.GEMINI_SUGGESTION_TIMEOUT_MS) || env.GEMINI_SUGGESTION_TIMEOUT_MS <= 0) {
    throw new Error('GEMINI_SUGGESTION_TIMEOUT_MS must be a positive number')
  }
  if (!Number.isFinite(env.GEMINI_MAX_CONTEXT_MESSAGES) || env.GEMINI_MAX_CONTEXT_MESSAGES <= 0) {
    throw new Error('GEMINI_MAX_CONTEXT_MESSAGES must be a positive number')
  }

  return env
}
