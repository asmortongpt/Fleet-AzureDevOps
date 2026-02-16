/**
 * Theme Selector Component
 * Allows users to select from preset themes or create custom themes
 */

import { useState } from 'react'
import { ChevronDown, Eye, EyeOff, Plus, Zap } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  useTheme,
  PRESET_THEMES,
  getAccessibilityThemes,
  getWCAGAAAThemes,
  validateThemeContrast,
} from '@/lib/themes'
import type { Theme } from '@/lib/themes'

interface ThemeSelectorProps {
  onThemeChange?: (theme: Theme) => void
}

export function ThemeSelector({ onThemeChange }: ThemeSelectorProps) {
  const { currentTheme, setTheme, validateContrast } = useTheme()
  const [showAccessibility, setShowAccessibility] = useState(false)
  const [showContrastInfo, setShowContrastInfo] = useState(false)
  const [contrastValidation, setContrastValidation] = useState<any>(null)

  const themesToShow = showAccessibility ? getAccessibilityThemes() : PRESET_THEMES
  const wcagAAAThemes = getWCAGAAAThemes()

  const handleThemeChange = (themeId: string) => {
    const theme = PRESET_THEMES.find((t) => t.id === themeId)
    if (theme) {
      setTheme(theme)
      onThemeChange?.(theme)
    }
  }

  const handleValidateContrast = () => {
    const validation = validateContrast()
    setContrastValidation(validation)
    setShowContrastInfo(true)
  }

  const getWCAGBadge = (level: string) => {
    const colors = {
      A: 'bg-yellow-100 text-yellow-900',
      AA: 'bg-blue-100 text-blue-900',
      AAA: 'bg-green-100 text-green-900',
    }
    return colors[level as keyof typeof colors] || colors.A
  }

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Theme Selection</CardTitle>
              <CardDescription>Choose your preferred theme or customize your own</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAccessibility(!showAccessibility)}
              className="gap-2"
            >
              <Zap className="w-4 h-4" />
              {showAccessibility ? 'All Themes' : 'Accessibility'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <RadioGroup value={currentTheme.id} onValueChange={handleThemeChange}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {themesToShow.map((theme) => (
                <div key={theme.id} className="relative">
                  <RadioGroupItem value={theme.id} id={`theme-${theme.id}`} className="peer sr-only" />
                  <Label
                    htmlFor={`theme-${theme.id}`}
                    className="flex flex-col gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 transition-all"
                  >
                    {/* Theme Preview Colors */}
                    <div className="flex gap-2">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.colors.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.colors.secondary }}
                        title="Secondary"
                      />
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: theme.colors.accent }}
                        title="Accent"
                      />
                    </div>

                    {/* Theme Name */}
                    <div>
                      <div className="font-medium">{theme.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {theme.variant === 'custom' ? 'Custom' : theme.variant}
                      </div>
                    </div>

                    {/* WCAG Level Badge */}
                    {theme.wcagLevel && (
                      <div className={`inline-block w-fit px-2 py-1 rounded text-xs font-semibold ${getWCAGBadge(theme.wcagLevel)}`}>
                        WCAG {theme.wcagLevel}
                      </div>
                    )}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Contrast Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Contrast Validation
              </CardTitle>
              <CardDescription>Verify WCAG compliance for the current theme</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleValidateContrast}
            >
              Check Contrast
            </Button>
          </div>
        </CardHeader>

        {showContrastInfo && contrastValidation && (
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-sm font-semibold text-green-900">Valid: {contrastValidation.valid ? 'Yes' : 'No'}</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm font-semibold text-blue-900">
                  Level: {currentTheme.wcagLevel || 'N/A'}
                </div>
              </div>
            </div>

            {contrastValidation.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Issues Found:</h4>
                <ul className="space-y-1">
                  {contrastValidation.issues.map((issue: string, idx: number) => (
                    <li key={idx} className="text-xs text-destructive flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{issue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {Object.entries(contrastValidation.ratios).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Contrast Ratios:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(contrastValidation.ratios).map(([pair, ratio]: [string, unknown]) => (
                    <div key={pair} className="text-xs p-2 bg-muted rounded">
                      <div className="font-mono font-semibold">{String(ratio)}</div>
                      <div className="text-muted-foreground">{pair}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Accessibility Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Accessibility Options
          </CardTitle>
          <CardDescription>Enhanced accessibility features for better usability</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reduced-motion">Reduce Motion</Label>
              <div className="text-sm text-muted-foreground">
                Minimize animations and transitions
              </div>
            </div>
            <Switch id="reduced-motion" defaultChecked={false} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="focus-indicators">Enhanced Focus Indicators</Label>
              <div className="text-sm text-muted-foreground">
                Make keyboard focus more visible
              </div>
            </div>
            <Switch id="focus-indicators" defaultChecked={true} />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="color-patterns">Color + Patterns</Label>
              <div className="text-sm text-muted-foreground">
                Add patterns to color-coded elements for colorblind accessibility
              </div>
            </div>
            <Switch id="color-patterns" defaultChecked={true} />
          </div>
        </CardContent>
      </Card>

      {/* WCAG AAA Themes Spotlight */}
      {wcagAAAThemes.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2 text-green-900">
              <Zap className="w-4 h-4" />
              WCAG AAA Compliant Themes
            </CardTitle>
            <CardDescription className="text-green-700">
              These themes meet the highest accessibility standards (7:1 contrast ratio)
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2">
              {wcagAAAThemes.map((theme) => (
                <Button
                  key={theme.id}
                  variant={currentTheme.id === theme.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleThemeChange(theme.id)}
                  className="gap-2"
                >
                  {theme.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Theme Builder Teaser */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Custom Theme Builder
          </CardTitle>
          <CardDescription>Create your own accessible theme with custom colors</CardDescription>
        </CardHeader>

        <CardContent>
          <Button variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Create Custom Theme
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
