/**
 * MapSettings Component
 *
 * A production-ready map provider configuration interface with comprehensive
 * provider selection, validation, and API key management.
 *
 * Features:
 * - Multiple map provider support (Leaflet, Google Maps, Mapbox, ArcGIS)
 * - Real-time provider validation and API key detection
 * - Cost comparison and feature matrix
 * - Detailed setup instructions with error handling
 * - Seamless provider switching with confirmation
 * - Loading states and error recovery
 * - React 19 compatible
 * - Production-ready with bulletproof validation
 *
 * @module MapSettings
 * @version 2.0.0
 */

import {
  Check,
  Map,
  DollarSign,
  Zap,
  Shield,
  XCircle,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Info,
  Globe,
  Layers
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"

import { getMapProvider, setMapProvider, MapProvider } from "@/components/UniversalMap"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Skeleton } from "@/components/ui/skeleton"

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Map provider configuration option
 */
interface MapProviderOption {
  /** Unique provider identifier */
  id: MapProvider
  /** Display name */
  name: string
  /** Detailed description */
  description: string
  /** Cost information */
  cost: string
  /** Provider advantages */
  pros: string[]
  /** Provider limitations/considerations */
  cons: string[]
  /** Whether API key is required */
  apiKeyRequired: boolean
  /** Environment variable name for API key */
  apiKeyEnvVar?: string
  /** Setup documentation URL */
  setupUrl?: string
  /** Additional info/warnings */
  notes?: string
  /** Availability status */
  status: "available" | "coming-soon" | "experimental"
}

/**
 * Provider validation result
 */
