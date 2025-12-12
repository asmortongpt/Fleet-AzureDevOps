/**
 * Safely access localStorage with fallback
 * @param key - Storage key
 * @param defaultValue - Default value if access fails
 * @returns Stored value or default
 */
export function safeGetLocalStorage(key: string, defaultValue: string | null = null): string | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return defaultValue
    }
    return localStorage.getItem(key) ?? defaultValue
  } catch (error) {
    console.warn("Failed to access localStorage:", error)
    return defaultValue
  }
}

/**
 * Safely set localStorage with error handling
 * @param key - Storage key
 * @param value - Value to store
 * @returns Success status
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false
    }
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    console.warn("Failed to set localStorage:", error)
    return false
  }
}
