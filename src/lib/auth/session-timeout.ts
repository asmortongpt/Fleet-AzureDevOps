/**
 * Session Timeout Management
 * Auto-logout after 30 minutes of inactivity
 */

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_TIME_MS = 5 * 60 * 1000; // 5 minutes before timeout

let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
let warningHandle: ReturnType<typeof setTimeout> | null = null;
let lastActivityTime = Date.now();

export interface SessionTimeoutCallbacks {
  onWarning: () => void;
  onTimeout: () => void;
}

export function startSessionTimeout(callbacks: SessionTimeoutCallbacks): () => void {
  // Clear existing timers
  if (timeoutHandle) clearTimeout(timeoutHandle);
  if (warningHandle) clearTimeout(warningHandle);

  // Reset activity timer
  lastActivityTime = Date.now();

  // Schedule warning at 25 minutes
  warningHandle = setTimeout(() => {
    callbacks.onWarning();
  }, SESSION_TIMEOUT_MS - WARNING_TIME_MS);

  // Schedule logout at 30 minutes
  timeoutHandle = setTimeout(() => {
    callbacks.onTimeout();
  }, SESSION_TIMEOUT_MS);

  return () => {
    stopSessionTimeout();
  };
}

export function stopSessionTimeout(): void {
  if (timeoutHandle) clearTimeout(timeoutHandle);
  if (warningHandle) clearTimeout(warningHandle);
  timeoutHandle = null;
  warningHandle = null;
}

export function resetSessionTimeout(callbacks: SessionTimeoutCallbacks): void {
  const now = Date.now();
  const timeSinceLastActivity = now - lastActivityTime;

  // Only reset if more than 1 minute has passed since last reset
  if (timeSinceLastActivity > 60000) {
    lastActivityTime = now;
    stopSessionTimeout();
    startSessionTimeout(callbacks);
  }
}

export function trackActivity(callbacks: SessionTimeoutCallbacks): void {
  resetSessionTimeout(callbacks);
}

export function getSessionTimeoutMs(): number {
  return SESSION_TIMEOUT_MS;
}

export function getTimeUntilTimeout(): number {
  const elapsed = Date.now() - lastActivityTime;
  return Math.max(0, SESSION_TIMEOUT_MS - elapsed);
}
