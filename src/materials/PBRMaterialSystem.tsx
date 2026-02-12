/**
 * PBRMaterialSystem.tsx
 * Realistic Physically Based Rendering (PBR) materials and environment lighting
 * Optimized for Fleet Showroom with Mac M3 performance considerations
 */

import * as THREE from 'three'

// Local type definitions (not exported from their respective modules)
export type ViewMode = 'exterior' | 'interior' | 'engine' | 'trunk'

export interface LODLevel {
  materialQuality: 'low' | 'medium' | 'high'
}

export interface PBRMaterialConfig {
  albedo: string | THREE.Color
  metalness: number
  roughness: number
  normal?: THREE.Texture
  emissive?: string | THREE.Color
  emissiveIntensity?: number
  clearcoat?: number
  clearcoatRoughness?: number
  transmission?: number
  thickness?: number
  ior?: number
  envMapIntensity?: number
}

export interface EnvironmentConfig {
  preset: 'studio' | 'city' | 'sunset' | 'dawn' | 'warehouse' | 'forest' | 'apartment'
  intensity: number
  backgroundBlur: number
  backgroundIntensity: number
  rotationY: number
  toneMapping?: THREE.ToneMapping
  toneMappingExposure?: number
}

export interface LightingRig {
  keyLight: THREE.DirectionalLight
  fillLight: THREE.DirectionalLight
  rimLight: THREE.DirectionalLight
  ambient: THREE.AmbientLight
  environment: THREE.Texture | null
}

export class PBRMaterialSystem {
  private materialCache: Map<string, THREE.Material> = new Map()
  private textureCache: Map<string, THREE.Texture> = new Map()
  private environmentCache: Map<string, THREE.Texture> = new Map()
  private currentEnvironment: EnvironmentConfig | null = null
  private renderer: THREE.WebGLRenderer | null = null
  private pmremGenerator: THREE.PMREMGenerator | null = null

  constructor(renderer?: THREE.WebGLRenderer) {
    this.renderer = renderer || null
    
    if (this.renderer) {
      this.pmremGenerator = new THREE.PMREMGenerator(this.renderer)
      this.pmremGenerator.compileEquirectangularShader()
    }
    
    this.setupBaseMaterials()
  }

  private setupBaseMaterials(): void {
    // Automotive Paint Materials
    this.createPaintMaterial('metallic_paint', {
      albedo: '#ffffff',
      metalness: 0.9,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      envMapIntensity: 1.2
    })

    this.createPaintMaterial('pearl_paint', {
      albedo: '#f8f9fa',
      metalness: 0.85,
      roughness: 0.15,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.1
    })

    this.createPaintMaterial('matte_paint', {
      albedo: '#ffffff',
      metalness: 0.1,
      roughness: 0.8,
      clearcoat: 0.0,
      envMapIntensity: 0.5
    })

    // Glass Materials
    this.createGlassMaterial('windshield', {
      albedo: '#87ceeb',
      metalness: 0.0,
      roughness: 0.0,
      transmission: 0.9,
      thickness: 0.5,
      ior: 1.5,
      envMapIntensity: 1.0
    })

    this.createGlassMaterial('tinted_glass', {
      albedo: '#2c3e50',
      metalness: 0.0,
      roughness: 0.1,
      transmission: 0.7,
      thickness: 0.5,
      ior: 1.5,
      envMapIntensity: 0.8
    })

    // Metal Materials
    this.createMetalMaterial('chrome', {
      albedo: '#f8f9fa',
      metalness: 1.0,
      roughness: 0.05,
      envMapIntensity: 1.5
    })

    this.createMetalMaterial('brushed_aluminum', {
      albedo: '#e9ecef',
      metalness: 1.0,
      roughness: 0.3,
      envMapIntensity: 1.2
    })

    // Rubber and Plastic Materials
    this.createRubberMaterial('tire_rubber', {
      albedo: '#1a1a1a',
      metalness: 0.0,
      roughness: 0.9,
      envMapIntensity: 0.3
    })

    this.createPlasticMaterial('interior_plastic', {
      albedo: '#2c3e50',
      metalness: 0.0,
      roughness: 0.7,
      envMapIntensity: 0.4
    })

    // Fabric Materials
    this.createFabricMaterial('leather', {
      albedo: '#8b4513',
      metalness: 0.0,
      roughness: 0.8,
      envMapIntensity: 0.2
    })

    this.createFabricMaterial('alcantara', {
      albedo: '#2c3e50',
      metalness: 0.0,
      roughness: 0.9,
      envMapIntensity: 0.1
    })
  }

