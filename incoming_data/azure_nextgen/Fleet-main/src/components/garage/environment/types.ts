/**
 * Environment System Types
 *
 * Type definitions for time-of-day and weather systems
 * in the photorealistic 3D viewer.
 *
 * Created: 2025-12-30
 */

export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night'

export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'overcast'

export interface TimeOfDayConfig {
  sunPosition: [number, number, number]
  sunColor: string
  sunIntensity: number
  ambientColor: string
  ambientIntensity: number
  skyColor: string
  fogColor: string
  fogDensity: number
  hasMoon: boolean
  moonPosition?: [number, number, number]
  moonIntensity?: number
  starsVisible: boolean
}

export interface WeatherConfig {
  particleCount: number
  particleSpeed: number
  particleSize: number
  particleColor: string
  groundReflectivity: number
  groundRoughness: number
  visibilityRange: number
  fogDensity: number
  shadowIntensity: number
}

export interface EnvironmentState {
  timeOfDay: TimeOfDay
  weather: WeatherType
  transitionDuration: number
}
