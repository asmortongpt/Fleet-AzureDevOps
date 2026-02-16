/**
 * Advanced Map Controller
 * Premium map interface with layers, filters, and real-time controls
 */

import { motion } from 'framer-motion'
import { MapPin, Layers, Filter, Eye, EyeOff, Zap, AlertTriangle, Navigation, Settings } from 'lucide-react'
import { useState } from 'react'

interface MapLayer {
  id: string
  label: string
  icon: React.ReactNode
  enabled: boolean
  color: string
}

export function AdvancedMapController() {
  const [layers, setLayers] = useState<MapLayer[]>([
    { id: 'vehicles', label: 'Vehicles', icon: <Navigation className="w-4 h-4" />, enabled: true, color: '#41B2E3' },
    { id: 'routes', label: 'Routes', icon: <MapPin className="w-4 h-4" />, enabled: true, color: '#FF6B35' },
    { id: 'alerts', label: 'Alerts', icon: <AlertTriangle className="w-4 h-4" />, enabled: true, color: '#F0A000' },
    { id: 'heatmap', label: 'Heat Map', icon: <Zap className="w-4 h-4" />, enabled: false, color: '#DD3903' },
  ])

  const [showLayerPanel, setShowLayerPanel] = useState(false)
  const [zoom, setZoom] = useState(12)

  const toggleLayer = (id: string) => {
    setLayers(layers.map(l => l.id === id ? { ...l, enabled: !l.enabled } : l))
  }

  return (
    <div className="relative w-full h-full">
      {/* Zoom Controls */}
      <motion.div
        className="absolute right-6 top-6 z-50 flex flex-col gap-2"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        {['+', '-'].map((btn, i) => (
          <motion.button
            key={btn}
            onClick={() => setZoom(prev => btn === '+' ? Math.min(prev + 1, 20) : Math.max(prev - 1, 1))}
            className="w-10 h-10 rounded-lg backdrop-blur-xl border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center font-bold text-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {btn}
          </motion.button>
        ))}
      </motion.div>

      {/* Layer Controls */}
      <motion.div
        className="absolute left-6 top-6 z-50"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <motion.button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="p-3 rounded-lg backdrop-blur-xl border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Layers className="w-5 h-5" />
        </motion.button>

        {showLayerPanel && (
          <motion.div
            className="absolute top-full left-0 mt-2 rounded-xl backdrop-blur-xl border border-white/20 bg-slate-900/95 p-3 space-y-2 min-w-max"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {layers.map((layer) => (
              <motion.button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                whileHover={{ x: 4 }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span style={{ color: layer.color }}>{layer.icon}</span>
                  <span className="text-sm font-medium">{layer.label}</span>
                </div>
                {layer.enabled ? (
                  <Eye className="w-4 h-4 text-green-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-500" />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </motion.div>

      {/* Map Info Overlay */}
      <motion.div
        className="absolute bottom-6 left-6 z-40 rounded-xl backdrop-blur-xl border border-white/20 bg-slate-900/95 p-6 max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-bold">Map Control</h3>
            <p className="text-xs text-gray-400 mt-1">Zoom level: {zoom}x</p>
          </div>
          <Settings className="w-4 h-4 text-gray-400" />
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-300">Active Layers: {layers.filter(l => l.enabled).length}</p>
          <div className="flex flex-wrap gap-1">
            {layers.filter(l => l.enabled).map(layer => (
              <span
                key={layer.id}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ backgroundColor: `${layer.color}20`, color: layer.color }}
              >
                {layer.label}
              </span>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
