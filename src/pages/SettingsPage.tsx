/**
 * Settings Page - Main Settings Interface
 * Tabbed interface with left sidebar navigation on desktop, top tabs on mobile
 */

import {
  Gear,
  Palette,
  Bell,
  Car,
  ShieldCheck,
  Lock,
  Code,
  FloppyDisk,
  Check,
} from '@phosphor-icons/react'
import { useAtom } from 'jotai'
import { useState, useEffect } from 'react'

import { AdvancedSettings } from '@/components/settings/AdvancedSettings'
import { AppearanceSettings } from '@/components/settings/AppearanceSettings'
import { DataPrivacySettings } from '@/components/settings/DataPrivacySettings'
import { FleetSettings } from '@/components/settings/FleetSettings'
import { GeneralSettings } from '@/components/settings/GeneralSettings'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { hasUnsavedChangesAtom } from '@/lib/reactive-state'

type SettingsTab =
  | 'general'
  | 'appearance'
  | 'notifications'
  | 'fleet'
  | 'security'
  | 'privacy'
  | 'advanced'

interface SettingsCategory {
  id: SettingsTab
  label: string
  icon: React.ReactNode
  description: string
}

const settingsCategories: SettingsCategory[] = [
  {
    id: 'general',
    label: 'General',
    icon: <Gear className="w-4 h-4" />,
    description: 'Language, timezone, and format preferences',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: <Palette className="w-4 h-4" />,
    description: 'Theme, colors, and display options',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: <Bell className="w-4 h-4" />,
    description: 'Email, push, and alert preferences',
  },
  {
    id: 'fleet',
    label: 'Fleet',
    icon: <Car className="w-4 h-4" />,
    description: 'Fleet-specific settings and units',
  },
  {
    id: 'security',
    label: 'Security',
    icon: <ShieldCheck className="w-4 h-4" />,
    description: 'Password, 2FA, and session management',
  },
  {
    id: 'privacy',
    label: 'Data & Privacy',
    icon: <Lock className="w-4 h-4" />,
    description: 'Data retention and privacy preferences',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: <Code className="w-4 h-4" />,
    description: 'Developer mode and feature flags',
  },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useAtom(hasUnsavedChangesAtom)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingTab, setPendingTab] = useState<SettingsTab | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Handle keyboard shortcuts (Cmd+S / Ctrl+S to save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (hasUnsavedChanges) {
          handleSave()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasUnsavedChanges])

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleTabChange = (newTab: string) => {
    if (hasUnsavedChanges) {
      setPendingTab(newTab as SettingsTab)
      setShowUnsavedDialog(true)
    } else {
      setActiveTab(newTab as SettingsTab)
    }
  }

  const handleDiscardChanges = () => {
    setHasUnsavedChanges(false)
    if (pendingTab) {
      setActiveTab(pendingTab)
      setPendingTab(null)
    }
    setShowUnsavedDialog(false)
  }

  const handleSave = () => {
    // Settings are auto-saved via atomWithStorage
    // This just provides visual feedback
    setHasUnsavedChanges(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />
      case 'appearance':
        return <AppearanceSettings />
      case 'notifications':
        return <NotificationSettings />
      case 'fleet':
        return <FleetSettings />
      case 'security':
        return <SecuritySettings />
      case 'privacy':
        return <DataPrivacySettings />
      case 'advanced':
        return <AdvancedSettings />
      default:
        return <GeneralSettings />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Save Button */}
        {hasUnsavedChanges && (
          <Button onClick={handleSave} className="gap-2">
            <FloppyDisk className="w-4 h-4" />
            Save Changes
          </Button>
        )}

        {/* Save Success Indicator */}
        {saveSuccess && (
          <Badge variant="outline" className="gap-2 bg-green-50 text-green-700 border-green-200">
            <Check className="w-4 h-4" />
            Saved
          </Badge>
        )}
      </div>

      {/* Desktop Layout: Sidebar + Content */}
      <div className="hidden md:flex gap-6">
        {/* Sidebar Navigation */}
        <Card className="w-64 h-fit">
          <CardHeader>
            <CardTitle className="text-sm">Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-1 p-2">
                {settingsCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleTabChange(category.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      activeTab === category.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <span className="mt-0.5">{category.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{category.label}</div>
                      <div
                        className={`text-xs mt-0.5 ${
                          activeTab === category.id
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {category.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Content Area */}
        <div className="flex-1">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="pr-4">{renderContent()}</div>
          </ScrollArea>
        </div>
      </div>

      {/* Mobile Layout: Tabs */}
      <div className="md:hidden">
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start overflow-x-auto">
            {settingsCategories.map((category) => (
              <TabsTrigger key={category.id} value={category.id} className="gap-2">
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <ScrollArea className="h-[calc(100vh-250px)]">{renderContent()}</ScrollArea>
          </div>
        </Tabs>
      </div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to discard them and continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDiscardChanges} className="bg-destructive">
              Discard Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Keyboard Shortcut Hint */}
      <div className="text-xs text-muted-foreground text-center">
        Press <kbd className="px-2 py-1 bg-muted rounded">Cmd/Ctrl + S</kbd> to save changes
      </div>
    </div>
  )
}
