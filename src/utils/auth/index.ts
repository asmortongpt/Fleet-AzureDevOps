export function checkAuth(): boolean {
  return false
}

export function getToken(): string | null {
  return null
}

export function getAuthHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
