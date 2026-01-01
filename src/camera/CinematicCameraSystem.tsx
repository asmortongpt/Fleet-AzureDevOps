/**
 * CinematicCameraSystem.tsx
 * Professional camera system with smooth transitions, preset views,
 * 360° showcase mode, and depth of field effects for automotive cinematography
 */

import React, { useRef, useEffect, useMemo, useState } from 'react'
import { SkeletonLoader } from '@/components/shared';
import { useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, OrbitControls } from '@react-three/drei'
import { useSpring, animated, config } from '@react-spring/three'
import * as THREE from 'three'

export type CameraView = 
  | 'hero' | 'front' | 'rear' | 'left' | 'right' 
  | 'front-quarter' | 'rear-quarter' | 'top-down' | 'low-angle'
  | 'interior-driver' | 'interior-passenger' | 'interior-rear'
  | 'engine-bay' | 'wheel-detail' | 'showcase-360'

export interface CameraPosition {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  near: number
  far: number
}

export interface CameraTransition {
  duration: number
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'spring'
  enableDepthOfField: boolean
  focusDistance: number
  bokehIntensity: number
}

export interface CinematicConfig {
  autoRotate: boolean
  autoRotateSpeed: number
  enableDamping: boolean
  dampingFactor: number
  enableZoom: boolean
  enablePan: boolean
  minDistance: number
  maxDistance: number
  maxPolarAngle: number
  minPolarAngle: number
  cinematicMode: boolean
  showcaseMode: boolean
  transitionConfig: CameraTransition
}

interface CinematicCameraSystemProps {
  currentView: CameraView
  config: CinematicConfig
  onViewChange?: (view: CameraView) => void
  vehicleBounds?: THREE.Box3
  enableGestures?: boolean
}

