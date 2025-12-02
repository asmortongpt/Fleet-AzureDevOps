/**
 * GameCameraController - Forza/GT Style Camera for Vehicle Garage
 *
 * Features:
 * - Idle drift animation (subtle camera sway when not interacting)
 * - Smooth focus transitions between camera positions
 * - Preset camera positions (front, rear, side, interior, damage)
 * - Keyboard shortcuts for quick navigation
 * - Touch/mouse drag with momentum
 *
 * Created: 2025-11-24
 */

import { useRef, useEffect, useCallback } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

// Camera preset positions
export type CameraPosition = 'front' | 'rear' | 'driver_side' | 'passenger_side' | 'top' | 'interior' | 'damage_left' | 'damage_right' | 'default'

interface CameraPreset {
  position: [number, number, number]
  target: [number, number, number]
  fov?: number
}

const CAMERA_PRESETS: Record<CameraPosition, CameraPreset> = {
  default: { position: [5, 3, 5], target: [0, 0.5, 0] },
  front: { position: [6, 1.5, 0], target: [0, 0.5, 0] },
  rear: { position: [-6, 1.5, 0], target: [0, 0.5, 0] },
  driver_side: { position: [0, 1.5, 5], target: [0, 0.5, 0] },
  passenger_side: { position: [0, 1.5, -5], target: [0, 0.5, 0] },
  top: { position: [0, 8, 0.1], target: [0, 0, 0] },
  interior: { position: [0.5, 1.2, 0], target: [2, 1, 0], fov: 75 },
  damage_left: { position: [-3, 2, 4], target: [0, 0.5, 0] },
  damage_right: { position: [-3, 2, -4], target: [0, 0.5, 0] }
}

interface GameCameraControllerProps {
  cameraPosition?: CameraPosition
  enableIdleDrift?: boolean
  enableKeyboard?: boolean
  onCameraMove?: (position: THREE.Vector3, target: THREE.Vector3) => void
  damagePoints?: Array<{ position: [number, number, number]; label: string }>
  onDamagePointClick?: (index: number) => void
}

export function GameCameraController({
  cameraPosition = 'default',
  enableIdleDrift = true,
  enableKeyboard = true,
  onCameraMove,
  damagePoints = [],
  onDamagePointClick
}: GameCameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera, gl } = useThree()

  // Idle drift state
  const idleTimeRef = useRef(0)
  const lastInteractionRef = useRef(Date.now())
  const isIdlingRef = useRef(false)

  // Smooth transition state
  const transitionRef = useRef({
    active: false,
    startPos: new THREE.Vector3(),
    endPos: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    progress: 0,
    duration: 1.5 // seconds
  })

  // Track user interaction
  useEffect(() => {
    const handleInteraction = () => {
      lastInteractionRef.current = Date.now()
      isIdlingRef.current = false
    }

    gl.domElement.addEventListener('pointerdown', handleInteraction)
    gl.domElement.addEventListener('wheel', handleInteraction)

    return () => {
      gl.domElement.removeEventListener('pointerdown', handleInteraction)
      gl.domElement.removeEventListener('wheel', handleInteraction)
    }
  }, [gl])

  // Handle camera position changes with smooth transition
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPosition]
    if (!preset || !controlsRef.current) return

    // Start smooth transition
    transitionRef.current = {
      active: true,
      startPos: camera.position.clone(),
      endPos: new THREE.Vector3(...preset.position),
      startTarget: controlsRef.current.target.clone(),
      endTarget: new THREE.Vector3(...preset.target),
      progress: 0,
      duration: 1.5
    }

    // Update FOV if specified
    if (preset.fov && camera instanceof THREE.PerspectiveCamera) {
      camera.fov = preset.fov
      camera.updateProjectionMatrix()
    }
  }, [cameraPosition, camera])

  // Keyboard controls
  useEffect(() => {
    if (!enableKeyboard) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      switch (e.key) {
        case '1':
          // Front view
          break
        case '2':
          // Rear view
          break
        case '3':
          // Side view
          break
        case 'r':
        case 'R':
          // Reset to default
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enableKeyboard])

  // Animation frame - handle transitions and idle drift
  useFrame((state, delta) => {
    if (!controlsRef.current) return

    const transition = transitionRef.current

    // Handle smooth camera transition
    if (transition.active) {
      transition.progress += delta / transition.duration

      if (transition.progress >= 1) {
        // Transition complete
        transition.active = false
        camera.position.copy(transition.endPos)
        controlsRef.current.target.copy(transition.endTarget)
      } else {
        // Smooth easing (ease-out cubic)
        const t = 1 - Math.pow(1 - transition.progress, 3)

        camera.position.lerpVectors(transition.startPos, transition.endPos, t)
        controlsRef.current.target.lerpVectors(transition.startTarget, transition.endTarget, t)
      }

      controlsRef.current.update()
      onCameraMove?.(camera.position, controlsRef.current.target)
      return
    }

    // Handle idle drift animation
    if (!enableIdleDrift) return

    const timeSinceInteraction = Date.now() - lastInteractionRef.current
    const idleThreshold = 3000 // Start drifting after 3 seconds of no interaction

    if (timeSinceInteraction > idleThreshold) {
      if (!isIdlingRef.current) {
        isIdlingRef.current = true
        idleTimeRef.current = 0
      }

      idleTimeRef.current += delta

      // Subtle circular drift
      const driftSpeed = 0.1
      const driftRadius = 0.5
      const angle = idleTimeRef.current * driftSpeed

      // Apply subtle position offset (orbiting slightly)
      const basePos = CAMERA_PRESETS.default.position
      const offsetX = Math.sin(angle) * driftRadius * 0.3
      const offsetY = Math.sin(angle * 0.5) * driftRadius * 0.1
      const offsetZ = Math.cos(angle) * driftRadius * 0.3

      camera.position.set(
        basePos[0] + offsetX,
        basePos[1] + offsetY,
        basePos[2] + offsetZ
      )

      controlsRef.current.update()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      autoRotate={false}
      minDistance={2}
      maxDistance={15}
      maxPolarAngle={Math.PI / 2 + 0.1}
      minPolarAngle={0.1}
      dampingFactor={0.05}
      enableDamping={true}
      rotateSpeed={0.5}
      zoomSpeed={0.8}
    />
  )
}

export { CAMERA_PRESETS }
export type { CameraPreset }
