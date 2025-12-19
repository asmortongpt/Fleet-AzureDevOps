/**
 * Notification Settings Component
 * Email, push, in-app notifications, and quiet hours
 */

import { Bell, Envelope, DeviceMobile, Moon } from '@phosphor-icons/react'
import { useAtom } from 'jotai'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { notificationSettingsAtom, hasUnsavedChangesAtom } from '@/lib/reactive-state'

const frequencies = [
  { value: 'realtime', label: 'Real-time', description: 'Instant notifications' },
  { value: 'hourly', label: 'Hourly', description: 'Batched every hour' },
  { value: 'daily', label: 'Daily', description: 'Once per day digest' },
]

export function NotificationSettings() {
  const [settings, setSettings] = useAtom(notificationSettingsAtom)
  const [, setHasUnsavedChanges] = useAtom(hasUnsavedChangesAtom)

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    setSettings({ ...settings, [key]: value })
    setHasUnsavedChanges(true)
  }

  const updateEmailNotification = (key: keyof typeof settings.emailNotifications, value: boolean) => {
    setSettings({
      ...settings,
      emailNotifications: {
        ...settings.emailNotifications,
        [key]: value,
      },
    })
    setHasUnsavedChanges(true)
  }

  const requestPushPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        updateSetting('pushNotifications', true)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Envelope className="w-5 h-5" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>Choose which emails you want to receive</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-maintenance">Maintenance Reminders</Label>
              <div className="text-sm text-muted-foreground">
                Scheduled maintenance and service alerts
              </div>
            </div>
            <Switch
              id="email-maintenance"
              checked={settings.emailNotifications.maintenance}
              onCheckedChange={(checked) => updateEmailNotification('maintenance', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-alerts">Critical Alerts</Label>
              <div className="text-sm text-muted-foreground">
                Vehicle alerts and warnings
              </div>
            </div>
            <Switch
              id="email-alerts"
              checked={settings.emailNotifications.alerts}
              onCheckedChange={(checked) => updateEmailNotification('alerts', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-reports">Weekly Reports</Label>
              <div className="text-sm text-muted-foreground">
                Fleet analytics and summaries
              </div>
            </div>
            <Switch
              id="email-reports"
              checked={settings.emailNotifications.reports}
              onCheckedChange={(checked) => updateEmailNotification('reports', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-updates">Product Updates</Label>
              <div className="text-sm text-muted-foreground">
                New features and announcements
              </div>
            </div>
            <Switch
              id="email-updates"
              checked={settings.emailNotifications.updates}
              onCheckedChange={(checked) => updateEmailNotification('updates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>In-App Notifications</CardTitle>
          </div>
          <CardDescription>Notifications within the application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="in-app-notifications">Enable In-App Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Show notifications in the notification center
              </div>
            </div>
            <Switch
              id="in-app-notifications"
              checked={settings.inAppNotifications}
              onCheckedChange={(checked) => updateSetting('inAppNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-enabled">Notification Sounds</Label>
              <div className="text-sm text-muted-foreground">
                Play sound for new notifications
              </div>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <DeviceMobile className="w-5 h-5" />
            <CardTitle>Push Notifications</CardTitle>
          </div>
          <CardDescription>Browser push notifications (requires permission)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Enable Push Notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications even when the app is not open
              </div>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => {
                if (checked) {
                  requestPushPermission()
                } else {
                  updateSetting('pushNotifications', false)
                }
              }}
            />
          </div>

          {!settings.pushNotifications && (
            <Button onClick={requestPushPermission} variant="outline" className="w-full">
              Request Browser Permission
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Notification Frequency */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <CardTitle>Notification Frequency</CardTitle>
          </div>
          <CardDescription>How often you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.notificationFrequency}
            onValueChange={(value) => updateSetting('notificationFrequency', value as any)}
          >
            <div className="space-y-3">
              {frequencies.map((freq) => (
                <div key={freq.value} className="relative">
                  <RadioGroupItem
                    value={freq.value}
                    id={`freq-${freq.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`freq-${freq.value}`}
                    className="flex flex-col gap-1 p-3 border-2 rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className="font-medium">{freq.label}</div>
                    <div className="text-sm text-muted-foreground">{freq.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Moon className="w-5 h-5" />
            <CardTitle>Quiet Hours</CardTitle>
          </div>
          <CardDescription>Pause notifications during specific hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quiet-hours-enabled">Enable Quiet Hours</Label>
              <div className="text-sm text-muted-foreground">
                Mute non-critical notifications during these hours
              </div>
            </div>
            <Switch
              id="quiet-hours-enabled"
              checked={settings.quietHoursEnabled}
              onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
            />
          </div>

          {settings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
