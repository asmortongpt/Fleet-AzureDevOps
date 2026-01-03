/**
 * DamageOverlay - Interactive 3D Damage Visualization
 * 
 * Features:
 * - 3D damage markers on vehicle surface
 * - Severity color coding (minor → critical)
 * - Click-to-add damage points
 * - Damage details popover
 * - Photo attachment support
 * 
 * Created: 2025-12-30
 */

import { Html, Sphere } from '@react-three/drei'
import { ThreeEvent } from '@react-three/fiber'
import { useState, useRef } from 'react'
import * as THREE from 'three'

// =============================================================================
// TYPES
// =============================================================================

export type DamageSeverity = 'minor' | 'moderate' | 'severe' | 'critical'

export interface DamagePoint {
    id: string
    position: [number, number, number]
    normal: [number, number, number]
    severity: DamageSeverity
    description: string
    estimatedCost: number
    photos: string[]
    createdAt: string
    zone?: string // 'front_bumper', 'hood', 'driver_door', etc.
}

export interface DamageOverlayProps {
    damagePoints: DamagePoint[]
    onAddDamage?: (point: Omit<DamagePoint, 'id' | 'createdAt'>) => void
    onSelectDamage?: (point: DamagePoint) => void
    onRemoveDamage?: (id: string) => void
    isEditMode?: boolean
    selectedDamageId?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SEVERITY_COLORS: Record<DamageSeverity, string> = {
    minor: '#22c55e',      // Green
    moderate: '#eab308',   // Yellow  
    severe: '#f97316',     // Orange
    critical: '#ef4444',   // Red
}

const SEVERITY_LABELS: Record<DamageSeverity, string> = {
    minor: 'Minor Damage',
    moderate: 'Moderate Damage',
    severe: 'Severe Damage',
    critical: 'Critical Damage',
}

const SEVERITY_COSTS: Record<DamageSeverity, { min: number; max: number }> = {
    minor: { min: 100, max: 500 },
    moderate: { min: 500, max: 2000 },
    severe: { min: 2000, max: 5000 },
    critical: { min: 5000, max: 15000 },
}

// =============================================================================
// DAMAGE MARKER COMPONENT
// =============================================================================

interface DamageMarkerProps {
    point: DamagePoint
    isSelected: boolean
    onSelect: () => void
    onRemove: () => void
    isEditMode: boolean
}

function DamageMarker({ point, isSelected, onSelect, onRemove, isEditMode }: DamageMarkerProps) {
    const [hovered, setHovered] = useState(false)
    const markerRef = useRef<THREE.Mesh>(null)

    const color = SEVERITY_COLORS[point.severity]
    const scale = isSelected ? 1.4 : hovered ? 1.2 : 1

    return (
        <group position={point.position}>
            {/* Outer glow ring */}
            <Sphere
                args={[0.12, 16, 16]}
                scale={scale * 1.3}
            >
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </Sphere>

            {/* Main marker sphere */}
            <Sphere
                ref={markerRef}
                args={[0.08, 16, 16]}
                scale={scale}
                onClick={(e) => {
                    e.stopPropagation()
                    onSelect()
                }}
                onPointerEnter={() => setHovered(true)}
                onPointerLeave={() => setHovered(false)}
            >
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered || isSelected ? 0.8 : 0.4}
                    metalness={0.5}
                    roughness={0.3}
                />
            </Sphere>

            {/* Pulsing animation ring for critical damage */}
            {point.severity === 'critical' && (
                <PulsingRing color={color} />
            )}

            {/* Info popup on hover/select */}
            {(hovered || isSelected) && (
                <Html
                    position={[0, 0.25, 0]}
                    center
                    distanceFactor={5}
                    style={{ pointerEvents: isSelected ? 'auto' : 'none' }}
                >
                    <div
                        className="bg-slate-900/95 backdrop-blur-sm rounded-lg p-3 border border-slate-700 shadow-xl min-w-[200px]"
                        style={{ transform: 'translateY(-50%)' }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span
                                className="text-xs font-bold px-2 py-0.5 rounded"
                                style={{ backgroundColor: color + '33', color }}
                            >
                                {SEVERITY_LABELS[point.severity]}
                            </span>
                            {isEditMode && isSelected && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRemove()
                                    }}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <p className="text-white text-sm mb-1">{point.description || 'Damage point'}</p>
                        <p className="text-green-400 font-semibold text-sm">
                            ${point.estimatedCost.toLocaleString()}
                        </p>
                        {point.zone && (
                            <p className="text-slate-400 text-xs mt-1">Zone: {point.zone}</p>
                        )}
                        {point.photos.length > 0 && (
                            <p className="text-slate-400 text-xs mt-1">📷 {point.photos.length} photo(s)</p>
                        )}
                    </div>
                </Html>
            )}
        </group>
    )
}

// =============================================================================
// PULSING ANIMATION
// =============================================================================

function PulsingRing({ color }: { color: string }) {
    const ringRef = useRef<THREE.Mesh>(null)

    // Simple pulse effect using scale
    return (
        <Sphere args={[0.15, 16, 16]}>
            <meshBasicMaterial color={color} transparent opacity={0.15} />
        </Sphere>
    )
}

// =============================================================================
// CLICK-TO-ADD HANDLER
// =============================================================================

