import { CarProfile } from '@phosphor-icons/react'
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { signInWithMicrosoft, setAuthToken } from '@/lib/microsoft-auth'


/**
 * Login Page Component
 * Supports both traditional email/password login and Microsoft SSO
 *
 * DEV MODE: Automatically bypasses login with demo credentials
 */
export function Login() {
  const navigate = useNavigate()
  // SECURITY FIX (HIGH-007): Remove hardcoded credentials
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // SECURITY FIX (HIGH-007): Auto-login disabled for security reasons
  // Auto-login has been removed to prevent automatic authentication with hardcoded credentials

  // Handle Microsoft OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      console.log('[OAUTH] Authorization code received, exchanging for token...')

      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      fetch(`${apiUrl}/auth/microsoft/callback?code=${encodeURIComponent(code)}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to exchange authorization code')
          }
          return res.json()
        })
        .then(data => {
          if (data.token) {
            console.log('[OAUTH] Token received, storing and redirecting...')
            setAuthToken(data.token)
            navigate('/', { replace: true })
          } else {
            throw new Error('No token in response')
          }
        })
        .catch(error => {
          console.error('[OAUTH] Callback error:', error)
          navigate('/login?error=oauth_failed&message=' + encodeURIComponent(error.message), { replace: true })
        })
    }
  }, [navigate])

  // Check for error messages in URL
  const params = new URLSearchParams(window.location.search)
  const urlError = params.get('error')
  const urlMessage = params.get('message') || params.get('error_description')

  // Email login mutation using TanStack Query
  const emailLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const apiUrl = import.meta.env.VITE_API_URL || '/api'
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Login failed')
      }

      return response.json()
    },
    onSuccess: (data) => {
      setAuthToken(data.token)
      navigate('/')
    }
  })

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    emailLoginMutation.mutate({ email, password })
  }

  function handleMicrosoftLogin() {
    signInWithMicrosoft()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-primary text-primary-foreground rounded-2xl">
              <CarProfile className="w-12 h-12" weight="bold" />
            </div>
          </div>
          <div className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold">Fleet Manager</CardTitle>
            <CardDescription>
              Sign in to access your fleet management dashboard
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Show URL errors */}
          {urlError && (
            <Alert variant="destructive">
              <AlertDescription>
                {urlMessage || 'Authentication failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Show form errors from mutation */}
          {emailLoginMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription>
                {emailLoginMutation.error instanceof Error
                  ? emailLoginMutation.error.message
                  : 'An error occurred during login'}
              </AlertDescription>
            </Alert>
          )}

          {/* Microsoft Sign-In Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            onClick={handleMicrosoftLogin}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 23 23">
              <path fill="#f35325" d="M1 1h10v10H1z" />
              <path fill="#81bc06" d="M12 1h10v10H12z" />
              <path fill="#05a6f0" d="M1 12h10v10H1z" />
              <path fill="#ffba08" d="M12 12h10v10H12z" />
            </svg>
            Sign in with Microsoft
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={emailLoginMutation.isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={emailLoginMutation.isPending}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={emailLoginMutation.isPending}
            >
              {emailLoginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact your system administrator for credentials.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
