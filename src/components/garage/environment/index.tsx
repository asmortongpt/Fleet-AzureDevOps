/**
 * Environment System - Complete Implementation
 *
 * Created: 2025-12-31 (Fixed from placeholders)
 */

export * from './types'
export * from './configs'

import React from 'react'

import { TimeOfDay, WeatherType } from './types'


export function DynamicLighting({ timeOfDay, weatherIntensity = 1.0 }: { timeOfDay: TimeOfDay; weatherIntensity?: number }) {
  return (
    <>
      <ambientLight intensity={0.4 * weatherIntensity} />
      <directionalLight
        position={timeOfDay === 'noon' ? [10, 10, 5] : timeOfDay === 'sunset' ? [5, 3, 5] : [2, 5, 3]}
        intensity={timeOfDay === 'noon' ? 1.0 : timeOfDay === 'sunset' ? 0.6 : 0.3}
        castShadow
      />
    </>
  )
}

export function ProceduralSky({ timeOfDay }: { timeOfDay: TimeOfDay }) {
  const skyColors = {
    dawn: '#87CEEB',
    noon: '#87CEEB',
    sunset: '#FF6B35',
    dusk: '#2C3E50',
    night: '#0A1929'
  }
  
  return (
    <mesh>
      <sphereGeometry args={[500, 32, 32]} />
      <meshBasicMaterial color={skyColors[timeOfDay]} side={2} />
    </mesh>
  )
}

export function WeatherEffects({ weather }: { weather: WeatherType }) {
  switch (weather) {
    case 'rain':
      return <RainEffect />
    case 'snow':
      return <SnowEffect />
    case 'fog':
      return <FogEffect />
    default:
      return null
  }
}

export function RainEffect() {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={new Float32Array(3000).map(() => (Math.random() - 0.5) * 100)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.1} color="#4A90E2" transparent opacity={0.6} />
    </points>
  )
}

export function SnowEffect() {
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={500}
          array={new Float32Array(1500).map(() => (Math.random() - 0.5) * 100)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.2} color="#FFFFFF" transparent opacity={0.8} />
    </points>
  )
}

export function FogEffect({ density = 0.15 }: { density?: number }) {
  return <fog attach="fog" args={['#999999', 10, 100 * (1 / density)]} />
}

export function DynamicGround({ weather, size = 100 }: { weather: WeatherType; size?: number }) {
  const groundColor = weather === 'snow' ? '#FFFFFF' : weather === 'rain' ? '#555555' : '#8B7355'
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={groundColor} roughness={0.8} />
    </mesh>
  )
}
