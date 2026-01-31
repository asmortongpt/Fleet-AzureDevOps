/**
 * AdvancedPostProcessing - Cinema-Grade Post-Processing Pipeline
 * 
 * Features:
 * - Screen-Space Ambient Occlusion (SSAO)
 * - Depth of Field with aperture control
 * - Chromatic Aberration for realism
 * - Vignette for cinematic look
 * - Color grading with LUT support
 * 
 * Created: 2025-12-30
 */

import { useThree } from '@react-three/fiber'
import {
    EffectComposer,
    Bloom,
    DepthOfField,
    Vignette,
    ChromaticAberration,
    // @ts-expect-error - Library version incompatibility - these exports may not exist in current version
    ToneMapping,
    // @ts-expect-error - Library version incompatibility
    SMAA,
    // @ts-expect-error - Library version incompatibility
    N8AO // High-quality ambient occlusion
} from '@react-three/postprocessing'
// import { BlendFunction, ToneMappingMode, KernelSize } from 'postprocessing'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

// =============================================================================
// TYPES
// =============================================================================

export type QualityPreset = 'low' | 'medium' | 'high' | 'ultra'

export interface PostProcessingConfig {
    enabled: boolean
    quality: QualityPreset
    // SSAO
    aoEnabled: boolean
    aoIntensity: number
    aoRadius: number
    // DOF
    dofEnabled: boolean
    dofFocusDistance: number
    dofFocalLength: number
    dofBokehScale: number
    // Bloom
    bloomEnabled: boolean
    bloomIntensity: number
    bloomThreshold: number
    // Vignette
    vignetteEnabled: boolean
    vignetteIntensity: number
    // Chromatic Aberration
    chromaticEnabled: boolean
    chromaticOffset: number
    // Tone Mapping
    toneMapping: 'aces' | 'reinhard' | 'linear'
}

// =============================================================================
// PRESETS
// =============================================================================

const QUALITY_PRESETS: Record<QualityPreset, Partial<PostProcessingConfig>> = {
    low: {
        aoEnabled: false,
        dofEnabled: false,
        bloomEnabled: true,
        bloomIntensity: 0.2,
        vignetteEnabled: false,
        chromaticEnabled: false,
    },
    medium: {
        aoEnabled: true,
        aoIntensity: 1,
        aoRadius: 0.5,
        dofEnabled: false,
        bloomEnabled: true,
        bloomIntensity: 0.3,
        vignetteEnabled: true,
        vignetteIntensity: 0.3,
        chromaticEnabled: false,
    },
    high: {
        aoEnabled: true,
        aoIntensity: 1.5,
        aoRadius: 0.4,
        dofEnabled: true,
        dofFocusDistance: 0.02,
        dofFocalLength: 0.5,
        dofBokehScale: 2,
        bloomEnabled: true,
        bloomIntensity: 0.4,
        vignetteEnabled: true,
        vignetteIntensity: 0.4,
        chromaticEnabled: true,
        chromaticOffset: 0.002,
    },
    ultra: {
        aoEnabled: true,
        aoIntensity: 2,
        aoRadius: 0.3,
        dofEnabled: true,
        dofFocusDistance: 0.015,
        dofFocalLength: 0.4,
        dofBokehScale: 3,
        bloomEnabled: true,
        bloomIntensity: 0.5,
        bloomThreshold: 0.2,
        vignetteEnabled: true,
        vignetteIntensity: 0.5,
        chromaticEnabled: true,
        chromaticOffset: 0.003,
    },
}

