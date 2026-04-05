export type BackendEnv = {
  PORT: number
  MONGODB_URI: string
  API_PREFIX: string
  ACCESS_TOKEN_SECRET: string
  ACCESS_TOKEN_TTL_SECONDS: number
  REFRESH_TOKEN_SECRET: string
  REFRESH_TOKEN_TTL_SECONDS: number
  REFRESH_COOKIE_NAME: string
}

export const backendEnv = (): BackendEnv => ({
  PORT: Number(process.env.PORT ?? 3000),
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/chatsc',
  API_PREFIX: process.env.API_PREFIX ?? 'api',
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET ?? 'replace-with-access-token-secret',
  ACCESS_TOKEN_TTL_SECONDS: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 1800),
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET ?? 'replace-with-refresh-token-secret',
  REFRESH_TOKEN_TTL_SECONDS: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 604800),
  REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME ?? 'refresh_token',
})
