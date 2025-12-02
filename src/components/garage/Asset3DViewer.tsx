/**
 * Asset3DViewer - Photorealistic 3D Asset Rendering Component
 *
 * Features:
 * - React Three Fiber for WebGL rendering
 * - PBR materials with environment maps
 * - Interactive orbit controls
 * - Procedural 3D models for each asset category
 * - GLTF model support for custom models
 * - AI-generated model integration (Meshy.ai)
 *
 * Created: 2025-11-24
 */

import React, { Suspense, useRef, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  useGLTF,
  ContactShadows,
  RoundedBox,
  Sphere,
  Cylinder,
  Box,
  Text,
  Html,
  useProgress,
  Loader
} from '@react-three/drei'
import { EffectComposer, Bloom, SSAO, ToneMapping } from '@react-three/postprocessing'
import * as THREE from 'three'
import { AssetCategory, AssetType } from '@/types/asset.types'

// ============================================================================
// TYPES
// ============================================================================

interface Asset3DViewerProps {
  assetCategory?: AssetCategory
  assetType?: AssetType
  color?: string
  make?: string
  model?: string
  customModelUrl?: string
  showStats?: boolean
  autoRotate?: boolean
  onLoad?: () => void
}

interface VehicleModelProps {
  category?: AssetCategory
  type?: AssetType
  color?: string
}

// ============================================================================
// LOADING INDICATOR
// ============================================================================

function LoadingScreen() {
  const { progress } = useProgress()
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">{progress.toFixed(0)}% loaded</p>
      </div>
    </Html>
  )
}

// ============================================================================
// VEHICLE MODELS
// ============================================================================

// Sedan / Passenger Car
function SedanModel({ color = '#3B82F6' }: { color?: string }) {
  return (
    <group>
      {/* Body */}
      <RoundedBox args={[3, 0.8, 1.4]} radius={0.15} position={[0, 0.5, 0]}>
        <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
      </RoundedBox>
      {/* Cabin */}
      <RoundedBox args={[1.8, 0.7, 1.2]} radius={0.1} position={[0.1, 1.1, 0]}>
        <meshStandardMaterial color="#1E40AF" metalness={0.9} roughness={0.1} transparent opacity={0.4} />
      </RoundedBox>
      {/* Wheels */}
      {[[-0.9, 0.2, 0.7], [-0.9, 0.2, -0.7], [0.9, 0.2, 0.7], [0.9, 0.2, -0.7]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <Cylinder args={[0.25, 0.25, 0.2, 24]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1F2937" metalness={0.1} roughness={0.8} />
          </Cylinder>
          <Cylinder args={[0.15, 0.15, 0.22, 8]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#9CA3AF" metalness={0.9} roughness={0.2} />
          </Cylinder>
        </group>
      ))}
      {/* Headlights */}
      <Box args={[0.1, 0.15, 0.2]} position={[1.5, 0.5, 0.5]}>
        <meshStandardMaterial color="#FFF" emissive="#FFE4B5" emissiveIntensity={0.5} />
      </Box>
      <Box args={[0.1, 0.15, 0.2]} position={[1.5, 0.5, -0.5]}>
        <meshStandardMaterial color="#FFF" emissive="#FFE4B5" emissiveIntensity={0.5} />
      </Box>
      {/* Taillights */}
      <Box args={[0.1, 0.15, 0.2]} position={[-1.5, 0.5, 0.5]}>
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.3} />
      </Box>
      <Box args={[0.1, 0.15, 0.2]} position={[-1.5, 0.5, -0.5]}>
        <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.3} />
      </Box>
    </group>
  )
}

