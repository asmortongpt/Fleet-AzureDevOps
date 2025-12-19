/**
 * Fleet Settings Component
 * Fleet-specific preferences: units, view defaults, and map settings
 */

import { Car, Ruler, MapTrifold, ArrowsClockwise } from '@phosphor-icons/react'
import { useAtom } from 'jotai'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { fleetSettingsAtom, hasUnsavedChangesAtom } from '@/lib/reactive-state'

const viewOptions = [
  { value: 'list', label: 'List View' },
  { value: 'grid', label: 'Grid View' },
  { value: 'map', label: 'Map View' },
]

const mapProviders = [
  { value: 'google', label: 'Google Maps' },
  { value: 'mapbox', label: 'Mapbox' },
  { value: 'arcgis', label: 'ArcGIS' },
]

export function FleetSettings() {
  const [settings, setSettings] = useAtom(fleetSettingsAtom)
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
      {/* Default View */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            <CardTitle>Default Vehicle View</CardTitle>
          </div>
          <CardDescription>Choose how vehicles are displayed by default</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={settings.defaultView}
            onValueChange={(value) => updateSetting('defaultView', value as any)}
          >
            <div className="grid grid-cols-3 gap-3">
              {viewOptions.map((view) => (
                <div key={view.value} className="relative">
                  <RadioGroupItem
                    value={view.value}
                    id={`view-${view.value}`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`view-${view.value}`}
                    className="flex flex-col items-center gap-2 p-3 border-2 rounded-lg cursor-pointer hover:border-primary peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className="text-sm font-medium">{view.label}</div>
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Auto-Refresh Interval */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ArrowsClockwise className="w-5 h-5" />
            <CardTitle>Auto-Refresh Interval</CardTitle>
          </div>
          <CardDescription>
            How often to refresh vehicle data (in seconds)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Refresh every {settings.autoRefreshInterval} seconds</Label>
            </div>
            <Slider
              value={[settings.autoRefreshInterval]}
              onValueChange={([value]) => updateSetting('autoRefreshInterval', value)}
              min={10}
              max={300}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10s</span>
              <span>5min</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            <CardTitle>Unit Preferences</CardTitle>
          </div>
          <CardDescription>Select your preferred measurement units</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="distance-unit">Distance Unit</Label>
            <Select
              value={settings.distanceUnit}
              onValueChange={(value) => updateSetting('distanceUnit', value as any)}
            >
              <SelectTrigger id="distance-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="miles">Miles (mi)</SelectItem>
                <SelectItem value="kilometers">Kilometers (km)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fuel-unit">Fuel Unit</Label>
            <Select
              value={settings.fuelUnit}
              onValueChange={(value) => updateSetting('fuelUnit', value as any)}
            >
              <SelectTrigger id="fuel-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gallons">Gallons (gal)</SelectItem>
                <SelectItem value="liters">Liters (L)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperature-unit">Temperature Unit</Label>
            <Select
              value={settings.temperatureUnit}
              onValueChange={(value) => updateSetting('temperatureUnit', value as any)}
            >
              <SelectTrigger id="temperature-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                <SelectItem value="celsius">Celsius (°C)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Map Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapTrifold className="w-5 h-5" />
            <CardTitle>Map Settings</CardTitle>
          </div>
          <CardDescription>Map provider and geofence preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="map-provider">Map Provider</Label>
            <Select
              value={settings.mapProvider}
              onValueChange={(value) => updateSetting('mapProvider', value as any)}
            >
              <SelectTrigger id="map-provider">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {mapProviders.map((provider) => (
                  <SelectItem key={provider.value} value={provider.value}>
                    {provider.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="geofence-alerts">Geofence Alerts</Label>
              <div className="text-sm text-muted-foreground">
                Notify when vehicles enter or exit geofenced areas
              </div>
            </div>
            <Switch
              id="geofence-alerts"
              checked={settings.geofenceAlertsEnabled}
              onCheckedChange={(checked) => updateSetting('geofenceAlertsEnabled', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