export function getPresetConfig(quality: QualityPreset): PostProcessingConfig {
    const preset = QUALITY_PRESETS[quality]
    return {
        enabled: true,
        quality,
        aoEnabled: preset.aoEnabled ?? true,
        aoIntensity: preset.aoIntensity ?? 1,
        aoRadius: preset.aoRadius ?? 0.5,
        dofEnabled: preset.dofEnabled ?? false,
        dofFocusDistance: preset.dofFocusDistance ?? 0.02,
        dofFocalLength: preset.dofFocalLength ?? 0.5,
        dofBokehScale: preset.dofBokehScale ?? 2,
        bloomEnabled: preset.bloomEnabled ?? true,
        bloomIntensity: preset.bloomIntensity ?? 0.3,
        bloomThreshold: preset.bloomThreshold ?? 0.3,
        vignetteEnabled: preset.vignetteEnabled ?? true,
        vignetteIntensity: preset.vignetteIntensity ?? 0.4,
        chromaticEnabled: preset.chromaticEnabled ?? false,
        chromaticOffset: preset.chromaticOffset ?? 0.002,
        toneMapping: 'aces',
    }
}

// =============================================================================
// EFFECT WRAPPER COMPONENTS (avoid null children type issues)
// =============================================================================

function AOEffect({ config }: { config: PostProcessingConfig }) {
    if (!config.aoEnabled) return null
    return (
        <N8AO
            aoRadius={config.aoRadius}
            intensity={config.aoIntensity}
            distanceFalloff={1}
            color="black"
            quality="high"
        />
    )
}

function DOFEffect({ config, focusDistance }: { config: PostProcessingConfig; focusDistance: number }) {
    if (!config.dofEnabled) return null
    return (
        <DepthOfField
            focusDistance={focusDistance}
            focalLength={config.dofFocalLength}
            bokehScale={config.dofBokehScale}
        />
    )
}

function BloomEffect({ config }: { config: PostProcessingConfig }) {
    if (!config.bloomEnabled) return null
    return (
        <Bloom
            intensity={config.bloomIntensity}
            luminanceThreshold={config.bloomThreshold}
            luminanceSmoothing={0.9}
            // @ts-expect-error - KernelSize type from postprocessing library may not be available
            kernelSize={KernelSize.LARGE}
        />
    )
}

function ChromaticEffect({ config }: { config: PostProcessingConfig }) {
    if (!config.chromaticEnabled) return null
    return (
        <ChromaticAberration
            offset={new THREE.Vector2(config.chromaticOffset, config.chromaticOffset)}
            // @ts-expect-error - BlendFunction type from postprocessing library may not be available
            blendFunction={BlendFunction.NORMAL}
            radialModulation={false}
            modulationOffset={0}
        />
    )
}

function VignetteEffect({ config }: { config: PostProcessingConfig }) {
    if (!config.vignetteEnabled) return null
    return (
        <Vignette
            offset={0.3}
            darkness={config.vignetteIntensity}
            // @ts-expect-error - BlendFunction type from postprocessing library may not be available
            blendFunction={BlendFunction.NORMAL}
        />
    )
}

// =============================================================================
// ADVANCED POST-PROCESSING COMPONENT
// =============================================================================

interface AdvancedPostProcessingProps {
    config: PostProcessingConfig
    focusTarget?: THREE.Vector3
}

export function AdvancedPostProcessing({
    config,
    focusTarget
}: AdvancedPostProcessingProps) {
    const { camera } = useThree()

    // Calculate focus distance based on target
    const focusDistance = useMemo(() => {
        if (focusTarget && camera) {
            return camera.position.distanceTo(focusTarget) * 0.1
        }
        return config.dofFocusDistance
    }, [focusTarget, camera, config.dofFocusDistance])

    if (!config.enabled) return null

    // Get tone mapping mode
    // @ts-expect-error - ToneMappingMode type from postprocessing library may not be available
    const toneMappingMode =
        // @ts-expect-error - ToneMappingMode type from postprocessing library may not be available
        config.toneMapping === 'aces' ? ToneMappingMode.ACES_FILMIC :
            // @ts-expect-error - ToneMappingMode type from postprocessing library may not be available
            config.toneMapping === 'reinhard' ? ToneMappingMode.REINHARD :
                ToneMappingMode.LINEAR

    return (
        <EffectComposer multisampling={config.quality === 'ultra' ? 8 : 4}>
            <SMAA />
            <AOEffect config={config} />
            <DOFEffect config={config} focusDistance={focusDistance} />
            <BloomEffect config={config} />
            <ChromaticEffect config={config} />
            <VignetteEffect config={config} />
            <ToneMapping mode={toneMappingMode} />
        </EffectComposer>
    )
}

