/**
 * usePhotorealisticModel Hook
 *
 * Manages AI-generated photorealistic 3D models for vehicle visualization.
 *
 * Features:
 * - Automatic Meshy.ai generation for missing models
 * - Real-time generation progress tracking
 * - Seamless fallback to placeholder models
 * - Background caching with IndexedDB
 *
 * Created: 2025-12-30
 */

import { useState, useEffect } from 'react'
import { generateVehicleModel, getCacheStats } from '@/services/meshyAI'

export interface PhotorealisticModelState {
  url: string | null
  isGenerating: boolean
  progress: number
  error: string | null
  isFromCache: boolean
  usingPlaceholder: boolean
}

export interface UsePhotorealisticModelOptions {
  make?: string
  model?: string
  year?: number
  color?: string
  placeholderUrl?: string
  enableAI?: boolean  // Set false to disable AI generation (use placeholders only)
}

/**
 * Hook to manage photorealistic vehicle models with AI generation
 */
export function usePhotorealisticModel({
  make,
  model,
  year,
  color = '#3B82F6',
  placeholderUrl,
  enableAI = true,
}: UsePhotorealisticModelOptions): PhotorealisticModelState {
  const [state, setState] = useState<PhotorealisticModelState>({
    url: placeholderUrl || null,
    isGenerating: false,
    progress: 0,
    error: null,
    isFromCache: false,
    usingPlaceholder: !!placeholderUrl,
  })

  useEffect(() => {
    // Skip if missing required data
    if (!make || !model || !year) {
      setState(prev => ({
        ...prev,
        url: placeholderUrl || null,
        usingPlaceholder: !!placeholderUrl,
        isGenerating: false,
        error: null,
      }))
      return
    }

    // Skip if AI generation disabled
    if (!enableAI) {
      setState(prev => ({
        ...prev,
        url: placeholderUrl || null,
        usingPlaceholder: !!placeholderUrl,
        isGenerating: false,
        error: null,
      }))
      return
    }

    // Skip if already generating
    if (state.isGenerating) return

    let cancelled = false

    async function generateModel() {
      try {
        setState(prev => ({
          ...prev,
          isGenerating: true,
          progress: 0,
          error: null,
          usingPlaceholder: !!placeholderUrl,
        }))

        const aiModelUrl = await generateVehicleModel(
          make!,
          model!,
          year!,
          color,
          (progress) => {
            if (!cancelled) {
              setState(prev => ({
                ...prev,
                progress,
              }))
            }
          }
        )

        if (!cancelled) {
          setState({
            url: aiModelUrl,
            isGenerating: false,
            progress: 100,
            error: null,
            isFromCache: true,  // Will be true if from cache
            usingPlaceholder: false,
          })
        }
      } catch (error) {
        console.error('[usePhotorealisticModel] Generation error:', error)

        if (!cancelled) {
          setState(prev => ({
            ...prev,
            isGenerating: false,
            error: error instanceof Error ? error.message : 'Generation failed',
            usingPlaceholder: !!placeholderUrl,
            url: placeholderUrl || null,  // Fall back to placeholder
          }))
        }
      }
    }

    // Start generation
    generateModel()

    return () => {
      cancelled = true
    }
  }, [make, model, year, color, placeholderUrl, enableAI])

  return state
}

/**
 * Hook to get cache statistics
 */
export function useCacheStats() {
  const [stats, setStats] = useState({
    entries: 0,
    totalSize: 0,
    oldestEntry: 0,
    newestEntry: 0,
  })

  useEffect(() => {
    getCacheStats().then(setStats)

    // Update every minute
    const interval = setInterval(() => {
      getCacheStats().then(setStats)
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return stats
}
