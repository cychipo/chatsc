export type BackendEnv = {
  PORT: number
  MONGODB_URI: string
  API_PREFIX: string
  ACCESS_TOKEN_SECRET: string
  ACCESS_TOKEN_TTL_SECONDS: number
  REFRESH_TOKEN_SECRET: string
  REFRESH_TOKEN_TTL_SECONDS: number
  REFRESH_COOKIE_NAME: string
  CHAT_REVERSE_ENCRYPTION_ENABLED: boolean
  CHAT_REVERSE_ENCRYPTION_HOST: string
  CHAT_REVERSE_ENCRYPTION_PORT: number
  CHAT_REVERSE_ENCRYPTION_TIMEOUT_MS: number
  CHAT_REVERSE_ENCRYPTION_SHARED_KEY: string
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
    CHAT_REVERSE_ENCRYPTION_ENABLED: process.env.CHAT_REVERSE_ENCRYPTION_ENABLED === 'true',
    CHAT_REVERSE_ENCRYPTION_HOST: process.env.CHAT_REVERSE_ENCRYPTION_HOST ?? '',
    CHAT_REVERSE_ENCRYPTION_PORT: Number(process.env.CHAT_REVERSE_ENCRYPTION_PORT ?? 9191),
    CHAT_REVERSE_ENCRYPTION_TIMEOUT_MS: Number(process.env.CHAT_REVERSE_ENCRYPTION_TIMEOUT_MS ?? 5000),
    CHAT_REVERSE_ENCRYPTION_SHARED_KEY: process.env.CHAT_REVERSE_ENCRYPTION_SHARED_KEY ?? '',
  }

  if (env.CHAT_REVERSE_ENCRYPTION_ENABLED) {
    if (!env.CHAT_REVERSE_ENCRYPTION_HOST) {
      throw new Error('CHAT_REVERSE_ENCRYPTION_HOST is required when reverse encryption is enabled')
    }
    if (!Number.isFinite(env.CHAT_REVERSE_ENCRYPTION_PORT) || env.CHAT_REVERSE_ENCRYPTION_PORT <= 0) {
      throw new Error('CHAT_REVERSE_ENCRYPTION_PORT must be a positive number when reverse encryption is enabled')
    }
    if (!Number.isFinite(env.CHAT_REVERSE_ENCRYPTION_TIMEOUT_MS) || env.CHAT_REVERSE_ENCRYPTION_TIMEOUT_MS <= 0) {
      throw new Error('CHAT_REVERSE_ENCRYPTION_TIMEOUT_MS must be a positive number when reverse encryption is enabled')
    }
    if (!env.CHAT_REVERSE_ENCRYPTION_SHARED_KEY) {
      throw new Error('CHAT_REVERSE_ENCRYPTION_SHARED_KEY is required when reverse encryption is enabled')
    }
  }

  return env
}