export function CinematicCameraSystem({
  currentView,
  config,
  onViewChange,
  vehicleBounds,
  enableGestures = true
}: CinematicCameraSystemProps) {
  const { camera, gl, size } = useThree()
  const controlsRef = useRef<any>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera>(null)
  const cameraGroupRef = useRef<THREE.Group>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [currentTarget, setCurrentTarget] = useState<THREE.Vector3>(new THREE.Vector3(0, 0, 0))
  const [showcaseAngle, setShowcaseAngle] = useState(0)

  // Vehicle center calculation
  const vehicleCenter = useMemo(() => {
    if (vehicleBounds) {
      const center = new THREE.Vector3()
      vehicleBounds.getCenter(center)
      return center
    }
    return new THREE.Vector3(0, 0, 0)
  }, [vehicleBounds])

  // Camera preset positions
  const cameraPresets: Record<CameraView, CameraPosition> = useMemo(() => ({
    hero: {
      position: [8, 4, 8],
      target: [0, 0.5, 0],
      fov: 45,
      near: 0.1,
      far: 1000
    },
    front: {
      position: [0, 2, 8],
      target: [0, 1, 0],
      fov: 50,
      near: 0.1,
      far: 1000
    },
    rear: {
      position: [0, 2, -8],
      target: [0, 1, 0],
      fov: 50,
      near: 0.1,
      far: 1000
    },
    left: {
      position: [-8, 2, 0],
      target: [0, 1, 0],
      fov: 50,
      near: 0.1,
      far: 1000
    },
    right: {
      position: [8, 2, 0],
      target: [0, 1, 0],
      fov: 50,
      near: 0.1,
      far: 1000
    },
    'front-quarter': {
      position: [6, 3, 6],
      target: [0, 0.8, 0],
      fov: 45,
      near: 0.1,
      far: 1000
    },
    'rear-quarter': {
      position: [-6, 3, -6],
      target: [0, 0.8, 0],
      fov: 45,
      near: 0.1,
      far: 1000
    },
    'top-down': {
      position: [0, 15, 0],
      target: [0, 0, 0],
      fov: 60,
      near: 0.1,
      far: 1000
    },
    'low-angle': {
      position: [4, 0.5, 4],
      target: [0, 1.5, 0],
      fov: 35,
      near: 0.1,
      far: 1000
    },
    'interior-driver': {
      position: [0.5, 1.2, 0.3],
      target: [0, 1.2, 1],
      fov: 70,
      near: 0.01,
      far: 100
    },
    'interior-passenger': {
      position: [-0.5, 1.2, 0.3],
      target: [0, 1.2, 1],
      fov: 70,
      near: 0.01,
      far: 100
    },
    'interior-rear': {
      position: [0, 1.2, -0.8],
      target: [0, 1.2, 0],
      fov: 75,
      near: 0.01,
      far: 100
    },
    'engine-bay': {
      position: [0, 1.5, 3],
      target: [0, 0.8, 2],
      fov: 55,
      near: 0.1,
      far: 1000
    },
    'wheel-detail': {
      position: [3, 0.8, 3],
      target: [1.5, 0.3, 1.5],
      fov: 40,
      near: 0.1,
      far: 1000
    },
    'showcase-360': {
      position: [10, 5, 0],
      target: [0, 1, 0],
      fov: 50,
      near: 0.1,
      far: 1000
    }
  }), [])

  // Current camera configuration
  const currentConfig = cameraPresets[currentView]

  // Smooth camera transition animation
  const [{ position, target, fov }, api] = useSpring(() => ({
    position: currentConfig.position,
    target: currentConfig.target,
    fov: currentConfig.fov,
    config: config.transitionConfig.easing === 'spring' ? 
      springConfig.wobbly : 
      config.transitionConfig.easing === 'bounce' ? 
        springConfig.slow : 
        springConfig.default
  }))

  // Spring configurations
  const springConfig = {
    default: { mass: 1, tension: 280, friction: 60 },
    slow: { mass: 1, tension: 200, friction: 50 },
    wobbly: { mass: 1, tension: 180, friction: 12 }
  }

  // Update camera when view changes
  useEffect(() => {
    setIsTransitioning(true)
    
    api.start({
      position: currentConfig.position,
      target: currentConfig.target,
      fov: currentConfig.fov,
      onRest: () => setIsTransitioning(false)
    })

    setCurrentTarget(new THREE.Vector3(...currentConfig.target))
  }, [currentView, currentConfig, api])

  // Showcase 360 mode
  useFrame((state, delta) => {
    if (config.showcaseMode && currentView === 'showcase-360') {
      setShowcaseAngle(prev => prev + delta * config.autoRotateSpeed)
      
      const radius = 10
      const x = Math.cos(showcaseAngle) * radius
      const z = Math.sin(showcaseAngle) * radius
      const y = 3 + Math.sin(showcaseAngle * 2) * 1 // Slight vertical movement
      
      api.start({
        position: [x, y, z],
        target: [0, 1, 0],
        immediate: true
      })
    }

    // Smooth FOV breathing effect
    if (config.cinematicMode && cameraRef.current) {
      const breathingFOV = currentConfig.fov + Math.sin(state.clock.elapsedTime * 0.5) * 2
      cameraRef.current.fov = breathingFOV
      cameraRef.current.updateProjectionMatrix()
    }

    // Auto-rotate when enabled
    if (config.autoRotate && controlsRef.current && !isTransitioning) {
      controlsRef.current.autoRotate = true
      controlsRef.current.autoRotateSpeed = config.autoRotateSpeed
    } else if (controlsRef.current) {
      controlsRef.current.autoRotate = false
    }
  })

  // Gesture controls for mobile
  useEffect(() => {
    if (!enableGestures || !gl.domElement) return

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        // Two-finger gesture detected
        const distance = Math.hypot(
          event.touches[0].pageX - event.touches[1].pageX,
          event.touches[0].pageY - event.touches[1].pageY
        )
        
        // Store initial distance for pinch-to-zoom
        gl.domElement.dataset.initialDistance = distance.toString()
      }
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && gl.domElement.dataset.initialDistance) {
        const currentDistance = Math.hypot(
          event.touches[0].pageX - event.touches[1].pageX,
          event.touches[0].pageY - event.touches[1].pageY
        )
        
        const initialDistance = parseFloat(gl.domElement.dataset.initialDistance)
        const scale = currentDistance / initialDistance
        
        // Adjust camera distance based on pinch
        if (controlsRef.current) {
          const newDistance = Math.max(
            config.minDistance,
            Math.min(config.maxDistance, controlsRef.current.getDistance() / scale)
          )
          controlsRef.current.dollyTo(newDistance, true)
        }
      }
    }

    const handleTouchEnd = () => {
      delete gl.domElement.dataset.initialDistance
    }

    gl.domElement.addEventListener('touchstart', handleTouchStart)
    gl.domElement.addEventListener('touchmove', handleTouchMove)
    gl.domElement.addEventListener('touchend', handleTouchEnd)

    return () => {
      gl.domElement.removeEventListener('touchstart', handleTouchStart)
      gl.domElement.removeEventListener('touchmove', handleTouchMove)
      gl.domElement.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enableGestures, gl.domElement, config.minDistance, config.maxDistance])

  // Depth of Field effect setup
  useEffect(() => {
    if (config.transitionConfig.enableDepthOfField && cameraRef.current) {
      // This would integrate with post-processing for DOF
      cameraRef.current.userData.dofFocus = config.transitionConfig.focusDistance
      cameraRef.current.userData.dofBokeh = config.transitionConfig.bokehIntensity
    }
  }, [config.transitionConfig])

  return (
    <>
      <animated.group
        position={position}
        ref={cameraGroupRef}
      >
        <PerspectiveCamera
          ref={cameraRef}
          makeDefault
          fov={fov.get()}
          near={currentConfig.near}
          far={currentConfig.far}
          position={[0, 0, 0]}
        />
      </animated.group>

      <OrbitControls
        ref={controlsRef}
        target={currentTarget}
        enableDamping={config.enableDamping}
        dampingFactor={config.dampingFactor}
        enableZoom={config.enableZoom}
        enablePan={config.enablePan}
        minDistance={config.minDistance}
        maxDistance={config.maxDistance}
        maxPolarAngle={config.maxPolarAngle}
        minPolarAngle={config.minPolarAngle}
        enabled={!isTransitioning && !config.showcaseMode}
        autoRotate={config.autoRotate && !isTransitioning}
        autoRotateSpeed={config.autoRotateSpeed}
      />
    </>
  )
}

