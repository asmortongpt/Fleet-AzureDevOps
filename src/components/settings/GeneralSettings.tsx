/**
 * General Settings Component
 * Language, timezone, date/time format, and display preferences
 */

import { Globe, Calendar, House } from '@phosphor-icons/react'
import { useAtom } from 'jotai'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generalSettingsAtom, hasUnsavedChangesAtom } from '@/lib/reactive-state'

const languages = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es-ES', label: 'Spanish' },
  { value: 'fr-FR', label: 'French' },
  { value: 'de-DE', label: 'German' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
]

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

const dateFormats = [
  { value: 'MM/DD/YYYY', label: '12/31/2025 (MM/DD/YYYY)' },
  { value: 'DD/MM/YYYY', label: '31/12/2025 (DD/MM/YYYY)' },
  { value: 'YYYY-MM-DD', label: '2025-12-31 (YYYY-MM-DD)' },
  { value: 'MMM DD, YYYY', label: 'Dec 31, 2025 (MMM DD, YYYY)' },
  { value: 'DD MMM YYYY', label: '31 Dec 2025 (DD MMM YYYY)' },
]

const numberFormats = [
  { value: 'us', label: '1,234.56 (US)' },
  { value: 'eu', label: '1.234,56 (EU)' },
  { value: 'uk', label: '1,234.56 (UK)' },
]

const dashboards = [
  { value: 'dashboard', label: 'Fleet Dashboard' },
  { value: 'executive-dashboard', label: 'Executive Dashboard' },
  { value: 'gps-tracking', label: 'GPS Tracking' },
  { value: 'gis-map', label: 'GIS Command Center' },
]

const itemsPerPageOptions = [
  { value: '10', label: '10 items' },
  { value: '25', label: '25 items' },
  { value: '50', label: '50 items' },
  { value: '100', label: '100 items' },
]

export function GeneralSettings() {
  const [settings, setSettings] = useAtom(generalSettingsAtom)
  const [, setHasUnsavedChanges] = useAtom(hasUnsavedChangesAtom)

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    setSettings({ ...settings, [key]: value })
    setHasUnsavedChanges(true)
  }

  return (
    <div className="space-y-6">
      {/* Language & Region */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <CardTitle>Language & Region</CardTitle>
          </div>
          <CardDescription>
            Set your preferred language and regional settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language">Language</Label>
            <Select
              value={settings.language}
              onValueChange={(value) => updateSetting('language', value)}
            >
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={settings.timezone}
              onValueChange={(value) => updateSetting('timezone', value)}
            >
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numberFormat">Number Format</Label>
            <Select
              value={settings.numberFormat}
              onValueChange={(value) => updateSetting('numberFormat', value as any)}
            >
              <SelectTrigger id="numberFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {numberFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time Format */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <CardTitle>Date & Time Format</CardTitle>
          </div>
          <CardDescription>Choose how dates and times are displayed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={settings.dateFormat}
              onValueChange={(value) => updateSetting('dateFormat', value)}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select
              value={settings.timeFormat}
              onValueChange={(value) => updateSetting('timeFormat', value as any)}
            >
              <SelectTrigger id="timeFormat">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (1:30 PM)</SelectItem>
                <SelectItem value="24h">24-hour (13:30)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Default Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <House className="w-5 h-5" />
            <CardTitle>Default Preferences</CardTitle>
          </div>
          <CardDescription>Set your default dashboard and display options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="defaultDashboard">Default Dashboard</Label>
            <Select
              value={settings.defaultDashboard}
              onValueChange={(value) => updateSetting('defaultDashboard', value)}
            >
              <SelectTrigger id="defaultDashboard">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dashboards.map((dashboard) => (
                  <SelectItem key={dashboard.value} value={dashboard.value}>
                    {dashboard.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemsPerPage">Items Per Page</Label>
            <Select
              value={settings.itemsPerPage.toString()}
              onValueChange={(value) => updateSetting('itemsPerPage', parseInt(value))}
            >
              <SelectTrigger id="itemsPerPage">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {itemsPerPageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
