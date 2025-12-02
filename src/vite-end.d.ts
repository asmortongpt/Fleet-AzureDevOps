/// <reference types="vite/client" />
declare const GITHUB_RUNTIME_PERMANENT_NAME: string
declare const BASE_KV_SERVICE_URL: string

// Environment variable type declarations
interface ImportMetaEnv {
  readonly VITE_APPLICATION_INSIGHTS_CONNECTION_STRING?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_BUILD_ID?: string
  readonly VITE_API_URL?: string
  readonly VITE_ENVIRONMENT?: string
  readonly VITE_AZURE_AD_CLIENT_ID?: string
  readonly VITE_AZURE_AD_TENANT_ID?: string
  readonly VITE_AZURE_AD_REDIRECT_URI?: string
  readonly VITE_AZURE_MAPS_SUBSCRIPTION_KEY?: string
  readonly VITE_ENABLE_AI_ASSISTANT?: string
  readonly VITE_ENABLE_TEAMS_INTEGRATION?: string
  readonly VITE_ENABLE_EMAIL_CENTER?: string
  readonly VITE_ENABLE_DARK_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    spark: {
      llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string
      llm: (prompt: string, modelName?: string, jsonMode?: boolean) => Promise<string>
      user: () => Promise<{
        avatarUrl: string
        email: string
        id: string
        isOwner: boolean
        login: string
      }>
      kv: {
        keys: () => Promise<string[]>
        get: <T>(key: string) => Promise<T | undefined>
        set: <T>(key: string, value: T) => Promise<void>
        delete: (key: string) => Promise<void>
      }
    }
  }
  const spark: Window['spark']
}