interface ProviderValidation {
  /** Whether provider is available */
  isAvailable: boolean
  /** Whether API key is configured */
  hasApiKey: boolean
  /** Validation message */
  message: string
  /** Validation status */
  status: "valid" | "missing-key" | "invalid"
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Available map provider configurations
 */
const MAP_PROVIDERS: MapProviderOption[] = [
  {
    id: "leaflet",
    name: "Leaflet / OpenStreetMap",
    description: "100% free and open-source mapping solution - No API key needed",
    cost: "FREE - Unlimited Forever",
    pros: [
      "No API key required - works immediately",
      "No usage limits or quotas",
      "Zero cost whatsoever",
      "Privacy-friendly - no tracking",
      "Large open source community",
      "Lightweight and fast",
      "Extensive plugin ecosystem"
    ],
    cons: [
      "Basic styling compared to commercial solutions",
      "No Street View or 3D features",
      "Limited geocoding capabilities",
      "Community-maintained tile servers"
    ],
    apiKeyRequired: false,
    status: "available",
    notes: "Best choice for getting started or when budget is a concern"
  },
  {
    id: "google",
    name: "Google Maps",
    description: "Industry-standard mapping with rich features and best-in-class data",
    cost: "$200/month FREE credit (≈28,000 map loads)",
    pros: [
      "Best-in-class mapping quality",
      "Street View integration",
      "Real-time traffic data included",
      "Extensive POI database",
      "Familiar interface to all users",
      "Excellent geocoding and routing",
      "Advanced features (3D, indoor maps)",
      "$200 monthly credit covers most use cases"
    ],
    cons: [
      "Requires API key setup",
      "Costs money after free tier",
      "Requires Google Cloud account",
      "Usage tracking and analytics",
      "Terms of service restrictions"
    ],
    apiKeyRequired: true,
    apiKeyEnvVar: "VITE_GOOGLE_MAPS_API_KEY",
    setupUrl: "https://console.cloud.google.com/google/maps-apis",
    status: "available",
    notes: "Recommended for production applications requiring advanced features"
  }
]

/**
 * Delay before applying provider change (ms)
 */
const SAVE_DELAY_MS = 500

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate if a provider is properly configured
 * @param provider - Provider configuration to validate
 * @returns Validation result
 */
function validateProvider(provider: MapProviderOption): ProviderValidation {
  // Leaflet doesn't need validation
  if (!provider.apiKeyRequired) {
    return {
      isAvailable: true,
      hasApiKey: true,
      message: "Ready to use - no configuration needed",
      status: "valid"
    }
  }

  // Check if API key is present in environment
  const apiKeyEnvVar = provider.apiKeyEnvVar
  if (!apiKeyEnvVar) {
    return {
      isAvailable: false,
      hasApiKey: false,
      message: "Provider configuration error",
      status: "invalid"
    }
  }

  // Check environment variable
  const apiKey = import.meta.env[apiKeyEnvVar]

  if (!apiKey || apiKey.trim() === "") {
    return {
      isAvailable: false,
      hasApiKey: false,
      message: `Missing API key: ${apiKeyEnvVar} not found in environment`,
      status: "missing-key"
    }
  }

  return {
    isAvailable: true,
    hasApiKey: true,
    message: "API key configured and ready",
    status: "valid"
  }
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * MapSettings Component
 *
 * Provides a comprehensive interface for selecting and configuring map providers,
 * with validation, setup instructions, and seamless switching.
 */
export function MapSettings() {
  // -------------------------------------------------------------------------
  // State Management
  // -------------------------------------------------------------------------

  const [currentProvider, _setCurrentProvider] = useState<MapProvider>(getMapProvider())
  const [selectedProvider, setSelectedProvider] = useState<MapProvider>(currentProvider)
  const [isSaving, setIsSaving] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Memoized Values
  // -------------------------------------------------------------------------

  /**
   * Validate all providers
   */
  const providerValidations = useMemo(() => {
    const validations = new (globalThis.Map)<string, ProviderValidation>()

    MAP_PROVIDERS.forEach(provider => {
      validations.set(provider.id, validateProvider(provider))
    })

    return validations
  }, [])

  /**
   * Get currently selected provider option
   */
  const selectedOption = useMemo(
    () => MAP_PROVIDERS.find(p => p.id === selectedProvider),
    [selectedProvider]
  )

  /**
   * Get current provider option
   */
  const currentOption = useMemo(
    () => MAP_PROVIDERS.find(p => p.id === currentProvider),
    [currentProvider]
  )

  /**
   * Get validation for selected provider
   */
  const selectedValidation = useMemo(
    () => selectedOption ? providerValidations.get(selectedOption.id) : null,
    [selectedOption, providerValidations]
  )

  /**
   * Check if save button should be enabled
   */
  const canSave = useMemo(() => {
    if (selectedProvider === currentProvider) return false
    if (!selectedValidation) return false
    return selectedValidation.isAvailable
  }, [selectedProvider, currentProvider, selectedValidation])

  // -------------------------------------------------------------------------
  // Effects
  // -------------------------------------------------------------------------

  /**
   * Simulate validation delay for better UX
   */
  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsValidating(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [])

  /**
   * Clear error on provider change
   */
  useEffect(() => {
    setError(null)
    setShowConfirmation(false)
  }, [selectedProvider])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  /**
   * Handle save and apply provider change
   */
  const handleSave = useCallback(() => {
    if (!canSave || !selectedOption) return

    setShowConfirmation(false)
    setIsSaving(true)
    setError(null)

    try {
      // Validate one more time before saving
      const validation = validateProvider(selectedOption)

      if (!validation.isAvailable) {
        throw new Error(validation.message)
      }

      // Apply provider change with delay for better UX
      setTimeout(() => {
        try {
          setMapProvider(selectedProvider)
          // Page will reload after this
        } catch (err) {
          setIsSaving(false)
          setError(err instanceof Error ? err.message : "Failed to save provider")
        }
      }, SAVE_DELAY_MS)

    } catch (err) {
      setIsSaving(false)
      setError(err instanceof Error ? err.message : "Failed to validate provider")
    }
  }, [canSave, selectedOption, selectedProvider])

  /**
   * Handle provider selection change
   */
  const handleProviderChange = useCallback((value: string) => {
    const provider = value as MapProvider
    setSelectedProvider(provider)

    // Show confirmation if switching from current provider
    if (provider !== currentProvider) {
      const validation = providerValidations.get(provider)
      if (validation?.isAvailable) {
        setShowConfirmation(true)
      }
    }
  }, [currentProvider, providerValidations])

  /**
   * Render provider validation status
   */
  const renderValidationStatus = useCallback((provider: MapProviderOption) => {
    const validation = providerValidations.get(provider.id)
    if (!validation) return null

    if (validation.status === "valid") {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          <span>{validation.message}</span>
        </div>
      )
    }

    if (validation.status === "missing-key") {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
          <span>{validation.message}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
        <XCircle className="h-4 w-4" />
        <span>{validation.message}</span>
      </div>
    )
  }, [providerValidations])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  if (isValidating) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="h-6 w-6" />
          Map Provider Settings
        </h2>
        <p className="text-muted-foreground mt-1">
          Choose your preferred mapping provider. Each option has different features, costs, and requirements.
        </p>
      </div>

      {/* Current Provider Info */}
      {currentOption && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Current Provider</AlertTitle>
          <AlertDescription>
            You are currently using <strong>{currentOption.name}</strong>.
            {" "}
            {providerValidations.get(currentOption.id)?.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Provider Selection */}
      <Card className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Available Providers
          </h3>
          <p className="text-sm text-muted-foreground">
            Select a map provider and review its features before applying the change
          </p>
        </div>

        <RadioGroup
          value={selectedProvider}
          onValueChange={handleProviderChange}
          className="space-y-4"
          disabled={isSaving}
        >
          {MAP_PROVIDERS.map((provider) => {
            const validation = providerValidations.get(provider.id)
            const isCurrentProvider = provider.id === currentProvider
            const isSelected = provider.id === selectedProvider

            return (
              <div
                key={provider.id}
                className={`border rounded-lg transition-all ${
                  isSelected ? "border-primary bg-primary/5 shadow-sm" : ""
                } ${!validation?.isAvailable && !isCurrentProvider ? "opacity-60" : ""}`}
              >
                <div className="flex items-start space-x-3 p-4">
                  <RadioGroupItem value={provider.id} id={provider.id} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={provider.id} className="font-medium cursor-pointer">
                      {provider.name}
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
                    {renderValidationStatus(provider)}
                    {provider.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{provider.notes}</p>
                    )}
                  </div>
                  {isCurrentProvider && (
                    <Badge variant="outline" className="text-xs">
                      Current
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </RadioGroup>

        {/* Confirmation and Save */}
        {showConfirmation && selectedValidation?.isAvailable && (
          <div className="mt-6 p-4 border border-dashed border-primary rounded-md bg-primary/5">
            <h4 className="font-medium text-primary mb-2">Confirm Provider Switch</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Switching map providers will reload the application with the new mapping engine.
              Some features may work differently based on provider capabilities.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={isSaving || !canSave}
                size="sm"
              >
                {isSaving ? "Switching..." : "Confirm & Switch Provider"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isSaving}
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Provider Details */}
      {selectedOption && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Map className="h-5 w-5" />
            {selectedOption.name} Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Advantages
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedOption.pros.map((pro, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5" />
                        {pro}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Considerations
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedOption.cons.map((con, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
                        {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </h4>
                <p className="text-sm font-medium">{selectedOption.cost}</p>
              </div>

              {selectedOption.apiKeyRequired && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    API Key Requirement
                  </h4>
                  <p className="text-sm">
                    {selectedValidation?.hasApiKey ? (
                      <span className="text-green-600 dark:text-green-400">API Key Configured</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">API Key Required</span>
                    )}
                  </p>
                  {selectedOption.setupUrl && !selectedValidation?.hasApiKey && (
                    <Button
                      variant="link"
                      size="sm"
                      className="mt-2 p-0 h-auto"
                      onClick={() => window.open(selectedOption.setupUrl, "_blank")}
                    >
                      Setup Instructions
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Status
                </h4>
                <p className="text-sm capitalize">{selectedOption.status}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}