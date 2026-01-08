/**
 * Simple production logger
 */

const logger = {
  debug: (...args: any[]) => console.debug(...args),
  info: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  redact: (data: any) => {
    if (typeof data === 'object') {
      return { ...data, password: '***', token: '***', secret: '***' }
    }
    return data
  }
}

export const createLogger = () => logger

// Named export for { logger } import pattern
export { logger }

export default logger
