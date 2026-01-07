/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_WS_URL: string
    readonly VITE_APP_VERSION: string
    readonly VITE_ENVIRONMENT: string
    readonly MODE: string
    readonly DEV: boolean
    readonly PROD: boolean
    readonly SSR: boolean
    // Add more env variables as needed
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

// Declare global window properties
declare global {
    interface Window {
        Sentry?: {
            captureException: (error: Error, context?: any) => void
            captureMessage: (message: string, context?: any) => void
        }
        gtag?: (...args: any[]) => void
    }
}

export { }
