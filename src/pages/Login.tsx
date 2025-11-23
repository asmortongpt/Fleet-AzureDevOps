import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { signInWithMicrosoft, setAuthToken } from '@/lib/microsoft-auth'
import { CarProfile, Truck, MapPin, Users, ChartLine, Shield } from '@phosphor-icons/react'

/**
 * Login Page Component
 * Enterprise-styled login with Microsoft SSO and email/password support
 * Design inspired by PMO Tool Ultimate
 */
export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Check for error messages in URL
  const params = new URLSearchParams(window.location.search)
  const urlError = params.get('error')
  const urlMessage = params.get('message') || params.get('error_description')

  // Email login mutation using TanStack Query
  const emailLoginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const apiUrl = import.meta.env.VITE_API_URL || '/api/v1'
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
    setError('')
    setIsLoading(true)
    try {
      await emailLoginMutation.mutateAsync({ email, password })
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  function handleMicrosoftLogin() {
    signInWithMicrosoft()
  }

  const displayError = error || (urlError ? (urlMessage || 'Authentication failed. Please try again.') : '')

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #0d4f8b 50%, #1a365d 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '50px',
        borderRadius: '20px',
        boxShadow: '0 25px 80px rgba(0, 0, 0, 0.35)',
        width: '480px',
        maxWidth: '100%'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <div style={{
            width: '90px',
            height: '90px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0d4f8b 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(30, 58, 95, 0.4)'
          }}>
            <CarProfile size={48} weight="bold" color="white" />
          </div>
          <h1 style={{
            color: '#1e3a5f',
            marginBottom: '10px',
            fontSize: '2.5rem',
            fontWeight: '700',
            letterSpacing: '-1px'
          }}>
            Fleet Manager
          </h1>
          <p style={{
            color: '#4a5568',
            fontSize: '17px',
            marginBottom: '8px'
          }}>
            Enterprise Fleet Management System
          </p>
          <p style={{
            color: '#718096',
            fontSize: '14px'
          }}>
            Capital Technology Alliance
          </p>
        </div>

        {/* Error Display */}
        {displayError && (
          <div style={{
            background: '#fff2f0',
            color: '#a8071a',
            padding: '15px 18px',
            borderRadius: '10px',
            marginBottom: '25px',
            fontSize: '14px',
            border: '1px solid #ffccc7',
            fontWeight: '500'
          }}>
            {displayError}
          </div>
        )}

        {/* Microsoft SSO Button */}
        <button
          type="button"
          onClick={handleMicrosoftLogin}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #1e3a5f 0%, #0d4f8b 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '17px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 8px 25px rgba(30, 58, 95, 0.3)',
            transition: 'all 0.3s ease',
            marginBottom: '25px'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(30, 58, 95, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(30, 58, 95, 0.3)';
          }}
        >
          <svg width="21" height="21" viewBox="0 0 23 23">
            <path fill="#f35325" d="M1 1h10v10H1z" />
            <path fill="#81bc06" d="M12 1h10v10H12z" />
            <path fill="#05a6f0" d="M1 12h10v10H1z" />
            <path fill="#ffba08" d="M12 12h10v10H12z" />
          </svg>
          Sign in with Microsoft
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '25px 0',
          gap: '15px'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          <span style={{ color: '#718096', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Or continue with email
          </span>
          <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '15px'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@demofleet.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0d4f8b'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              required
              disabled={isLoading}
            />
          </div>

          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#2d3748',
              fontSize: '15px'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '10px',
                fontSize: '16px',
                transition: 'all 0.3s ease',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => e.target.style.borderColor = '#0d4f8b'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '16px',
              background: isLoading ? '#a0aec0' : 'linear-gradient(135deg, #1e3a5f 0%, #0d4f8b 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '17px',
              fontWeight: '600',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: isLoading ? 'none' : '0 8px 25px rgba(30, 58, 95, 0.3)'
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 35px rgba(30, 58, 95, 0.4)';
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(30, 58, 95, 0.3)';
              }
            }}
          >
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing In...
              </span>
            ) : (
              'Sign in to Fleet Manager'
            )}
          </button>
        </form>

        {/* Demo Credentials */}
        <div style={{
          marginTop: '25px',
          padding: '18px',
          background: '#f0f9ff',
          borderRadius: '12px',
          fontSize: '14px',
          color: '#0369a1',
          border: '1px solid #bae6fd'
        }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#0c4a6e' }}>
            Demo Mode Available:
          </div>
          <div style={{ fontSize: '13px', color: '#0369a1' }}>
            Use Microsoft SSO or demo credentials to explore the system
          </div>
        </div>

        {/* Feature Badges */}
        <div style={{
          marginTop: '25px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          fontSize: '11px',
          color: '#64748b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
            <Truck size={14} weight="bold" color="#0d4f8b" />
            <span>50+ Vehicles</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
            <MapPin size={14} weight="bold" color="#0d4f8b" />
            <span>GPS Tracking</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
            <Users size={14} weight="bold" color="#0d4f8b" />
            <span>30+ Drivers</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
            <ChartLine size={14} weight="bold" color="#0d4f8b" />
            <span>Analytics</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
            <Shield size={14} weight="bold" color="#0d4f8b" />
            <span>Enterprise</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
            <CarProfile size={14} weight="bold" color="#0d4f8b" />
            <span>AI Assistant</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default Login
