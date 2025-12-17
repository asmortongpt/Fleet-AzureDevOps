/**
 * Data & Privacy Settings Component
 * Data retention, export, deletion, and privacy preferences
 */

import { useState } from 'react'
import { useAtom } from 'jotai'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { dataPrivacySettingsAtom, hasUnsavedChangesAtom } from '@/lib/reactive-state'
import logger from '@/utils/logger';
import {
  Lock,
  Download,
  Trash,
  Cookie,
  ChartLine,
  FileText,
  Warning
} from '@phosphor-icons/react'

const retentionPeriods = [
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '180', label: '6 months' },
  { value: '365', label: '1 year' },
  { value: '730', label: '2 years' },
  { value: '1825', label: '5 years' },
  { value: '-1', label: 'Forever' },
]

export function DataPrivacySettings() {
  const [settings, setSettings] = useAtom(dataPrivacySettingsAtom)
  const [, setHasUnsavedChanges] = useAtom(hasUnsavedChangesAtom)
  const [isExporting, setIsExporting] = useState(false)

  const updateSetting = <K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K]
  ) => {
    setSettings({ ...settings, [key]: value })
    setHasUnsavedChanges(true)
  }

  const updateCookiePreference = (
    key: keyof typeof settings.cookiePreferences,
    value: boolean
  ) => {
    setSettings({
      ...settings,
      cookiePreferences: {
        ...settings.cookiePreferences,
        [key]: value,
      },
    })
    setHasUnsavedChanges(true)
  }

  const handleExportData = async () => {
    setIsExporting(true)
    // Simulate export process
    setTimeout(() => {
      setIsExporting(false)
      // In real app, this would trigger a download
      logger.debug('Exporting user data...')
    }, 2000)
  }

  const handleDeleteAccount = () => {
    // In real app, this would call an API
    logger.debug('Deleting account...')
  }

  return (
    <div className="space-y-6">
      {/* Data Retention */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            <CardTitle>Data Retention</CardTitle>
          </div>
          <CardDescription>
            How long we keep your fleet and activity data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="retention-period">Data Retention Period</Label>
            <Select
              value={settings.dataRetentionPeriod.toString()}
              onValueChange={(value) => updateSetting('dataRetentionPeriod', parseInt(value))}
            >
              <SelectTrigger id="retention-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {retentionPeriods.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Data older than this period will be automatically deleted
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cookie Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Cookie className="w-5 h-5" />
            <CardTitle>Cookie Preferences</CardTitle>
          </div>
          <CardDescription>Manage how we use cookies on this site</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="necessary-cookies">Necessary Cookies</Label>
              <div className="text-sm text-muted-foreground">
                Required for the site to function properly
              </div>
            </div>
            <Switch
              id="necessary-cookies"
              checked={settings.cookiePreferences.necessary}
              disabled
              aria-label="Necessary cookies are always enabled"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics-cookies">Analytics Cookies</Label>
              <div className="text-sm text-muted-foreground">
                Help us improve by analyzing how you use the site
              </div>
            </div>
            <Switch
              id="analytics-cookies"
              checked={settings.cookiePreferences.analytics}
              onCheckedChange={(checked) => updateCookiePreference('analytics', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketing-cookies">Marketing Cookies</Label>
              <div className="text-sm text-muted-foreground">
                Used to show you relevant advertisements
              </div>
            </div>
            <Switch
              id="marketing-cookies"
              checked={settings.cookiePreferences.marketing}
              onCheckedChange={(checked) => updateCookiePreference('marketing', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ChartLine className="w-5 h-5" />
            <CardTitle>Analytics & Tracking</CardTitle>
          </div>
          <CardDescription>Control how your data is used for analytics</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="analytics-enabled">Enable Analytics</Label>
              <div className="text-sm text-muted-foreground">
                Allow collection of anonymized usage statistics
              </div>
            </div>
            <Switch
              id="analytics-enabled"
              checked={settings.analyticsEnabled}
              onCheckedChange={(checked) => updateSetting('analyticsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Export Data */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            <CardTitle>Export Your Data</CardTitle>
          </div>
          <CardDescription>Download a copy of all your data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can request a copy of all your personal data and fleet information. We'll prepare
            a downloadable archive in JSON format.
          </p>
          <Button onClick={handleExportData} disabled={isExporting} className="gap-2">
            <Download className="w-4 h-4" />
            {isExporting ? 'Preparing Export...' : 'Request Data Export'}
          </Button>
        </CardContent>
      </Card>

      {/* Privacy Policy */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <CardTitle>Privacy Policy</CardTitle>
          </div>
          <CardDescription>Review our privacy practices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Learn more about how we collect, use, and protect your data.
          </p>
          <Button variant="outline" asChild>
            <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
              View Privacy Policy
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash className="w-5 h-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>Permanently delete your account and all data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <Warning className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-destructive">This action cannot be undone!</p>
              <p className="text-muted-foreground mt-1">
                Deleting your account will permanently remove all your data, including fleet
                information, reports, and settings.
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash className="w-4 h-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account and
                  remove all your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Yes, Delete My Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