// SUV
function SUVModel({ color = '#059669' }: { color?: string }) {
  return (
    <group>
      {/* Body */}
      <RoundedBox args={[3.5, 1.2, 1.6]} radius={0.15} position={[0, 0.7, 0]}>
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </RoundedBox>
      {/* Cabin */}
      <RoundedBox args={[2.2, 0.8, 1.4]} radius={0.12} position={[0, 1.5, 0]}>
        <meshStandardMaterial color="#1E3A5F" metalness={0.9} roughness={0.1} transparent opacity={0.35} />
      </RoundedBox>
      {/* Roof rack */}
      <Box args={[1.5, 0.05, 1]} position={[0, 2, 0]}>
        <meshStandardMaterial color="#1F2937" metalness={0.8} roughness={0.3} />
      </Box>
      {/* Wheels - larger for SUV */}
      {[[-1.1, 0.35, 0.85], [-1.1, 0.35, -0.85], [1.1, 0.35, 0.85], [1.1, 0.35, -0.85]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <Cylinder args={[0.35, 0.35, 0.25, 24]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1F2937" metalness={0.1} roughness={0.8} />
          </Cylinder>
          <Cylinder args={[0.2, 0.2, 0.27, 6]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#9CA3AF" metalness={0.9} roughness={0.2} />
          </Cylinder>
        </group>
      ))}
    </group>
  )
}

// Pickup Truck
function PickupTruckModel({ color = '#DC2626' }: { color?: string }) {
  return (
    <group>
      {/* Cab */}
      <RoundedBox args={[1.5, 1, 1.6]} radius={0.1} position={[0.8, 0.6, 0]}>
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </RoundedBox>
      {/* Cabin glass */}
      <RoundedBox args={[1.2, 0.6, 1.4]} radius={0.08} position={[0.8, 1.2, 0]}>
        <meshStandardMaterial color="#1E3A5F" metalness={0.9} roughness={0.1} transparent opacity={0.35} />
      </RoundedBox>
      {/* Bed */}
      <Box args={[1.8, 0.6, 1.6]} position={[-0.7, 0.4, 0]}>
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.25} />
      </Box>
      {/* Bed interior */}
      <Box args={[1.6, 0.5, 1.4]} position={[-0.7, 0.55, 0]}>
        <meshStandardMaterial color="#374151" metalness={0.2} roughness={0.7} />
      </Box>
      {/* Wheels */}
      {[[-1.2, 0.3, 0.85], [-1.2, 0.3, -0.85], [1, 0.3, 0.85], [1, 0.3, -0.85]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <Cylinder args={[0.3, 0.3, 0.22, 24]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1F2937" metalness={0.1} roughness={0.8} />
          </Cylinder>
          <Cylinder args={[0.18, 0.18, 0.24, 6]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#9CA3AF" metalness={0.9} roughness={0.2} />
          </Cylinder>
        </group>
      ))}
    </group>
  )
}

// Heavy Truck / Semi
function HeavyTruckModel({ color = '#F59E0B' }: { color?: string }) {
  return (
    <group>
      {/* Cab */}
      <RoundedBox args={[1.2, 1.5, 2]} radius={0.1} position={[1.5, 1, 0]}>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </RoundedBox>
      {/* Cab glass */}
      <Box args={[0.5, 0.6, 1.6]} position={[2, 1.5, 0]}>
        <meshStandardMaterial color="#1E3A5F" metalness={0.9} roughness={0.1} transparent opacity={0.35} />
      </Box>
      {/* Hood */}
      <RoundedBox args={[1, 0.8, 1.8]} radius={0.08} position={[2.3, 0.5, 0]}>
        <meshStandardMaterial color={color} metalness={0.6} roughness={0.3} />
      </RoundedBox>
      {/* Chassis */}
      <Box args={[4, 0.3, 0.8]} position={[0, 0.35, 0]}>
        <meshStandardMaterial color="#1F2937" metalness={0.5} roughness={0.5} />
      </Box>
      {/* Dual rear wheels */}
      {[[-1.3, 0.4, 1], [-1.3, 0.4, -1], [1.5, 0.4, 1], [1.5, 0.4, -1]].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <Cylinder args={[0.4, 0.4, 0.3, 24]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#1F2937" metalness={0.1} roughness={0.8} />
          </Cylinder>
          <Cylinder args={[0.25, 0.25, 0.32, 8]} rotation={[Math.PI / 2, 0, 0]}>
            <meshStandardMaterial color="#6B7280" metalness={0.9} roughness={0.2} />
          </Cylinder>
        </group>
      ))}
      {/* Exhaust pipes */}
      <Cylinder args={[0.08, 0.08, 1]} position={[0.9, 1.3, 1.05]}>
        <meshStandardMaterial color="#4B5563" metalness={0.9} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 1]} position={[0.9, 1.3, -1.05]}>
        <meshStandardMaterial color="#4B5563" metalness={0.9} roughness={0.2} />
      </Cylinder>
    </group>
  )
}

