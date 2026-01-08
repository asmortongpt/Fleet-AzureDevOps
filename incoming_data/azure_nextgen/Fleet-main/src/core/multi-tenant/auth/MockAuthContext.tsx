
import React, { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  id: string
  email: string
  name: string
  role: string
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    // Return mock auth for when provider is missing
    return {
      user: {
        id: 'mock-admin',
        email: 'admin@dcf.florida.gov',
        name: 'Fleet Administrator',
        role: 'admin',
        permissions: ['all']
      },
      isLoading: false,
      isAuthenticated: true,
      login: async () => {},
      logout: () => {},
      hasPermission: () => true,
      hasRole: () => true
    }
  }
  return context
}

export const MockAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user] = useState<User>({
    id: 'mock-admin',
    email: 'admin@dcf.florida.gov',
    name: 'Fleet Administrator',
    role: 'admin',
    permissions: ['all']
  })

  const [isLoading] = useState(false)
  const [isAuthenticated] = useState(true)

  const login = async (email: string, password: string) => {
    // logger.debug('Mock login:', email)
  }

  const logout = () => {
    // logger.debug('Mock logout')
  }

  const hasPermission = (permission: string) => true
  const hasRole = (role: string) => user?.role === role

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        hasPermission,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export default MockAuthProvider