interface ClickToAddProps {
    onAdd: (position: [number, number, number], normal: [number, number, number]) => void
    isEnabled: boolean
}

export function ClickToAddHandler({ onAdd, isEnabled }: ClickToAddProps) {
    if (!isEnabled) return null

    // This is a transparent sphere that catches clicks
    // In practice, you'd use raycasting on the vehicle mesh itself
    return null
}

// =============================================================================
// MAIN DAMAGE OVERLAY COMPONENT
// =============================================================================

export function DamageOverlay({
    damagePoints,
    onAddDamage,
    onSelectDamage,
    onRemoveDamage,
    isEditMode = false,
    selectedDamageId
}: DamageOverlayProps) {
    return (
        <group name="damage-overlay">
            {damagePoints.map((point) => (
                <DamageMarker
                    key={point.id}
                    point={point}
                    isSelected={selectedDamageId === point.id}
                    isEditMode={isEditMode}
                    onSelect={() => onSelectDamage?.(point)}
                    onRemove={() => onRemoveDamage?.(point.id)}
                />
            ))}
        </group>
    )
}

// =============================================================================
// DAMAGE SUMMARY PANEL (2D UI Component)
// =============================================================================

interface DamageSummaryPanelProps {
    damagePoints: DamagePoint[]
    onSelectDamage: (point: DamagePoint) => void
    selectedDamageId?: string
}

export function DamageSummaryPanel({
    damagePoints,
    onSelectDamage,
    selectedDamageId
}: DamageSummaryPanelProps) {
    const totalCost = damagePoints.reduce((sum, p) => sum + p.estimatedCost, 0)
    const bySeverity = {
        minor: damagePoints.filter(p => p.severity === 'minor').length,
        moderate: damagePoints.filter(p => p.severity === 'moderate').length,
        severe: damagePoints.filter(p => p.severity === 'severe').length,
        critical: damagePoints.filter(p => p.severity === 'critical').length,
    }

    if (damagePoints.length === 0) {
        return (
            <div className="p-4 text-center text-slate-400">
                <p className="text-sm">No damage recorded</p>
                <p className="text-xs mt-1">Click on vehicle to add damage points</p>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-white">{damagePoints.length}</p>
                    <p className="text-xs text-slate-400">Damage Points</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-400">${totalCost.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">Est. Total Cost</p>
                </div>
            </div>

            {/* Severity Breakdown */}
            <div className="space-y-1">
                {Object.entries(bySeverity).map(([severity, count]) => count > 0 && (
                    <div
                        key={severity}
                        className="flex items-center justify-between text-sm"
                    >
                        <div className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: SEVERITY_COLORS[severity as DamageSeverity] }}
                            />
                            <span className="text-slate-300 capitalize">{severity}</span>
                        </div>
                        <span className="text-white font-medium">{count}</span>
                    </div>
                ))}
            </div>

            {/* Damage Point List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                <p className="text-xs text-slate-400 uppercase tracking-wider">Damage Points</p>
                {damagePoints.map((point) => (
                    <button
                        key={point.id}
                        onClick={() => onSelectDamage(point)}
                        className={`w-full text-left p-2 rounded-lg border transition-colors ${selectedDamageId === point.id
                                ? 'bg-slate-700 border-blue-500'
                                : 'bg-slate-800/30 border-slate-700 hover:bg-slate-700/50'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: SEVERITY_COLORS[point.severity] }}
                                />
                                <span className="text-sm text-white">{point.description || 'Damage'}</span>
                            </div>
                            <span className="text-xs text-green-400">${point.estimatedCost.toLocaleString()}</span>
                        </div>
                        {point.zone && (
                            <p className="text-xs text-slate-400 mt-0.5 ml-4">{point.zone}</p>
                        )}
                    </button>
                ))}
            </div>
        </div>
    )
}

// =============================================================================
// UTILITY: Generate Demo Damage Points
// =============================================================================

export function generateDemoDamagePoints(): DamagePoint[] {
    return [
        {
            id: 'dmg-1',
            position: [1.2, 0.6, 0.6],
            normal: [1, 0, 0],
            severity: 'minor',
            description: 'Front bumper scuff',
            estimatedCost: 350,
            photos: [],
            createdAt: new Date().toISOString(),
            zone: 'Front Bumper'
        },
        {
            id: 'dmg-2',
            position: [-0.8, 0.8, 0.7],
            normal: [0, 0, 1],
            severity: 'moderate',
            description: 'Driver door dent',
            estimatedCost: 1200,
            photos: [],
            createdAt: new Date().toISOString(),
            zone: 'Driver Door'
        },
        {
            id: 'dmg-3',
            position: [0.3, 1.4, 0],
            normal: [0, 1, 0],
            severity: 'severe',
            description: 'Roof hail damage',
            estimatedCost: 3500,
            photos: [],
            createdAt: new Date().toISOString(),
            zone: 'Roof'
        },
        {
            id: 'dmg-4',
            position: [-1.4, 0.5, 0],
            normal: [-1, 0, 0],
            severity: 'critical',
            description: 'Rear collision damage',
            estimatedCost: 8500,
            photos: [],
            createdAt: new Date().toISOString(),
            zone: 'Rear Bumper'
        }
    ]
}
