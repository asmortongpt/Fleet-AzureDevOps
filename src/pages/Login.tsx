import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { signInWithMicrosoft, setAuthToken } from '@/lib/microsoft-auth'
import { CarProfile } from '@phosphor-icons/react'

/**
 * Login Page Component
 * Supports both traditional email/password login and Microsoft SSO
 */
export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
                placeholder="admin@demofleet.com"
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
                placeholder="••••••••"
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
              Demo credentials: <code className="bg-muted px-1 rounded">admin@demofleet.com</code> / <code className="bg-muted px-1 rounded">Demo@123</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Login