  createPaintMaterial(name: string, config: PBRMaterialConfig): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({
      color: typeof config.albedo === 'string' ? new THREE.Color(config.albedo) : config.albedo,
      metalness: config.metalness,
      roughness: config.roughness,
      normalMap: config.normal,
      emissive: config.emissive ? (typeof config.emissive === 'string' ? new THREE.Color(config.emissive) : config.emissive) : new THREE.Color(0x000000),
      emissiveIntensity: config.emissiveIntensity || 0,
      clearcoat: config.clearcoat || 0,
      clearcoatRoughness: config.clearcoatRoughness || 0,
      envMapIntensity: config.envMapIntensity || 1.0,
      side: THREE.FrontSide
    })

    // Add automotive-specific properties
    material.userData.materialType = 'paint'
    material.userData.originalConfig = config

    this.materialCache.set(`paint_${name}`, material)
    return material
  }

  createGlassMaterial(name: string, config: PBRMaterialConfig): THREE.MeshPhysicalMaterial {
    const material = new THREE.MeshPhysicalMaterial({
      color: typeof config.albedo === 'string' ? new THREE.Color(config.albedo) : config.albedo,
      metalness: config.metalness || 0,
      roughness: config.roughness || 0,
      transmission: config.transmission || 0.9,
      thickness: config.thickness || 0.5,
      ior: config.ior || 1.5,
      envMapIntensity: config.envMapIntensity || 1.0,
      transparent: true,
      side: THREE.DoubleSide
    })

    // Glass-specific properties
    material.userData.materialType = 'glass'
    material.userData.originalConfig = config

    this.materialCache.set(`glass_${name}`, material)
    return material
  }

  createMetalMaterial(name: string, config: PBRMaterialConfig): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: typeof config.albedo === 'string' ? new THREE.Color(config.albedo) : config.albedo,
      metalness: config.metalness,
      roughness: config.roughness,
      normalMap: config.normal,
      envMapIntensity: config.envMapIntensity || 1.0
    })

    // Metal-specific properties
    material.userData.materialType = 'metal'
    material.userData.originalConfig = config

    this.materialCache.set(`metal_${name}`, material)
    return material
  }

  createRubberMaterial(name: string, config: PBRMaterialConfig): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: typeof config.albedo === 'string' ? new THREE.Color(config.albedo) : config.albedo,
      metalness: config.metalness || 0,
      roughness: config.roughness,
      normalMap: config.normal,
      envMapIntensity: config.envMapIntensity || 0.3
    })

    // Generate procedural normal map for tire texture
    if (name.includes('tire')) {
      material.normalMap = this.generateTireNormalMap()
      material.normalScale = new THREE.Vector2(0.5, 0.5)
    }

    material.userData.materialType = 'rubber'
    material.userData.originalConfig = config

    this.materialCache.set(`rubber_${name}`, material)
    return material
  }

  createPlasticMaterial(name: string, config: PBRMaterialConfig): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: typeof config.albedo === 'string' ? new THREE.Color(config.albedo) : config.albedo,
      metalness: config.metalness || 0,
      roughness: config.roughness,
      envMapIntensity: config.envMapIntensity || 0.4
    })

    material.userData.materialType = 'plastic'
    material.userData.originalConfig = config

    this.materialCache.set(`plastic_${name}`, material)
    return material
  }

  createFabricMaterial(name: string, config: PBRMaterialConfig): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: typeof config.albedo === 'string' ? new THREE.Color(config.albedo) : config.albedo,
      metalness: config.metalness || 0,
      roughness: config.roughness,
      envMapIntensity: config.envMapIntensity || 0.2
    })

    // Add subtle normal mapping for fabric texture
    if (name === 'leather') {
      material.normalMap = this.generateLeatherNormalMap()
      material.normalScale = new THREE.Vector2(0.3, 0.3)
    } else if (name === 'alcantara') {
      material.normalMap = this.generateAlcantaraNormalMap()
      material.normalScale = new THREE.Vector2(0.2, 0.2)
    }

    material.userData.materialType = 'fabric'
    material.userData.originalConfig = config

    this.materialCache.set(`fabric_${name}`, material)
    return material
  }

  // Environment and lighting management
  setEnvironment(config: EnvironmentConfig): Promise<THREE.Texture | null> {
    return new Promise((resolve) => {
      this.currentEnvironment = config
      
      const envTexture = this.getEnvironmentTexture(config.preset)
      if (envTexture) {
        envTexture.mapping = THREE.EquirectangularReflectionMapping
        
        // Apply configuration
        if (this.renderer && this.pmremGenerator) {
          const envMap = this.pmremGenerator.fromEquirectangular(envTexture).texture
          // Store intensity in userData for later use in materials
          envMap.userData.intensity = config.intensity
          
          // Set up tone mapping
          if (config.toneMapping !== undefined) {
            this.renderer.toneMapping = config.toneMapping
          }
          if (config.toneMappingExposure !== undefined) {
            this.renderer.toneMappingExposure = config.toneMappingExposure
          }
          
          // Update all materials with new environment map
          this.updateMaterialsWithEnvironment(envMap)
          
          resolve(envMap)
        } else {
          resolve(envTexture)
        }
      } else {
        resolve(null)
      }
    })
  }

  createLightingRig(viewMode: ViewMode, environmentConfig?: EnvironmentConfig): LightingRig {
    const rig: LightingRig = {
      keyLight: new THREE.DirectionalLight(),
      fillLight: new THREE.DirectionalLight(),
      rimLight: new THREE.DirectionalLight(),
      ambient: new THREE.AmbientLight(),
      environment: null
    }

    switch (viewMode) {
      case 'exterior':
        this.setupExteriorLighting(rig, environmentConfig)
        break
      case 'interior':
        this.setupInteriorLighting(rig, environmentConfig)
        break
      case 'engine':
        this.setupEngineCompartmentLighting(rig, environmentConfig)
        break
      case 'trunk':
        this.setupTrunkLighting(rig, environmentConfig)
        break
    }

    return rig
  }

  private setupExteriorLighting(rig: LightingRig, envConfig?: EnvironmentConfig): void {
    // Key light (sun)
    rig.keyLight.color.setHex(0xffffff)
    rig.keyLight.intensity = 3.0
    rig.keyLight.position.set(10, 10, 5)
    rig.keyLight.castShadow = true
    rig.keyLight.shadow.mapSize.width = 2048
    rig.keyLight.shadow.mapSize.height = 2048
    rig.keyLight.shadow.camera.near = 0.5
    rig.keyLight.shadow.camera.far = 50
    rig.keyLight.shadow.camera.left = -10
    rig.keyLight.shadow.camera.right = 10
    rig.keyLight.shadow.camera.top = 10
    rig.keyLight.shadow.camera.bottom = -10

    // Fill light (sky)
    rig.fillLight.color.setHex(0x87ceeb)
    rig.fillLight.intensity = 1.0
    rig.fillLight.position.set(-5, 8, -5)

    // Rim light (bounce/reflection)
    rig.rimLight.color.setHex(0xffd700)
    rig.rimLight.intensity = 0.8
    rig.rimLight.position.set(-10, 5, 10)

    // Ambient
    rig.ambient.color.setHex(0x404040)
    rig.ambient.intensity = 0.4
  }

  private setupInteriorLighting(rig: LightingRig, envConfig?: EnvironmentConfig): void {
    // Key light (dashboard lighting)
    rig.keyLight.color.setHex(0xfff8dc)
    rig.keyLight.intensity = 1.5
    rig.keyLight.position.set(0, 2, 2)
    rig.keyLight.castShadow = true
    rig.keyLight.shadow.mapSize.width = 1024
    rig.keyLight.shadow.mapSize.height = 1024

    // Fill light (ambient interior)
    rig.fillLight.color.setHex(0x87ceeb)
    rig.fillLight.intensity = 0.8
    rig.fillLight.position.set(-2, 1.5, -1)

    // Rim light (screen glow)
    rig.rimLight.color.setHex(0x4da6ff)
    rig.rimLight.intensity = 0.3
    rig.rimLight.position.set(0, 1.3, 0.5)

    // Ambient
    rig.ambient.color.setHex(0x2c3e50)
    rig.ambient.intensity = 0.6
  }

  private setupEngineCompartmentLighting(rig: LightingRig, envConfig?: EnvironmentConfig): void {
    // Key light (overhead)
    rig.keyLight.color.setHex(0xffffff)
    rig.keyLight.intensity = 2.0
    rig.keyLight.position.set(0, 3, 2)
    rig.keyLight.castShadow = true

    // Fill light
    rig.fillLight.color.setHex(0xf0f0f0)
    rig.fillLight.intensity = 1.2
    rig.fillLight.position.set(2, 2, 1)

    // Rim light
    rig.rimLight.color.setHex(0xffa500)
    rig.rimLight.intensity = 0.6
    rig.rimLight.position.set(-2, 1, 2)

    // Ambient
    rig.ambient.color.setHex(0x505050)
    rig.ambient.intensity = 0.5
  }

  private setupTrunkLighting(rig: LightingRig, envConfig?: EnvironmentConfig): void {
    // Key light (trunk light)
    rig.keyLight.color.setHex(0xffffff)
    rig.keyLight.intensity = 1.8
    rig.keyLight.position.set(0, 2, -2)
    rig.keyLight.castShadow = true

    // Fill light
    rig.fillLight.color.setHex(0xf5f5f5)
    rig.fillLight.intensity = 1.0
    rig.fillLight.position.set(1, 1.5, -1.5)

    // Rim light
    rig.rimLight.color.setHex(0xffd700)
    rig.rimLight.intensity = 0.4
    rig.rimLight.position.set(-1, 1, -2)

    // Ambient
    rig.ambient.color.setHex(0x404040)
    rig.ambient.intensity = 0.4
  }

  // Material adaptation based on LOD and viewing conditions
  adaptMaterialsForLOD(materials: THREE.Material[], lodLevel: LODLevel): THREE.Material[] {
    return materials.map(material => {
      const adaptedMaterial = material.clone()
      
      if (adaptedMaterial instanceof THREE.MeshStandardMaterial || 
          adaptedMaterial instanceof THREE.MeshPhysicalMaterial) {
        
        switch (lodLevel.materialQuality) {
          case 'low':
            adaptedMaterial.roughness = Math.min(1, adaptedMaterial.roughness + 0.2)
            adaptedMaterial.metalness = Math.max(0, adaptedMaterial.metalness - 0.1)
            if ('clearcoat' in adaptedMaterial) {
              adaptedMaterial.clearcoat = 0
            }
            adaptedMaterial.envMapIntensity *= 0.5
            break
            
          case 'medium':
            adaptedMaterial.roughness = Math.min(1, adaptedMaterial.roughness + 0.1)
            if ('clearcoat' in adaptedMaterial) {
              (adaptedMaterial as THREE.MeshPhysicalMaterial).clearcoat *= 0.7
            }
            adaptedMaterial.envMapIntensity *= 0.8
            break
            
          default: // high
            // Keep original quality
            break
        }
      }
      
      return adaptedMaterial
    })
  }

  // Utility methods
  private getEnvironmentTexture(preset: EnvironmentConfig['preset']): THREE.Texture | null {
    // In a real implementation, these would be loaded from actual HDR files
    // For now, we'll create procedural environments or use drei presets
    const cached = this.environmentCache.get(preset)
    if (cached) return cached
    
    // Create procedural environment textures
    const envTexture = this.createProceduralEnvironment(preset)
    if (envTexture) {
      this.environmentCache.set(preset, envTexture)
    }
    
    return envTexture
  }

  private createProceduralEnvironment(preset: EnvironmentConfig['preset']): THREE.Texture | null {
    // Create a simple gradient environment map
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size * 2 // Equirectangular is 2:1 ratio
    canvas.height = size
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    
    const gradient = ctx.createLinearGradient(0, 0, 0, size)
    
    switch (preset) {
      case 'studio':
        gradient.addColorStop(0, '#f0f0f0')
        gradient.addColorStop(0.5, '#e0e0e0')
        gradient.addColorStop(1, '#c0c0c0')
        break
      case 'city':
        gradient.addColorStop(0, '#87ceeb')
        gradient.addColorStop(0.7, '#4682b4')
        gradient.addColorStop(1, '#2f4f4f')
        break
      case 'sunset':
        gradient.addColorStop(0, '#ff6b47')
        gradient.addColorStop(0.5, '#ffa500')
        gradient.addColorStop(1, '#ff4500')
        break
      default:
        gradient.addColorStop(0, '#ffffff')
        gradient.addColorStop(1, '#cccccc')
    }
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.mapping = THREE.EquirectangularReflectionMapping
    texture.colorSpace = THREE.SRGBColorSpace
    
    return texture
  }

  private generateTireNormalMap(): THREE.Texture {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return new THREE.Texture()
    
    // Create tire tread pattern
    ctx.fillStyle = '#8080ff' // Normal map blue base
    ctx.fillRect(0, 0, size, size)
    
    ctx.fillStyle = '#4040ff'
    for (let i = 0; i < 20; i++) {
      const y = (i / 20) * size
      ctx.fillRect(0, y, size, 8)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(4, 1)
    
    return texture
  }

  private generateLeatherNormalMap(): THREE.Texture {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return new THREE.Texture()
    
    // Create leather grain pattern
    ctx.fillStyle = '#8080ff'
    ctx.fillRect(0, 0, size, size)
    
    // Add subtle grain
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      const radius = Math.random() * 3 + 1
      
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = Math.random() > 0.5 ? '#9090ff' : '#7070ff'
      ctx.fill()
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(2, 2)
    
    return texture
  }

  private generateAlcantaraNormalMap(): THREE.Texture {
    const size = 256
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return new THREE.Texture()
    
    // Create alcantara-like texture
    ctx.fillStyle = '#8080ff'
    ctx.fillRect(0, 0, size, size)
    
    // Add fibrous texture
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * size
      const y = Math.random() * size
      
      ctx.fillStyle = Math.random() > 0.5 ? '#8585ff' : '#7b7bff'
      ctx.fillRect(x, y, 1, 1)
    }
    
    const texture = new THREE.CanvasTexture(canvas)
    texture.wrapS = THREE.RepeatWrapping
    texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(1, 1)
    
    return texture
  }

  private updateMaterialsWithEnvironment(envMap: THREE.Texture): void {
    this.materialCache.forEach(material => {
      if (material instanceof THREE.MeshStandardMaterial || 
          material instanceof THREE.MeshPhysicalMaterial) {
        material.envMap = envMap
        material.needsUpdate = true
      }
    })
  }

  // Public API
  getMaterial(type: string, name: string): THREE.Material | null {
    return this.materialCache.get(`${type}_${name}`) || null
  }

  getAllMaterials(): Map<string, THREE.Material> {
    return new Map(this.materialCache)
  }

  clearCache(): void {
    this.materialCache.clear()
    this.textureCache.clear()
    this.environmentCache.clear()
    this.setupBaseMaterials()
  }

  dispose(): void {
    this.materialCache.forEach(material => material.dispose())
    this.textureCache.forEach(texture => texture.dispose())
    this.environmentCache.forEach(texture => texture.dispose())
    
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose()
    }
  }
}