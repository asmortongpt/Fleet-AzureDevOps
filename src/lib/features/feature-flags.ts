export type FeatureFlag = 
  | 'mobile-nav'
  | 'loading-skeletons'
  | 'drilldown-tabs'
  | '3d-vehicle-models'
  | 'realtime-telemetry'
  | 'ai-insights'
  | 'advanced-analytics'

interface FeatureFlagConfig {
  enabled: boolean
  rolloutPercentage?: number
  userGroups?: string[]
}

const featureFlags: Record<FeatureFlag, FeatureFlagConfig> = {
  'mobile-nav': { enabled: true },
  'loading-skeletons': { enabled: true },
  'drilldown-tabs': { enabled: true },
  '3d-vehicle-models': { enabled: false, rolloutPercentage: 10 },
  'realtime-telemetry': { enabled: true },
  'ai-insights': { enabled: false, userGroups: ['beta-testers'] },
  'advanced-analytics': { enabled: false, rolloutPercentage: 25 }
}

export function isFeatureEnabled(flag: FeatureFlag, userId?: string): boolean {
  const config = featureFlags[flag]
  if (!config) return false
  if (!config.enabled) return false

  // Check rollout percentage
  if (config.rolloutPercentage && userId) {
    const hash = simpleHash(userId)
    const userPercentage = hash % 100
    if (userPercentage >= config.rolloutPercentage) {
      return false
    }
  }

  // Check user groups (would integrate with auth system)
  if (config.userGroups && config.userGroups.length > 0) {
    // Check if user is in allowed groups
    // This would integrate with your auth/RBAC system
    return false
  }

  return true
}

function simpleHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export function getAllFeatures(): Record<FeatureFlag, boolean> {
  return Object.keys(featureFlags).reduce((acc, key) => {
    acc[key as FeatureFlag] = isFeatureEnabled(key as FeatureFlag)
    return acc
  }, {} as Record<FeatureFlag, boolean>)
}
