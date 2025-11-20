/**
 * Notification System Hook
 * Browser push notifications for Teams and Outlook
 */

import { useEffect, useState } from 'react'
import { NotificationSettings, PushNotification } from '@/types/microsoft'

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
      if (notification.data?.url) {
        window.location.href = notification.data?.url
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
