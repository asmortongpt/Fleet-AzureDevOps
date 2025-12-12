import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

function VehicleModel({ path }: { path: string }) {
  const { scene } = useGLTF(path || '/models/default-vehicle.glb')
  return <primitive object={scene} scale={0.5} />
}

export function Quick3DTest() {
  return (
    <div style={{ width: '100%', height: '600px' }}>
      <Canvas camera={{ position: [5, 3, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <VehicleModel path="/models/sedan.glb" />
        <OrbitControls />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  )
}

// AI Integration Component
export function QuickAITest() {
  const [response, setResponse] = React.useState('')
  const [loading, setLoading] = React.useState(false)

  const testAI = async () => {
    setLoading(true)
    // SECURITY FIX (HIGH-009): Use environment variable instead of hardcoded localhost URL
    const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
    const res = await fetch(`${apiUrl}/api/ai/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'Analyze vehicle health status' })
    })
    const data = await res.json()
    setResponse(data.response)
    setLoading(false)
  }

  return (
    <div>
      <button onClick={testAI} disabled={loading}>
        {loading ? 'Testing AI...' : 'Test Claude AI'}
      </button>
      {response && <div style={{ marginTop: 10, padding: 10, background: '#f0f0f0' }}>{response}</div>}
    </div>
  )
}