// Excavator
function ExcavatorModel({ color = '#CA8A04' }: { color?: string }) {
  return (
    <group>
      {/* Tracks */}
      <RoundedBox args={[3, 0.5, 0.8]} radius={0.2} position={[0, 0.25, 1]}>
        <meshStandardMaterial color="#1F2937" metalness={0.3} roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[3, 0.5, 0.8]} radius={0.2} position={[0, 0.25, -1]}>
        <meshStandardMaterial color="#1F2937" metalness={0.3} roughness={0.8} />
      </RoundedBox>
      {/* Platform */}
      <Cylinder args={[1.2, 1.2, 0.4, 16]} position={[0, 0.7, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Cylinder>
      {/* Cab */}
      <RoundedBox args={[1.5, 1.2, 1.2]} radius={0.1} position={[-0.3, 1.5, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* Cab glass */}
      <Box args={[1.3, 0.8, 1]} position={[-0.3, 1.6, 0]}>
        <meshStandardMaterial color="#1E3A5F" metalness={0.9} roughness={0.1} transparent opacity={0.35} />
      </Box>
      {/* Boom arm */}
      <Box args={[2.5, 0.3, 0.25]} rotation={[0, 0, -0.5]} position={[1.5, 1.8, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Box>
      {/* Arm */}
      <Box args={[1.8, 0.25, 0.2]} rotation={[0, 0, 0.3]} position={[2.8, 1, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Box>
      {/* Bucket */}
      <Box args={[0.6, 0.4, 0.5]} position={[3.5, 0.5, 0]}>
        <meshStandardMaterial color="#4B5563" metalness={0.6} roughness={0.5} />
      </Box>
      {/* Hydraulic cylinders */}
      <Cylinder args={[0.05, 0.05, 1]} rotation={[0, 0, -0.8]} position={[0.8, 1.3, 0.2]}>
        <meshStandardMaterial color="#9CA3AF" metalness={0.9} roughness={0.2} />
      </Cylinder>
    </group>
  )
}

// Forklift
function ForkliftModel({ color = '#2563EB' }: { color?: string }) {
  return (
    <group>
      {/* Base/chassis */}
      <Box args={[1.5, 0.4, 1.2]} position={[0, 0.4, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Box>
      {/* Counterweight */}
      <Box args={[0.5, 0.6, 1]} position={[-0.7, 0.5, 0]}>
        <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.5} />
      </Box>
      {/* Cab frame */}
      <Box args={[0.05, 1.5, 0.05]} position={[0.3, 1.3, 0.55]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Box>
      <Box args={[0.05, 1.5, 0.05]} position={[0.3, 1.3, -0.55]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Box>
      <Box args={[0.05, 0.05, 1.15]} position={[0.3, 2, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Box>
      {/* Mast */}
      <Box args={[0.1, 2, 0.1]} position={[0.75, 1.2, 0.35]}>
        <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.3} />
      </Box>
      <Box args={[0.1, 2, 0.1]} position={[0.75, 1.2, -0.35]}>
        <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.3} />
      </Box>
      {/* Forks */}
      <Box args={[1.2, 0.05, 0.1]} position={[1.3, 0.25, 0.2]}>
        <meshStandardMaterial color="#6B7280" metalness={0.8} roughness={0.2} />
      </Box>
      <Box args={[1.2, 0.05, 0.1]} position={[1.3, 0.25, -0.2]}>
        <meshStandardMaterial color="#6B7280" metalness={0.8} roughness={0.2} />
      </Box>
      {/* Wheels */}
      {[[0.5, 0.2, 0.65], [0.5, 0.2, -0.65], [-0.5, 0.2, 0.55], [-0.5, 0.2, -0.55]].map((pos, i) => (
        <Cylinder key={i} args={[0.2, 0.2, 0.15, 16]} rotation={[Math.PI / 2, 0, 0]} position={pos as [number, number, number]}>
          <meshStandardMaterial color="#1F2937" metalness={0.3} roughness={0.7} />
        </Cylinder>
      ))}
    </group>
  )
}

// Generator
function GeneratorModel({ color = '#059669' }: { color?: string }) {
  return (
    <group>
      {/* Main housing */}
      <RoundedBox args={[2, 1.2, 1]} radius={0.08} position={[0, 0.6, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </RoundedBox>
      {/* Control panel */}
      <Box args={[0.4, 0.5, 0.05]} position={[0, 0.8, 0.53]}>
        <meshStandardMaterial color="#1F2937" metalness={0.2} roughness={0.8} />
      </Box>
      {/* Exhaust */}
      <Cylinder args={[0.08, 0.1, 0.4]} position={[0.6, 1.4, 0]}>
        <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.3} />
      </Cylinder>
      {/* Vents */}
      {[-0.3, 0, 0.3].map((z, i) => (
        <Box key={i} args={[0.02, 0.6, 0.08]} position={[-1, 0.6, z]}>
          <meshStandardMaterial color="#1F2937" metalness={0.2} roughness={0.8} />
        </Box>
      ))}
      {/* Frame/skid */}
      <Box args={[2.4, 0.1, 1.2]} position={[0, 0.05, 0]}>
        <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.5} />
      </Box>
      {/* Lifting eyes */}
      {[[0.9, 1.2, 0], [-0.9, 1.2, 0]].map((pos, i) => (
        <Cylinder key={i} args={[0.05, 0.05, 0.1, 8]} rotation={[Math.PI / 2, 0, 0]} position={pos as [number, number, number]}>
          <meshStandardMaterial color="#6B7280" metalness={0.8} roughness={0.2} />
        </Cylinder>
      ))}
    </group>
  )
}

// Crane (mobile)
function CraneModel({ color = '#F97316' }: { color?: string }) {
  return (
    <group>
      {/* Base vehicle */}
      <RoundedBox args={[3, 0.8, 1.6]} radius={0.1} position={[0, 0.5, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* Cab */}
      <RoundedBox args={[1, 1, 1.4]} radius={0.08} position={[1.2, 1.2, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </RoundedBox>
      {/* Cab glass */}
      <Box args={[0.5, 0.6, 1.2]} position={[1.5, 1.3, 0]}>
        <meshStandardMaterial color="#1E3A5F" metalness={0.9} roughness={0.1} transparent opacity={0.35} />
      </Box>
      {/* Turntable */}
      <Cylinder args={[0.8, 0.8, 0.2, 24]} position={[-0.3, 1, 0]}>
        <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
      </Cylinder>
      {/* Boom base */}
      <Box args={[0.5, 3, 0.4]} rotation={[0, 0, -1]} position={[0.5, 2.5, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Box>
      {/* Boom extension */}
      <Box args={[0.35, 2, 0.3]} rotation={[0, 0, -0.8]} position={[2, 3.5, 0]}>
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </Box>
      {/* Hook */}
      <Sphere args={[0.15, 16, 16]} position={[3, 3, 0]}>
        <meshStandardMaterial color="#4B5563" metalness={0.8} roughness={0.2} />
      </Sphere>
      {/* Outriggers */}
      {[[1.5, 0.2, 1.2], [1.5, 0.2, -1.2], [-1.2, 0.2, 1.2], [-1.2, 0.2, -1.2]].map((pos, i) => (
        <Cylinder key={i} args={[0.1, 0.15, 0.3, 8]} position={pos as [number, number, number]}>
          <meshStandardMaterial color="#374151" metalness={0.6} roughness={0.4} />
        </Cylinder>
      ))}
      {/* Wheels */}
      {[[1, 0.25, 0.85], [1, 0.25, -0.85], [-1, 0.25, 0.85], [-1, 0.25, -0.85]].map((pos, i) => (
        <Cylinder key={i} args={[0.25, 0.25, 0.2, 24]} rotation={[Math.PI / 2, 0, 0]} position={pos as [number, number, number]}>
          <meshStandardMaterial color="#1F2937" metalness={0.1} roughness={0.8} />
        </Cylinder>
      ))}
    </group>
  )
}

// Trailer
function TrailerModel({ color = '#6366F1' }: { color?: string }) {
  return (
    <group>
      {/* Main box */}
      <RoundedBox args={[5, 2, 1.8]} radius={0.05} position={[0, 1.2, 0]}>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.6} />
      </RoundedBox>
      {/* Frame */}
      <Box args={[5.5, 0.2, 0.8]} position={[0, 0.3, 0]}>
        <meshStandardMaterial color="#1F2937" metalness={0.5} roughness={0.5} />
      </Box>
      {/* Coupling */}
      <Cylinder args={[0.1, 0.15, 0.5]} rotation={[0, 0, Math.PI / 2]} position={[2.8, 0.3, 0]}>
        <meshStandardMaterial color="#4B5563" metalness={0.7} roughness={0.3} />
      </Cylinder>
      {/* Axles with wheels */}
      {[-1.5, -0.5, 0.5].map((x, i) => (
        <group key={i}>
          <Cylinder args={[0.3, 0.3, 0.2, 24]} rotation={[Math.PI / 2, 0, 0]} position={[x, 0.3, 1]}>
            <meshStandardMaterial color="#1F2937" metalness={0.1} roughness={0.8} />
          </Cylinder>
          <Cylinder args={[0.3, 0.3, 0.2, 24]} rotation={[Math.PI / 2, 0, 0]} position={[x, 0.3, -1]}>
            <meshStandardMaterial color="#1F2937" metalness={0.1} roughness={0.8} />
          </Cylinder>
        </group>
      ))}
    </group>
  )
}

// Generic Tool/Non-powered
function ToolModel({ color = '#8B5CF6' }: { color?: string }) {
  return (
    <group>
      {/* Tool cart/container */}
      <RoundedBox args={[1.5, 1, 1]} radius={0.08} position={[0, 0.6, 0]}>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </RoundedBox>
      {/* Drawers */}
      {[0.2, 0.5, 0.8].map((y, i) => (
        <Box key={i} args={[1.45, 0.25, 0.02]} position={[0, y, 0.51]}>
          <meshStandardMaterial color="#374151" metalness={0.3} roughness={0.6} />
        </Box>
      ))}
      {/* Handles */}
      <Cylinder args={[0.03, 0.03, 0.3]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.2, 0.53]}>
        <meshStandardMaterial color="#6B7280" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.03, 0.03, 0.3]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.5, 0.53]}>
        <meshStandardMaterial color="#6B7280" metalness={0.8} roughness={0.2} />
      </Cylinder>
      <Cylinder args={[0.03, 0.03, 0.3]} rotation={[0, 0, Math.PI / 2]} position={[0, 0.8, 0.53]}>
        <meshStandardMaterial color="#6B7280" metalness={0.8} roughness={0.2} />
      </Cylinder>
      {/* Casters */}
      {[[0.6, 0.1, 0.4], [0.6, 0.1, -0.4], [-0.6, 0.1, 0.4], [-0.6, 0.1, -0.4]].map((pos, i) => (
        <Sphere key={i} args={[0.08, 12, 12]} position={pos as [number, number, number]}>
          <meshStandardMaterial color="#1F2937" metalness={0.2} roughness={0.8} />
        </Sphere>
      ))}
    </group>
  )
}

// ============================================================================
// MODEL SELECTOR
// ============================================================================

function VehicleModel({ category, type, color }: VehicleModelProps) {
  const rotation = useRef(0)
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      rotation.current += delta * 0.2
      groupRef.current.rotation.y = rotation.current
    }
  })

  const getModel = () => {
    // First check specific asset type
    switch (type) {
      case 'EXCAVATOR':
        return <ExcavatorModel color={color} />
      case 'FORKLIFT':
        return <ForkliftModel color={color} />
      case 'MOBILE_CRANE':
      case 'TOWER_CRANE':
        return <CraneModel color={color} />
      case 'GENERATOR':
      case 'COMPRESSOR':
      case 'PUMP':
        return <GeneratorModel color={color} />
      case 'FLATBED_TRAILER':
      case 'ENCLOSED_TRAILER':
      case 'UTILITY_TRAILER':
        return <TrailerModel color={color} />
      case 'PICKUP_TRUCK':
        return <PickupTruckModel color={color} />
      case 'SUV':
        return <SUVModel color={color} />
    }

    // Fall back to category
    switch (category) {
      case 'PASSENGER_VEHICLE':
        return <SedanModel color={color} />
      case 'LIGHT_COMMERCIAL':
        return <PickupTruckModel color={color} />
      case 'HEAVY_TRUCK':
        return <HeavyTruckModel color={color} />
      case 'TRACTOR':
        return <HeavyTruckModel color={color} />
      case 'TRAILER':
        return <TrailerModel color={color} />
      case 'HEAVY_EQUIPMENT':
        return <ExcavatorModel color={color} />
      case 'UTILITY_VEHICLE':
        return <SUVModel color={color} />
      case 'SPECIALTY_EQUIPMENT':
        return <GeneratorModel color={color} />
      case 'NON_POWERED':
        return <ToolModel color={color} />
      default:
        return <SedanModel color={color} />
    }
  }

  return (
    <group ref={groupRef}>
      {getModel()}
    </group>
  )
}

// ============================================================================
// GLTF MODEL LOADER
// ============================================================================

function GLTFModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2
    }
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1} />
    </group>
  )
}

// ============================================================================
// SCENE SETUP
// ============================================================================

function Scene({
  assetCategory,
  assetType,
  color,
  customModelUrl,
  autoRotate = true
}: Asset3DViewerProps) {
  return (
    <>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[5, 3, 5]} fov={50} />

      {/* Controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        autoRotate={!autoRotate}
        autoRotateSpeed={0.5}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />
      <spotLight
        position={[0, 10, 0]}
        intensity={0.8}
        angle={0.5}
        penumbra={1}
        castShadow
      />

      {/* Environment */}
      <Environment preset="city" />

      {/* Ground */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={20}
        blur={2}
        far={10}
      />

      {/* Model */}
      <Suspense fallback={<LoadingScreen />}>
        {customModelUrl ? (
          <GLTFModel url={customModelUrl} />
        ) : (
          <VehicleModel
            category={assetCategory}
            type={assetType}
            color={color}
          />
        )}
      </Suspense>

      {/* Post-processing */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
          intensity={0.2}
        />
        <ToneMapping />
      </EffectComposer>
    </>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Asset3DViewer({
  assetCategory,
  assetType,
  color = '#3B82F6',
  make,
  model,
  customModelUrl,
  showStats = false,
  autoRotate = true,
  onLoad
}: Asset3DViewerProps) {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
        <div className="text-center p-4">
          <p className="text-lg font-medium">3D Viewer Unavailable</p>
          <p className="text-sm text-muted-foreground">WebGL may not be supported</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        onCreated={() => onLoad?.()}
        onError={() => setHasError(true)}
      >
        <Scene
          assetCategory={assetCategory}
          assetType={assetType}
          color={color}
          customModelUrl={customModelUrl}
          autoRotate={autoRotate}
        />
      </Canvas>

      {/* Info overlay */}
      {(make || model) && (
        <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
          <p className="font-medium">{make} {model}</p>
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-muted-foreground">
        Drag to rotate | Scroll to zoom
      </div>
    </div>
  )
}

export default Asset3DViewer
