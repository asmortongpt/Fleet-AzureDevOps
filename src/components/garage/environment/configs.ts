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
    sunColor: '#FF7F50',
    sunIntensity: 1.2,
    ambientColor: '#FFB6C1',
    ambientIntensity: 0.4,
    skyColor: '#FF6B6B',
    fogColor: '#FF9999',
    fogDensity: 0.02,
    hasMoon: false,
    starsVisible: false,
  },
  morning: {
    sunPosition: [30, 20, 20],
    sunColor: '#FFE4B5',
    sunIntensity: 2.0,
    ambientColor: '#FFF8DC',
    ambientIntensity: 0.6,
    skyColor: '#87CEEB',
    fogColor: '#E6F3FF',
    fogDensity: 0.01,
    hasMoon: false,
    starsVisible: false,
  },
  midday: {
    sunPosition: [0, 50, 0],
    sunColor: '#FFFFFF',
    sunIntensity: 3.0,
    ambientColor: '#F5F5F5',
    ambientIntensity: 0.8,
    skyColor: '#4A90E2',
    fogColor: '#E0F0FF',
    fogDensity: 0.005,
    hasMoon: false,
    starsVisible: false,
  },
  afternoon: {
    sunPosition: [-30, 25, 20],
    sunColor: '#FFD700',
    sunIntensity: 2.2,
    ambientColor: '#FFF8E7',
    ambientIntensity: 0.7,
    skyColor: '#FFA500',
    fogColor: '#FFE4B5',
    fogDensity: 0.008,
    hasMoon: false,
    starsVisible: false,
  },
  dusk: {
    sunPosition: [-50, 3, 30],
    sunColor: '#FF4500',
    sunIntensity: 1.0,
    ambientColor: '#9370DB',
    ambientIntensity: 0.4,
    skyColor: '#8B4789',
    fogColor: '#D8BFD8',
    fogDensity: 0.015,
    hasMoon: true,
    moonPosition: [40, 15, -30],
    moonIntensity: 0.3,
    starsVisible: true,
  },
  night: {
    sunPosition: [0, -50, 0],
    sunColor: '#000033',
    sunIntensity: 0,
    ambientColor: '#1a1a3e',
    ambientIntensity: 0.2,
    skyColor: '#0a0a1a',
    fogColor: '#1a1a2e',
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
    particleColor: '#FFFFFF',
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
    particleColor: '#4A90E2',
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
    particleColor: '#FFFFFF',
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
    particleColor: '#CCCCCC',
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
    particleColor: '#AAAAAA',
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
