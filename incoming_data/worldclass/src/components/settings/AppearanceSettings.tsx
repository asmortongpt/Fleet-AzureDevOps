/**
 * Appearance Settings Component
 * Theme, colors, fonts, and display density
 */

import { Moon, Sun, MagicWand, Palette, TextAa, Sidebar } from '@phosphor-icons/react'
import { useAtom } from 'jotai'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { appearanceSettingsAtom, hasUnsavedChangesAtom } from '@/lib/reactive-state'

const colorSchemes = [
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
]

const fontSizes = [
  { value: 'small', label: 'Small', example: 'text-sm' },
  { value: 'medium', label: 'Medium', example: 'text-base' },
  { value: 'large', label: 'Large', example: 'text-lg' },
  { value: 'extra-large', label: 'Extra Large', example: 'text-xl' },
]

const densities = [
  { value: 'compact', label: 'Compact', description: 'More content, less spacing' },
  { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing' },
  { value: 'spacious', label: 'Spacious', description: 'More spacing, easier to read' },
]

export function AppearanceSettings() {
  const [settings, setSettings] = useAtom(appearanceSettingsAtom)
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
      {/* Theme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <CardTitle>Theme</CardTitle>
          </div>
          <CardDescription>Select your preferred color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.theme}
            onValueChange={(value) => updateSetting('theme', value as any)}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Light Theme */}
              <div className="relative">
                <RadioGroupItem value="light" id="theme-light" className="peer sr-only" />
                <Label
                  htmlFor="theme-light"
                  className="flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <Sun className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-medium">Light</div>
                    <div className="text-xs text-muted-foreground">Bright and clean</div>
                  </div>
                </Label>
              </div>

              {/* Dark Theme */}
              <div className="relative">
                <RadioGroupItem value="dark" id="theme-dark" className="peer sr-only" />
                <Label
                  htmlFor="theme-dark"
                  className="flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <Moon className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-medium">Dark</div>
                    <div className="text-xs text-muted-foreground">Easy on the eyes</div>
                  </div>
                </Label>
              </div>

              {/* Auto Theme */}
              <div className="relative">
                <RadioGroupItem value="auto" id="theme-auto" className="peer sr-only" />
                <Label
                  htmlFor="theme-auto"
                  className="flex flex-col items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                >
                  <MagicWand className="w-8 h-8" />
                  <div className="text-center">
                    <div className="font-medium">Auto</div>
                    <div className="text-xs text-muted-foreground">Follow system</div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Color Scheme */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            <CardTitle>Color Scheme</CardTitle>
          </div>
          <CardDescription>Choose your accent color</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.colorScheme}
            onValueChange={(value) => updateSetting('colorScheme', value as any)}
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {colorSchemes.map((scheme) => (
                <div key={scheme.value} className="relative">
                  <RadioGroupItem
                    value={scheme.value}
                    id={`color-${scheme.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`color-${scheme.value}`}
                    className="flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className={`w-8 h-8 rounded-full ${scheme.color}`} />
                    <div className="text-sm font-medium">{scheme.label}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Font Size */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TextAa className="w-5 h-5" />
            <CardTitle>Font Size</CardTitle>
          </div>
          <CardDescription>Adjust text size for better readability</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.fontSize}
            onValueChange={(value) => updateSetting('fontSize', value as any)}
          >
            <div className="space-y-3">
              {fontSizes.map((size) => (
                <div key={size.value} className="relative">
                  <RadioGroupItem
                    value={size.value}
                    id={`size-${size.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`size-${size.value}`}
                    className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className={size.example}>Aa</div>
                    <div className="flex-1">{size.label}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Display Density */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TextAa className="w-5 h-5" />
            <CardTitle>Display Density</CardTitle>
          </div>
          <CardDescription>Control spacing and information density</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.density}
            onValueChange={(value) => updateSetting('density', value as any)}
          >
            <div className="space-y-3">
              {densities.map((density) => (
                <div key={density.value} className="relative">
                  <RadioGroupItem
                    value={density.value}
                    id={`density-${density.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`density-${density.value}`}
                    className="flex flex-col gap-1 p-3 border-2 rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className="font-medium">{density.label}</div>
                    <div className="text-sm text-muted-foreground">{density.description}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Interface Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sidebar className="w-5 h-5" />
            <CardTitle>Interface Options</CardTitle>
          </div>
          <CardDescription>Customize your interface experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sidebar-collapsed">Collapse Sidebar by Default</Label>
              <div className="text-sm text-muted-foreground">
                Start with a collapsed sidebar for more screen space
              </div>
            </div>
            <Switch
              id="sidebar-collapsed"
              checked={settings.sidebarCollapsed}
              onCheckedChange={(checked) => updateSetting('sidebarCollapsed', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="animations-enabled">Enable Animations</Label>
              <div className="text-sm text-muted-foreground">
                Smooth transitions and effects (disable for better performance)
              </div>
            </div>
            <Switch
              id="animations-enabled"
              checked={settings.animationsEnabled}
              onCheckedChange={(checked) => updateSetting('animationsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