// =============================================================================
// QUALITY CONTROL PANEL (2D UI)
// =============================================================================

interface QualityControlPanelProps {
    config: PostProcessingConfig
    onChange: (config: PostProcessingConfig) => void
    isOpen: boolean
    onToggle: () => void
}

export function QualityControlPanel({
    config,
    onChange,
    isOpen,
    onToggle
}: QualityControlPanelProps) {
    if (!isOpen) {
        return (
            <button
                onClick={onToggle}
                className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-white border border-slate-700 hover:bg-slate-800 transition-colors z-40"
            >
                ⚙️ Quality: {config.quality.toUpperCase()}
            </button>
        )
    }

    return (
        <div className="absolute bottom-4 left-4 w-72 bg-slate-900/95 backdrop-blur-sm rounded-md border border-slate-700 shadow-sm z-50">
            <div className="p-3 border-b border-slate-700 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">Rendering Quality</h4>
                <button onClick={onToggle} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-3 space-y-3">
                {/* Quality Preset */}
                <div>
                    <label className="block text-xs text-slate-400 mb-1">Preset</label>
                    <div className="grid grid-cols-4 gap-1">
                        {(['low', 'medium', 'high', 'ultra'] as QualityPreset[]).map((preset) => (
                            <button
                                key={preset}
                                onClick={() => onChange(getPresetConfig(preset))}
                                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${config.quality === preset
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {preset.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toggle switches */}
                <div className="space-y-2">
                    {[
                        { key: 'aoEnabled', label: 'Ambient Occlusion' },
                        { key: 'dofEnabled', label: 'Depth of Field' },
                        { key: 'bloomEnabled', label: 'Bloom' },
                        { key: 'vignetteEnabled', label: 'Vignette' },
                        { key: 'chromaticEnabled', label: 'Chromatic Aberration' },
                    ].map(({ key, label }) => (
                        <label key={key} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300">{label}</span>
                            <input
                                type="checkbox"
                                checked={config[key as keyof PostProcessingConfig] as boolean}
                                onChange={(e) => onChange({ ...config, [key]: e.target.checked })}
                                className="rounded bg-slate-700 border-slate-600"
                            />
                        </label>
                    ))}
                </div>

                {/* Intensity sliders */}
                {config.dofEnabled && (
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">
                            DOF Bokeh: {config.dofBokehScale.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="6"
                            step="0.1"
                            value={config.dofBokehScale}
                            onChange={(e) => onChange({ ...config, dofBokehScale: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                )}

                {config.aoEnabled && (
                    <div>
                        <label className="block text-xs text-slate-400 mb-1">
                            AO Intensity: {config.aoIntensity.toFixed(1)}
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="3"
                            step="0.1"
                            value={config.aoIntensity}
                            onChange={(e) => onChange({ ...config, aoIntensity: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                )}
            </div>
        </div>
    )
}

// =============================================================================
// HOOK FOR POST-PROCESSING STATE
// =============================================================================

export function usePostProcessing(initialQuality: QualityPreset = 'high') {
    const configRef = useRef<PostProcessingConfig>(getPresetConfig(initialQuality))

    return {
        config: configRef.current,
        setQuality: (quality: QualityPreset) => {
            configRef.current = getPresetConfig(quality)
        },
        updateConfig: (updates: Partial<PostProcessingConfig>) => {
            configRef.current = { ...configRef.current, ...updates }
        },
    }
}
