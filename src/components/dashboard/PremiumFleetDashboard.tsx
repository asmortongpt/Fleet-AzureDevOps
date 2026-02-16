/**
 * Premium Fleet Dashboard
 * Enterprise-grade real-time fleet tracking with advanced analytics
 */

import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Activity, AlertTriangle, TrendingUp, Wind, Fuel, Zap, Navigation, ChevronRight, Map, Settings, Maximize2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ArchonYLogo } from '@/components/branding/ArchonYLogo'

export function PremiumFleetDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [animatedValue, setAnimatedValue] = useState(0)
  const [isLiveMode, setIsLiveMode] = useState(true)

  const colors = {
    orange: '#FF6B35',
    blue: '#41B2E3',
    green: '#10B981',
    gold: '#F0A000',
    red: '#DD3903',
    navy: '#2F3359',
  }

  // Animated counter
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLiveMode) {
      interval = setInterval(() => {
        setAnimatedValue(prev => (prev + 1) % 100)
      }, 2000)
    }
    return () => clearInterval(interval)
  }, [isLiveMode])

  const statVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5 }
    })
  }

  const metrics = [
    {
      label: 'Active Vehicles',
      value: '247',
      change: '+12',
      icon: MapPin,
      color: colors.blue,
      trend: 'up',
      subtext: 'Online & tracking'
    },
    {
      label: 'Total Miles',
      value: '58.3K',
      change: '+2.4K',
      icon: Navigation,
      color: colors.orange,
      trend: 'up',
      subtext: 'This month'
    },
    {
      label: 'Fuel Efficiency',
      value: '94.2%',
      change: '+3.1%',
      icon: Fuel,
      color: colors.green,
      trend: 'up',
      subtext: 'Fleet average'
    },
    {
      label: 'Active Alerts',
      value: '5',
      change: '-2',
      icon: AlertTriangle,
      color: colors.gold,
      trend: 'down',
      subtext: 'Requires attention'
    }
  ]

  const recentVehicles = [
    { id: '1', name: 'Vehicle TX-001', location: 'Route 95 North', status: 'active', speed: '65 mph', efficiency: '92%' },
    { id: '2', name: 'Vehicle TX-002', location: 'Downtown Hub', status: 'idle', speed: '0 mph', efficiency: '88%' },
    { id: '3', name: 'Vehicle TX-003', location: 'Highway 77', status: 'active', speed: '72 mph', efficiency: '95%' },
    { id: '4', name: 'Vehicle TX-004', location: 'Warehouse A', status: 'maintenance', speed: 'N/A', efficiency: '85%' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header */}
      <motion.header
        className="relative z-50 border-b border-white/10 backdrop-blur-xl bg-gradient-to-r from-slate-900/95 to-slate-800/95"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: isLiveMode ? 360 : 0 }}
              transition={{ duration: 20, repeat: Infinity, linear: true }}
            >
              <ArchonYLogo variant="icon" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-blue-400 to-orange-400 bg-clip-text text-transparent">
                FLEET COMMAND
              </h1>
              <p className="text-sm text-blue-300 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                Live Tracking Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className="px-4 py-2 rounded-lg border border-white/20 hover:border-blue-400/50 transition-colors backdrop-blur-sm hover:bg-blue-500/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isLiveMode ? '🔴 LIVE' : '⚪ PAUSED'}
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Metrics Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial="hidden"
          animate="visible"
        >
          {metrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={i}
                custom={i}
                variants={statVariants}
                className="group relative overflow-hidden rounded-2xl backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300"
                whileHover={{ y: -4 }}
              >
                {/* Gradient background */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(135deg, ${metric.color}15, ${metric.color}05)`,
                  }}
                />

                <div className="relative p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-300">{metric.label}</p>
                      <p className="text-xs text-gray-400 mt-1">{metric.subtext}</p>
                    </div>
                    <div
                      className="p-3 rounded-xl backdrop-blur-sm"
                      style={{ backgroundColor: `${metric.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: metric.color }} />
                    </div>
                  </div>

                  {/* Metric Value */}
                  <div className="flex items-baseline justify-between">
                    <motion.div
                      className="text-3xl font-black tracking-tight"
                      key={metric.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {metric.value}
                    </motion.div>
                    <motion.span
                      className="text-sm font-semibold flex items-center gap-1"
                      style={{ color: metric.trend === 'up' ? colors.green : colors.orange }}
                    >
                      {metric.trend === 'up' ? '↑' : '↓'} {metric.change}
                    </motion.span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: metric.color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${60 + i * 10}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <motion.div
            className="lg:col-span-2 rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300"
            whileHover={{ y: -4 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Map className="w-5 h-5" style={{ color: colors.blue }} />
                  <h2 className="text-xl font-bold">Live Fleet Map</h2>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Maximize2 className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="flex gap-2">
                {['MAP', 'SATELLITE', 'HYBRID'].map((mode) => (
                  <motion.button
                    key={mode}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                      mode === 'MAP'
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-400/50'
                        : 'text-gray-400 border border-white/10 hover:border-white/20'
                    }`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {mode}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Map Placeholder */}
            <div
              className="relative w-full h-96 bg-gradient-to-br from-blue-900/20 to-slate-900/50"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, transparent 48%, ${colors.blue}10 49%, ${colors.blue}10 51%, transparent 52%),
                  linear-gradient(-45deg, transparent 48%, ${colors.orange}10 49%, ${colors.orange}10 51%, transparent 52%)
                `,
                backgroundSize: '30px 30px',
              }}
            >
              {/* Animated Map Pins */}
              {recentVehicles.map((vehicle, i) => (
                <motion.div
                  key={vehicle.id}
                  className="absolute"
                  style={{
                    left: `${25 + i * 18}%`,
                    top: `${30 + (i % 2) * 30}%`,
                  }}
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold"
                    style={{
                      backgroundColor: vehicle.status === 'active' ? colors.blue : vehicle.status === 'idle' ? colors.orange : colors.gold,
                      borderColor: 'white',
                    }}
                  >
                    {vehicle.id}
                  </div>
                </motion.div>
              ))}

              {/* Center indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <motion.div
                  className="w-12 h-12 border-2 border-blue-400/30 rounded-full"
                  animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
            </div>
          </motion.div>

          {/* Right Sidebar */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            {/* Active Vehicles List */}
            <div className="rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-300">
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-6 border-b border-white/10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Activity className="w-5 h-5" style={{ color: colors.green }} />
                  Fleet Status
                </h3>
              </div>

              <div className="divide-y divide-white/10">
                {recentVehicles.map((vehicle, i) => (
                  <motion.div
                    key={vehicle.id}
                    className="p-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{vehicle.name}</p>
                        <p className="text-xs text-gray-400 mt-1">{vehicle.location}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs">
                          <span
                            className="px-2 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: vehicle.status === 'active' ? `${colors.green}20` : vehicle.status === 'idle' ? `${colors.orange}20` : `${colors.gold}20`,
                              color: vehicle.status === 'active' ? colors.green : vehicle.status === 'idle' ? colors.orange : colors.gold,
                            }}
                          >
                            {vehicle.status.toUpperCase()}
                          </span>
                          <span className="text-gray-400">{vehicle.speed}</span>
                        </div>
                      </div>
                      <motion.div
                        className="text-right"
                        animate={{ scale: [1, 1.05, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      >
                        <p className="font-bold text-green-400">{vehicle.efficiency}</p>
                        <p className="text-xs text-gray-400">Efficiency</p>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Stats Card */}
            <motion.div
              className="rounded-2xl overflow-hidden backdrop-blur-xl border border-white/10 bg-gradient-to-br from-orange-500/10 to-blue-500/10 p-6"
              whileHover={{ y: -4 }}
            >
              <div className="flex items-center justify-between mb-4">
                <Zap style={{ color: colors.orange }} />
                <span className="text-xs font-semibold text-orange-300">PREMIUM STATUS</span>
              </div>
              <p className="text-2xl font-black mb-2">All Systems</p>
              <p className="text-sm text-gray-300 mb-4">Optimal Performance</p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-400 to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: '98%' }}
                  transition={{ duration: 2 }}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default PremiumFleetDashboard
