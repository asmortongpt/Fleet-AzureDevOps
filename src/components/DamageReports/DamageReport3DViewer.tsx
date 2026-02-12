import { AlertTriangle, Loader2, Download, RotateCw, ZoomIn, ZoomOut } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import logger from '@/utils/logger';

interface DamageReport3DViewerProps {
  modelUrl: string
}

export function DamageReport3DViewer({ modelUrl }: DamageReport3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scene, setScene] = useState<THREE.Scene | null>(null)
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null)
  const [renderer, setRenderer] = useState<THREE.WebGLRenderer | null>(null)
  const [controls, setControls] = useState<OrbitControls | null>(null)

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return

    // Initialize Three.js scene
    const initScene = () => {
      const container = containerRef.current
      if (!container) return

      // Scene
      const newScene = new THREE.Scene()
      newScene.background = new THREE.Color(0xf0f0f0)

      // Camera
      const newCamera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
      )
      newCamera.position.set(0, 0, 5)

      // Renderer
      const newRenderer = new THREE.WebGLRenderer({ antialias: true })
      newRenderer.setSize(container.clientWidth, container.clientHeight)
      newRenderer.setPixelRatio(window.devicePixelRatio)
      container.appendChild(newRenderer.domElement)

      // Controls
      const newControls = new OrbitControls(newCamera, newRenderer.domElement)
      newControls.enableDamping = true
      newControls.dampingFactor = 0.05
      newControls.minDistance = 2
      newControls.maxDistance = 10

      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
      newScene.add(ambientLight)

      const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8)
      directionalLight1.position.set(5, 10, 7.5)
      newScene.add(directionalLight1)

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4)
      directionalLight2.position.set(-5, -10, -7.5)
      newScene.add(directionalLight2)

      // Grid helper
      const gridHelper = new THREE.GridHelper(10, 10)
      newScene.add(gridHelper)

      setScene(newScene)
      setCamera(newCamera)
      setRenderer(newRenderer)
      setControls(newControls)

      // Load 3D model
      loadModel(newScene, newCamera, newControls)

      // Animation loop
      const animate = () => {
        requestAnimationFrame(animate)
        newControls.update()
        newRenderer.render(newScene, newCamera)
      }
      animate()

      // Handle resize
      const handleResize = () => {
        if (!container) return
        newCamera.aspect = container.clientWidth / container.clientHeight
        newCamera.updateProjectionMatrix()
        newRenderer.setSize(container.clientWidth, container.clientHeight)
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
        container.removeChild(newRenderer.domElement)
        newRenderer.dispose()
      }
    }

    initScene()
  }, [modelUrl])

  const loadModel = (
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls
  ) => {
    setLoading(true)
    setError(null)

    const loader = new GLTFLoader()

    loader.load(
      modelUrl,
      (gltf) => {
        // Add model to scene
        const model = gltf.scene

        // Center the model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)

        // Scale model to fit viewport
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxDim
        model.scale.multiplyScalar(scale)

        scene.add(model)

        // Reset camera position
        camera.position.set(0, 2, 5)
        controls.target.set(0, 0, 0)
        controls.update()

        setLoading(false)
      },
      (progress) => {
        // Loading progress (optional)
        const percentComplete = (progress.loaded / progress.total) * 100
        logger.info(`Loading: ${percentComplete.toFixed(2)}%`)
      },
      (error) => {
        logger.error('Error loading 3D model:', error)
        setError('Failed to load 3D model')
        setLoading(false)
      }
    )
  }

  const handleReset = () => {
    if (camera && controls) {
      camera.position.set(0, 2, 5)
      controls.target.set(0, 0, 0)
      controls.update()
    }
  }

  const handleZoomIn = () => {
    if (camera) {
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      camera.position.addScaledVector(direction, 0.5)
    }
  }

  const handleZoomOut = () => {
    if (camera) {
      const direction = new THREE.Vector3()
      camera.getWorldDirection(direction)
      camera.position.addScaledVector(direction, -0.5)
    }
  }

  const handleDownload = () => {
    window.open(modelUrl, '_blank')
  }

  return (
    <div className="space-y-2">
      {/* 3D Viewer Container */}
      <Card>
        <CardContent className="p-0">
          <div
            ref={containerRef}
            className="relative w-full h-[600px] bg-muted rounded-lg overflow-hidden"
            role="img"
            aria-label="3D model viewer"
          >
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center space-y-2">
                  <Loader2 className="h-9 w-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Loading 3D model...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center space-y-2">
                  <AlertTriangle className="h-9 w-12 mx-auto text-destructive" />
                  <p className="text-destructive">{error}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={loading || !!error}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={loading || !!error}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={loading || !!error}
            aria-label="Reset view"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={loading || !!error}
        >
          <Download className="h-4 w-4 mr-2" />
          Download Model
        </Button>
      </div>

      {/* Instructions */}
      <Card>
        <CardContent className="pt-3">
          <div className="text-sm text-muted-foreground space-y-2">
            <p className="font-semibold">Viewer Controls:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Left click + drag to rotate</li>
              <li>Right click + drag to pan</li>
              <li>Scroll wheel to zoom</li>
              <li>Touch: One finger to rotate, two fingers to pan/zoom</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
