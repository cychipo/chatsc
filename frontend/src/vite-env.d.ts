/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_AUTH_PATH?: string
  readonly VITE_CHAT_REVERSE_ENCRYPTION_ENABLED?: 'true' | 'false'
  readonly VITE_AI_ENABLED?: 'true' | 'false'
  readonly VITE_AI_SOCKET_NAMESPACE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