// Preset camera configurations
export const cinematicPresets = {
  professional: {
    autoRotate: false,
    autoRotateSpeed: 0.5,
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enablePan: false,
    minDistance: 3,
    maxDistance: 20,
    maxPolarAngle: Math.PI / 2,
    minPolarAngle: 0,
    cinematicMode: true,
    showcaseMode: false,
    transitionConfig: {
      duration: 2000,
      easing: 'ease-in-out' as const,
      enableDepthOfField: true,
      focusDistance: 5,
      bokehIntensity: 0.3
    }
  },
  
  showcase: {
    autoRotate: true,
    autoRotateSpeed: 1.0,
    enableDamping: true,
    dampingFactor: 0.1,
    enableZoom: false,
    enablePan: false,
    minDistance: 8,
    maxDistance: 15,
    maxPolarAngle: Math.PI / 2.2,
    minPolarAngle: 0.1,
    cinematicMode: false,
    showcaseMode: true,
    transitionConfig: {
      duration: 3000,
      easing: 'spring' as const,
      enableDepthOfField: false,
      focusDistance: 10,
      bokehIntensity: 0.1
    }
  },
  
  interactive: {
    autoRotate: false,
    autoRotateSpeed: 0,
    enableDamping: true,
    dampingFactor: 0.08,
    enableZoom: true,
    enablePan: true,
    minDistance: 2,
    maxDistance: 25,
    maxPolarAngle: Math.PI / 1.8,
    minPolarAngle: 0,
    cinematicMode: false,
    showcaseMode: false,
    transitionConfig: {
      duration: 1500,
      easing: 'ease-out' as const,
      enableDepthOfField: false,
      focusDistance: 8,
      bokehIntensity: 0.2
    }
  }
}

// Camera view sequences for automated showcases
export const cameraSequences = {
  fullShowcase: [
    'hero',
    'front-quarter',
    'front',
    'left',
    'rear-quarter',
    'rear',
    'right',
    'top-down',
    'low-angle'
  ] as CameraView[],
  
  interiorTour: [
    'interior-driver',
    'interior-passenger',
    'interior-rear'
  ] as CameraView[],
  
  detailShots: [
    'wheel-detail',
    'engine-bay',
    'front',
    'rear'
  ] as CameraView[],
  
  cinematic: [
    'hero',
    'showcase-360',
    'low-angle',
    'top-down'
  ] as CameraView[]
}

// Helper function to create smooth camera transitions
export function createCameraSequence(
  views: CameraView[],
  intervalMs: number = 4000,
  onViewChange: (view: CameraView) => void
): () => void {
  let currentIndex = 0
  let intervalId: NodeJS.Timeout

  const startSequence = () => {
    intervalId = setInterval(() => {
      onViewChange(views[currentIndex])
      currentIndex = (currentIndex + 1) % views.length
    }, intervalMs)
  }

  const stopSequence = () => {
    clearInterval(intervalId)
  }

  startSequence()
  return stopSequence
}