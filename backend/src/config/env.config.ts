export type BackendEnv = {
  PORT: number
  MONGODB_URI: string
  API_PREFIX: string
}

export const backendEnv = (): BackendEnv => ({
  PORT: Number(process.env.PORT ?? 3000),
  MONGODB_URI: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/chatsc',
  API_PREFIX: process.env.API_PREFIX ?? 'api',
})
