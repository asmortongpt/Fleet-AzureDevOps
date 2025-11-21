/**
 * Notification System Hook
 * Browser push notifications for Teams and Outlook
 */

import { useEffect, useState } from 'react'
import { NotificationSettings, PushNotification } from '@/types/microsoft'

/**
 * SECURITY: Allowed redirect hosts for notification URLs
 * Prevents open redirect vulnerabilities (CWE-601)
 */
const ALLOWED_REDIRECT_HOSTS = [
  'purple-river-0f465960f.3.azurestaticapps.net',
  'fleet.capitaltechalliance.com',
  'capitaltechalliance.com',
  'localhost',
  '127.0.0.1'
]

/**
 * Validates a redirect URL against the allowed hosts whitelist
 * @param url - The URL to validate
 * @returns true if URL is safe to redirect to
 */
function validateRedirectUrl(url: string): boolean {
  // Allow internal paths (must start with / but not //)
  if (url.startsWith('/') && !url.startsWith('//')) {
    // Block dangerous pseudo-protocols in paths
    const dangerousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /%2[fF]%2[fF]/, // Encoded //
    ]
    return !dangerousPatterns.some(pattern => pattern.test(url))
  }

  try {
    const parsed = new URL(url)

    // Block dangerous schemes
    const dangerousSchemes = ['javascript:', 'data:', 'file:', 'vbscript:', 'about:']
    if (dangerousSchemes.includes(parsed.protocol)) {
      console.warn(`[Security] Blocked redirect to dangerous scheme: ${parsed.protocol}`)
      return false
    }

    // Only allow http: and https: protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.warn(`[Security] Blocked redirect to non-HTTP(S) protocol: ${parsed.protocol}`)
      return false
    }

    // Check if hostname is in whitelist
    const hostname = parsed.hostname.toLowerCase()
    const isWhitelisted = ALLOWED_REDIRECT_HOSTS.some(domain => {
      const normalizedDomain = domain.toLowerCase()
      return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`)
    })

    if (!isWhitelisted) {
      console.warn(`[Security] Blocked redirect to non-whitelisted domain: ${hostname}`)
      return false
    }

    return true
  } catch {
    console.warn(`[Security] Invalid redirect URL format: ${url}`)
    return false
  }
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: true,
  teams: {
    allMessages: false,
    mentions: true,
    directMessages: true
  },
  email: {
    all: false,
    important: true,
    fromVendors: true
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notification-settings')
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS
  })

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission()
      setPermission(result)
      return result
    }
    return 'denied'
  }

  const showNotification = (notification: PushNotification) => {
    if (!settings.enabled || !settings.desktop) return
    if (permission !== 'granted') return

    // Check quiet hours
    if (settings.quietHours.enabled) {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
      if (currentTime >= settings.quietHours.start || currentTime <= settings.quietHours.end) {
        return
      }
    }

    const notif = new Notification(notification.title, {
      body: notification.body,
      icon: notification.icon || '/icons/notification.png',
      badge: notification.badge || '/icons/badge.png',
      tag: notification.tag,
      requireInteraction: notification.requireInteraction,
      data: notification.data
    })

    notif.onclick = () => {
      window.focus()
      notif.close()
      // SECURITY FIX (CWE-601): Validate redirect URL before navigation
      if (notification.data?.url) {
        const targetUrl = notification.data.url
        if (validateRedirectUrl(targetUrl)) {
          window.location.href = targetUrl
        } else {
          console.warn('[Security] Blocked potentially malicious redirect from notification')
        }
      }
    }

    if (settings.sound) {
      const audio = new Audio('/sounds/notification.mp3')
      audio.play().catch(() => {})
    }
  }

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)
    localStorage.setItem('notification-settings', JSON.stringify(updated))
  }

  return {
    permission,
    settings,
    requestPermission,
    showNotification,
    updateSettings
  }
}
