import { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  user: unknown | null
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider value={{
      user: null,
      isAuthenticated: false,
      login: async () => {},
      logout: async () => {}
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

// Alias export for compatibility
export const useAuthContext = useAuth
