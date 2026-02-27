/**
 * Environment Configurations
 *
 * Preset configurations for different times of day and weather conditions.
 *
 * Created: 2025-12-30
 */

import { TimeOfDayConfig, WeatherConfig, TimeOfDay, WeatherType } from './types'

export const TIME_OF_DAY_CONFIGS: Record<TimeOfDay, TimeOfDayConfig> = {
  dawn: {
    sunPosition: [50, 5, 30],
    sunColor: 'hsl(var(--warning))',
    sunIntensity: 1.2,
    ambientColor: 'hsl(var(--accent))',
    ambientIntensity: 0.4,
    skyColor: 'hsl(var(--destructive))',
    fogColor: 'hsl(var(--destructive))',
    fogDensity: 0.02,
    hasMoon: false,
    starsVisible: false,
  },
  morning: {
    sunPosition: [30, 20, 20],
    sunColor: 'hsl(var(--warning))',
    sunIntensity: 2.0,
    ambientColor: 'hsl(var(--muted))',
    ambientIntensity: 0.6,
    skyColor: 'hsl(var(--primary))',
    fogColor: 'hsl(var(--primary))',
    fogDensity: 0.01,
    hasMoon: false,
    starsVisible: false,
  },
  midday: {
    sunPosition: [0, 50, 0],
    sunColor: 'hsl(var(--foreground))',
    sunIntensity: 3.0,
    ambientColor: 'hsl(var(--muted))',
    ambientIntensity: 0.8,
    skyColor: 'hsl(var(--primary))',
    fogColor: 'hsl(var(--primary))',
    fogDensity: 0.005,
    hasMoon: false,
    starsVisible: false,
  },
  afternoon: {
    sunPosition: [-30, 25, 20],
    sunColor: 'hsl(var(--warning))',
    sunIntensity: 2.2,
    ambientColor: 'hsl(var(--muted))',
    ambientIntensity: 0.7,
    skyColor: 'hsl(var(--warning))',
    fogColor: 'hsl(var(--warning))',
    fogDensity: 0.008,
    hasMoon: false,
    starsVisible: false,
  },
  dusk: {
    sunPosition: [-50, 3, 30],
    sunColor: 'hsl(var(--destructive))',
    sunIntensity: 1.0,
    ambientColor: 'hsl(var(--accent))',
    ambientIntensity: 0.4,
    skyColor: 'hsl(var(--accent))',
    fogColor: 'hsl(var(--accent))',
    fogDensity: 0.015,
    hasMoon: true,
    moonPosition: [40, 15, -30],
    moonIntensity: 0.3,
    starsVisible: true,
  },
  night: {
    sunPosition: [0, -50, 0],
    sunColor: 'hsl(var(--background))',
    sunIntensity: 0,
    ambientColor: 'hsl(var(--background))',
    ambientIntensity: 0.2,
    skyColor: 'hsl(var(--background))',
    fogColor: 'hsl(var(--background))',
    fogDensity: 0.02,
    hasMoon: true,
    moonPosition: [10, 40, -20],
    moonIntensity: 0.8,
    starsVisible: true,
  },
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  clear: {
    particleCount: 0,
    particleSpeed: 0,
    particleSize: 0,
    particleColor: 'hsl(var(--foreground))',
    groundReflectivity: 80,
    groundRoughness: 1.0,
    visibilityRange: 1000,
    fogDensity: 0.005,
    shadowIntensity: 1.0,
  },
  rain: {
    particleCount: 2000,
    particleSpeed: 15,
    particleSize: 0.02,
    particleColor: 'hsl(var(--primary))',
    groundReflectivity: 150,
    groundRoughness: 0.3,
    visibilityRange: 500,
    fogDensity: 0.03,
    shadowIntensity: 0.6,
  },
  snow: {
    particleCount: 1500,
    particleSpeed: 2,
    particleSize: 0.05,
    particleColor: 'hsl(var(--foreground))',
    groundReflectivity: 200,
    groundRoughness: 0.8,
    visibilityRange: 300,
    fogDensity: 0.04,
    shadowIntensity: 0.7,
  },
  fog: {
    particleCount: 0,
    particleSpeed: 0,
    particleSize: 0,
    particleColor: 'hsl(var(--muted-foreground))',
    groundReflectivity: 100,
    groundRoughness: 0.9,
    visibilityRange: 200,
    fogDensity: 0.15,
    shadowIntensity: 0.3,
  },
  overcast: {
    particleCount: 0,
    particleSpeed: 0,
    particleSize: 0,
    particleColor: 'hsl(var(--muted-foreground))',
    groundReflectivity: 70,
    groundRoughness: 1.0,
    visibilityRange: 800,
    fogDensity: 0.02,
    shadowIntensity: 0.4,
  },
}

export function getEnvironmentConfig(timeOfDay: TimeOfDay, weather: WeatherType) {
  const timeConfig = TIME_OF_DAY_CONFIGS[timeOfDay]
  const weatherConfig = WEATHER_CONFIGS[weather]

  let adjustedSunIntensity = timeConfig.sunIntensity
  let adjustedAmbientIntensity = timeConfig.ambientIntensity

  if (weather === 'overcast' || weather === 'fog') {
    adjustedSunIntensity *= 0.5
    adjustedAmbientIntensity *= 0.7
  } else if (weather === 'rain') {
    adjustedSunIntensity *= 0.6
    adjustedAmbientIntensity *= 0.8
  } else if (weather === 'snow') {
    adjustedSunIntensity *= 0.7
    adjustedAmbientIntensity *= 1.2
  }

  return {
    time: {
      ...timeConfig,
      sunIntensity: adjustedSunIntensity,
      ambientIntensity: adjustedAmbientIntensity,
    },
    weather: weatherConfig,
  }
}
