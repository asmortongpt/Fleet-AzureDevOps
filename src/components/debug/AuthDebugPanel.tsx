/**
 * Auth Debug Panel - Development Only
 *
 * Shows current authentication state, token information, and debugging tools.
 * Only renders in development mode.
 *
 * Usage:
 *   import { AuthDebugPanel } from '@/components/debug/AuthDebugPanel';
 *
 *   {import.meta.env.DEV && <AuthDebugPanel />}
 */

import { useMsal } from '@azure/msal-react';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  LogOut,
  CheckCircle,
  Clock,
  User,
  Key,
  Shield
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts';
import { formatDateTime } from '@/utils/format-helpers';
import logger from '@/utils/logger';


interface DecodedToken {
  header: any;
  payload: any;
  signature: string;
}

export function AuthDebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<DecodedToken | null>(null);
  const [timeToExpiry, setTimeToExpiry] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { user, isAuthenticated, logout, refreshToken } = useAuth();
  const { instance, accounts } = useMsal();

  // Decode token from sessionStorage (MSAL)
  useEffect(() => {
    if (!isAuthenticated) {
      setTokenInfo(null);
      return;
    }

    try {
      // Try to get token from MSAL cache
      const tokenKeys = Object.keys(sessionStorage).filter(k =>
        k.includes('msal.token') && k.includes('accesstoken')
      );

      if (tokenKeys.length > 0) {
        const tokenData = sessionStorage.getItem(tokenKeys[0]);
        if (tokenData) {
          const parsed = JSON.parse(tokenData);
          const token = parsed.secret;

          if (token && typeof token === 'string') {
            const parts = token.split('.');
            if (parts.length === 3) {
              const decoded: DecodedToken = {
                header: JSON.parse(atob(parts[0])),
                payload: JSON.parse(atob(parts[1])),
                signature: parts[2]
              };
              setTokenInfo(decoded);
            }
          }
        }
      }
    } catch (error) {
      logger.error('[AuthDebugPanel] Error decoding token:', error);
    }
  }, [isAuthenticated, accounts]);

  // Calculate time to expiry
  useEffect(() => {
    if (!tokenInfo?.payload?.exp) {
      setTimeToExpiry('');
      return;
    }

    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000);
      const exp = tokenInfo.payload.exp;
      const diff = exp - now;

      if (diff <= 0) {
        setTimeToExpiry('EXPIRED');
      } else {
        const hours = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;

        setTimeToExpiry(
          hours > 0
            ? `${hours}h ${minutes}m ${seconds}s`
            : `${minutes}m ${seconds}s`
        );
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [tokenInfo]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      logger.error('Failed to copy:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshToken();
      toast.success('Token refreshed successfully!');
    } catch (error) {
      toast.error('Token refresh failed: ' + (error as Error).message);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
    }
  };

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Card className="border-2 border-yellow-500 bg-[var(--surface-2)] text-white">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-yellow-500/30 bg-yellow-500/10 p-3 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => e.key === 'Enter' && setIsExpanded(!isExpanded)}
          role="button"
          tabIndex={0}
        >
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            <span className="font-bold text-sm">Auth Debug Panel</span>
            <Badge
              variant={isAuthenticated ? 'default' : 'destructive'}
              className="text-xs"
            >
              {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-white hover:bg-[var(--surface-glass-hover)]"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
            {/* User Info */}
            {user && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-emerald-400" />
                  <h3 className="font-semibold text-sm">User Information</h3>
                </div>

                <div className="bg-[var(--surface-3)] rounded p-3 space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">ID:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">{user.id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0"
                        onClick={() => copyToClipboard(user.id, 'user-id')}
                      >
                        {copiedField === 'user-id' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Email:</span>
                    <span className="text-green-400">{user.email}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Name:</span>
                    <span className="text-green-400">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Role:</span>
                    <Badge className="text-xs">{user.role}</Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Tenant:</span>
                    <span className="text-green-400">
                      {user.tenantName || user.tenantId}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Permissions:</span>
                    <span className="text-green-400">
                      {user.permissions.join(', ')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Token Info */}
            {tokenInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Key className="h-4 w-4 text-amber-400" />
                  <h3 className="font-semibold text-sm">Token Information</h3>
                </div>

                {/* Token Expiry */}
                <div className="bg-[var(--surface-3)] rounded p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-400" />
                      <span className="text-xs font-medium">Time to Expiry:</span>
                    </div>
                    <span
                      className={`text-xs font-mono font-bold ${
                        timeToExpiry === 'EXPIRED'
                          ? 'text-red-400'
                          : 'text-green-400'
                      }`}
                    >
                      {timeToExpiry || '—'}
                    </span>
                  </div>

                  {tokenInfo.payload.exp && (
                    <div className="text-xs text-[var(--text-secondary)]">
                      Expires:{' '}
                      {formatDateTime(new Date(tokenInfo.payload.exp * 1000))}
                    </div>
                  )}
                </div>

                {/* Token Header */}
                <details className="bg-[var(--surface-3)] rounded p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-emerald-400">
                    Token Header
                  </summary>
                  <pre className="mt-2 text-xs text-[var(--text-secondary)] overflow-x-auto">
                    {JSON.stringify(tokenInfo.header, null, 2)}
                  </pre>
                </details>

                {/* Token Payload */}
                <details className="bg-[var(--surface-3)] rounded p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-amber-400">
                    Token Payload
                  </summary>
                  <pre className="mt-2 text-xs text-[var(--text-secondary)] overflow-x-auto">
                    {JSON.stringify(tokenInfo.payload, null, 2)}
                  </pre>
                </details>

                {/* Signature */}
                <div className="bg-[var(--surface-3)] rounded p-3">
                  <div className="text-xs font-semibold text-orange-400 mb-2">
                    Signature (truncated)
                  </div>
                  <div className="text-xs font-mono text-[var(--text-secondary)] break-all">
                    {tokenInfo.signature.substring(0, 50)}...
                  </div>
                </div>
              </div>
            )}

            {/* MSAL Account Info */}
            {accounts.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold text-sm">MSAL Account</h3>

                <div className="bg-[var(--surface-3)] rounded p-3 space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Username:</span>
                    <span className="text-green-400">{accounts[0].username}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Name:</span>
                    <span className="text-green-400">{accounts[0].name}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Environment:</span>
                    <span className="text-green-400">
                      {accounts[0].environment}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-[var(--text-secondary)]">Tenant ID:</span>
                    <span className="text-green-400">{accounts[0].tenantId}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Session Storage Info */}
            <details className="bg-[var(--surface-3)] rounded p-3">
              <summary className="cursor-pointer text-xs font-semibold text-emerald-400">
                Session Storage Keys
              </summary>
              <div className="mt-2 space-y-1 text-xs text-[var(--text-secondary)]">
                {Object.keys(sessionStorage)
                  .filter(k => k.includes('msal'))
                  .map(key => (
                    <div key={key} className="font-mono truncate">
                      {key}
                    </div>
                  ))}
              </div>
            </details>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-[var(--border-strong)]">
              <Button
                onClick={handleRefresh}
                size="sm"
                variant="outline"
                className="flex-1 bg-emerald-500/10 border-emerald-500 text-emerald-400 hover:bg-emerald-500/20"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Token
              </Button>

              <Button
                onClick={handleLogout}
                size="sm"
                variant="outline"
                className="flex-1 bg-red-500/10 border-red-500 text-red-400 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Environment Info */}
            <div className="pt-2 border-t border-[var(--border-strong)] text-xs text-[var(--text-secondary)]">
              <div className="flex justify-between">
                <span>Environment:</span>
                <span className="font-mono">{import.meta.env.MODE}</span>
              </div>
              <div className="flex justify-between">
                <span>Client ID:</span>
                <span className="font-mono truncate max-w-[200px]">
                  {import.meta.env.VITE_AZURE_AD_CLIENT_ID?.substring(0, 8)}...
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
