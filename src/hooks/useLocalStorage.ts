import { useState, useEffect } from "react"
import logger from '@/utils/logger'

/**
 * Hook for persisting state to localStorage with automatic syncing
 *
 * Features:
 * - Automatic serialization/deserialization
 * - SSR safe (checks for window)
 * - TypeScript generic support
 * - Error handling
 *
 * @param key - localStorage key
 * @param initialValue - Default value if no stored value exists
 * @returns [storedValue, setValue] tuple similar to useState
 *
 * @example
 * ```tsx
 * const [theme, setTheme] = useLocalStorage<string>('theme', 'light')
 * const [filters, setFilters] = useLocalStorage<FilterState>('filters', defaultFilters)
 * ```
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      logger.error('Error', { message: `Error loading localStorage key "${key}":`, error: error })
      return initialValue
    }
  })

  // Return a wrapped version of useState's setter function that persists to localStorage
  const setValue = (value: T) => {
    try {
      // Allow value to be a function like useState
      const valueToStore = value instanceof Function ? value(storedValue) : value

      setStoredValue(valueToStore)

      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      logger.error('Error', { message: `Error setting localStorage key "${key}":`, error: error })
    }
  }

  return [storedValue, setValue]
}
