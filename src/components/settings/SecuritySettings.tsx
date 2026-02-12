/**
 * Security Settings Component
 * Password, 2FA, sessions, and API keys
 */

import { ShieldCheck, Key, Smartphone, RotateCcw, Monitor, LogOut, Shield } from 'lucide-react'
import { useAtom } from 'jotai'
import { useMemo, useState } from 'react'
import useSWR from 'swr'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { swrFetcher } from '@/lib/fetcher'
import { securitySettingsAtom, hasUnsavedChangesAtom } from '@/lib/reactive-state'
import logger from '@/utils/logger';

export function SecuritySettings() {
  const [settings, setSettings] = useAtom(securitySettingsAtom)
  const [, setHasUnsavedChanges] = useAtom(hasUnsavedChangesAtom)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)
  const { data: sessionsData, mutate: mutateSessions } = useSWR<Record<string, any>>('/api/sessions', swrFetcher)
  const { data: auditData } = useSWR<Record<string, any>>('/api/audit-logs', swrFetcher)

  const formatRelativeTime = (timestamp?: string) => {
    if (!timestamp) return '—'
    const date = new Date(timestamp)
    if (Number.isNaN(date.getTime())) return '—'
    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }

  const parseDevice = (userAgent: string) => {
    if (!userAgent) return 'Unknown'
    if (/mobile|android|iphone|ipad/i.test(userAgent)) return 'Mobile'
    return 'Desktop'
  }

  const parseBrowser = (userAgent: string) => {
    if (!userAgent) return 'Unknown'
    if (userAgent.includes('Edg/')) return 'Edge'
    if (userAgent.includes('Chrome/')) return 'Chrome'
    if (userAgent.includes('Firefox/')) return 'Firefox'
    if (userAgent.includes('Safari/')) return 'Safari'
    return 'Unknown'
  }

  const activeSessions = useMemo(() => {
    const rows = sessionsData?.data ?? []
    if (!Array.isArray(rows)) return []
    const sorted = [...rows].sort((a, b) => {
      const aTime = new Date(a.lastActivity || a.startTime || 0).getTime()
      const bTime = new Date(b.lastActivity || b.startTime || 0).getTime()
      return bTime - aTime
    })
    const currentId = sorted[0]?.id
    return sorted.map((session: any) => ({
      id: session.id,
      device: parseDevice(session.userAgent || ''),
      browser: parseBrowser(session.userAgent || ''),
      lastActive: formatRelativeTime(session.lastActivity),
      ip: session.ipAddress || '—',
      current: session.id === currentId
    }))
  }, [sessionsData])

  const loginHistory = useMemo(() => {
    const rows = auditData?.data ?? []
    if (!Array.isArray(rows)) return []
    return rows
      .filter((row: any) => row.action === 'LOGIN' || row.action === 'user_login')
      .slice(0, 10)
      .map((row: any) => ({
        id: row.id,
        timestamp: new Date(row.timestamp).toLocaleString(),
        device: row.metadata?.userAgent ? `${parseDevice(row.metadata.userAgent)} - ${parseBrowser(row.metadata.userAgent)}` : 'Unknown',
        location: row.metadata?.location || 'Unknown',
        ip: row.ipAddress || row.metadata?.ipAddress || '—'
      }))
  }, [auditData])

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    setSettings({ ...settings, [key]: value })
    setHasUnsavedChanges(true)
  }

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (password.length >= 12) strength += 25
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25
    if (/\d/.test(password)) strength += 15
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10
    return Math.min(strength, 100)
  }

  const handlePasswordChange = (password: string) => {
    setNewPassword(password)
    setPasswordStrength(calculatePasswordStrength(password))
  }

  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
        logger.warn('Password validation failed')
        return
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (!response.ok) {
        throw new Error(`Password update failed (${response.status})`)
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStrength(0)
    } catch (error) {
      logger.error('Failed to change password', error as Error)
    }
  }

  const handleTerminateSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) {
        throw new Error(`Failed to terminate session (${response.status})`)
      }
      await mutateSessions()
    } catch (error) {
      logger.error('Failed to terminate session', error as Error)
    }
  }

  return (
    <div className="space-y-2">
      {/* Change Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="w-3 h-3" />
            <CardTitle>Change Password</CardTitle>
          </div>
          <CardDescription>Update your password regularly for security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Enter new password"
            />
            {newPassword && (
              <div className="space-y-2">
                <Progress value={passwordStrength} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Password strength:{' '}
                  {passwordStrength < 40 && 'Weak'}
                  {passwordStrength >= 40 && passwordStrength < 70 && 'Fair'}
                  {passwordStrength >= 70 && passwordStrength < 90 && 'Good'}
                  {passwordStrength >= 90 && 'Strong'}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
          >
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            <CardTitle>Two-Factor Authentication</CardTitle>
          </div>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
              <div className="text-sm text-muted-foreground">
                Require a verification code in addition to your password
              </div>
            </div>
            <Switch
              id="two-factor"
              checked={settings.twoFactorEnabled}
              onCheckedChange={(checked) => updateSetting('twoFactorEnabled', checked)}
            />
          </div>

          {settings.twoFactorEnabled && (
            <div className="p-2 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Setup Instructions:</p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Download an authenticator app (Google Authenticator, Authy, etc.)</li>
                <li>Scan the QR code or enter the setup key</li>
                <li>Enter the 6-digit code from your app to verify</li>
              </ol>
              <Button variant="outline" className="mt-3">
                Setup 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Timeout */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3 h-3" />
            <CardTitle>Session Timeout</CardTitle>
          </div>
          <CardDescription>Automatically log out after inactivity</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Timeout after (minutes)</Label>
            <Input
              id="session-timeout"
              type="number"
              min="5"
              max="480"
              value={settings.sessionTimeout}
              onChange={(e) => updateSetting('sessionTimeout', parseInt(e.target.value) || 30)}
            />
            <p className="text-xs text-muted-foreground">
              You'll be logged out after {settings.sessionTimeout} minutes of inactivity
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Monitor className="w-3 h-3" />
            <CardTitle>Active Sessions</CardTitle>
          </div>
          <CardDescription>Manage devices with access to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Smartphone className="w-3 h-3 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{session.device}</p>
                      {session.current && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {session.browser} · {session.ip}
                    </p>
                    <p className="text-xs text-muted-foreground">Last active: {session.lastActive}</p>
                  </div>
                </div>
                {!session.current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTerminateSession(session.id)}
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Sign Out
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Login History */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RotateCcw className="w-3 h-3" />
            <CardTitle>Login History</CardTitle>
          </div>
          <CardDescription>Recent login activity on your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loginHistory.map((login) => (
                <TableRow key={login.id}>
                  <TableCell className="font-medium">{login.timestamp}</TableCell>
                  <TableCell>{login.device}</TableCell>
                  <TableCell>{login.location}</TableCell>
                  <TableCell className="text-muted-foreground">{login.ip}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <CardTitle>API Keys</CardTitle>
          </div>
          <CardDescription>Manage API keys for programmatic access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">
            API keys allow you to access Fleet Management data programmatically.
          </div>
          <Button variant="outline">
            <Key className="w-4 h-4 mr-2" />
            Generate New API Key
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
