/**
 * Premium Fleet Dashboard
 * Enterprise-grade real-time fleet tracking with advanced analytics
 * Enhanced with sophisticated animations, premium visual effects, and improved UX
 */

import { motion, Variants } from 'framer-motion'
import { MapPin, Activity, AlertTriangle, Zap, Navigation, Map, Wifi, Wrench } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import { ArchonYLogo } from '@/components/branding/ArchonYLogo'
import { LiveFleetMap } from '@/components/Maps/LiveFleetMap'
import { AdvancedMapController } from '@/components/Maps/AdvancedMapController'
import { formatEnum } from '@/utils/format-enum'

const apiFetcher = (url: string) =>
  fetch(url, { credentials: 'include' }).then(r => {
    if (!r.ok) throw new Error(`Request failed: ${r.status}`)
    return r.json()
  })

export function PremiumFleetDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [animatedValue, setAnimatedValue] = useState(0)
  const [isLiveMode, setIsLiveMode] = useState(true)
  const [hoveredMetric, setHoveredMetric] = useState<number | null>(null)

  // Fetch real vehicle data and dashboard stats
  const { data: vehiclesResponse } = useSWR(
    '/api/vehicles?limit=200',
    apiFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  )
  const { data: dashboardStats } = useSWR(
    '/api/dashboard/stats',
    apiFetcher,
    { revalidateOnFocus: false, dedupingInterval: 10000 }
  )

  // Normalize vehicle array from API response
  const vehicles = useMemo(() => {
    if (!vehiclesResponse) return []
    if (Array.isArray(vehiclesResponse)) return vehiclesResponse
    if (vehiclesResponse?.data?.data && Array.isArray(vehiclesResponse.data.data)) return vehiclesResponse.data.data
    if (Array.isArray(vehiclesResponse?.data)) return vehiclesResponse.data
    return []
  }, [vehiclesResponse])

  const colors = {
    orange: '#f5f5f5',
    blue: '#3B82F6',
    green: '#10B981',
    gold: '#a0a0a0',
    red: '#f5f5f5',
    navy: '#1F3076',
    darkBg: '#0F172A',
    cardBg: '#1E293B',
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

  const statVariants: Variants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { delay: i * 0.12, duration: 0.6, ease: 'easeOut' }
    }) as any
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  // Derive metrics from real data
  const dbStats = dashboardStats?.data
  const totalVehicles = dbStats?.total_vehicles ?? vehicles.length
  const activeCount = dbStats?.active_vehicles ?? vehicles.filter((v: any) => v.status === 'active').length
  const maintenanceCount = dbStats?.maintenance_vehicles ?? vehicles.filter((v: any) =>
    v.status === 'maintenance' || v.status === 'service'
  ).length
  const alertCount = dbStats?.active_alerts ?? maintenanceCount

  const metrics = [
    {
      label: 'Active Vehicles',
      value: String(activeCount),
      change: `/${totalVehicles}`,
      icon: MapPin,
      color: colors.blue,
      trend: 'up' as const,
      subtext: 'Online & tracking',
      bgGradient: 'from-blue-500/5 via-blue-500/2 to-transparent'
    },
    {
      label: 'Total Vehicles',
      value: String(totalVehicles),
      change: '',
      icon: Navigation,
      color: colors.orange,
      trend: 'up' as const,
      subtext: 'In fleet',
      bgGradient: 'from-white/5 via-white/2 to-transparent'
    },
    {
      label: 'In Maintenance',
      value: String(maintenanceCount),
      change: '',
      icon: Wrench,
      color: colors.green,
      trend: 'down' as const,
      subtext: 'Service or repair',
      bgGradient: 'from-green-500/5 via-green-500/2 to-transparent'
    },
    {
      label: 'Active Alerts',
      value: String(alertCount),
      change: '',
      icon: AlertTriangle,
      color: colors.gold,
      trend: 'down' as const,
      subtext: 'Requires attention',
      bgGradient: 'from-gray-400/5 via-gray-400/2 to-transparent'
    }
  ]

  // Build recent vehicles from real API data (first 4 vehicles)
  const recentVehicles = useMemo(() => {
    if (vehicles.length === 0) return []
    return vehicles.slice(0, 4).map((v: any) => {
      const name = v.name || v.unit_number || v.vin || `Vehicle ${String(v.id).slice(-4)}`
      const status = v.status || 'unknown'
      const speed = v.speed != null ? `${v.speed} mph` : status === 'active' ? 'Moving' : '—'
      const location = v.location || v.current_location || v.last_known_location || formatEnum(status)
      const fuelLevel = v.fuel_level != null ? `${Math.round(v.fuel_level)}%` : '—'
      return {
        id: String(v.id),
        name,
        location,
        status: status === 'in_service' ? 'active' : status,
        speed,
        efficiency: fuelLevel,
      }
    })
  }, [vehicles])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden relative">
      {/* Premium Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Multiple layered glows for depth */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl"
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.08, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        <motion.div
          className="absolute top-1/2 right-1/3 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
      </div>

      {/* Premium Header */}
      <motion.header
        className="relative z-50 border-b border-white/10 backdrop-blur-2xl bg-gradient-to-r from-slate-950/90 via-slate-900/90 to-slate-900/90"
        style={{
          boxShadow: '0 8px 32px rgba(0, 204, 254, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
        }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ArchonYLogo variant="compact" />
            <div className="flex flex-col gap-0.5">
              <motion.h1
                className="text-3xl font-black tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${colors.orange}, ${colors.blue}, ${colors.orange})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
                whileHover={{ scale: 1.02 }}
              >
                FLEET COMMAND
              </motion.h1>
              <motion.p
                className="text-xs font-semibold flex items-center gap-2"
                style={{ color: colors.blue }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.green }}
                  animate={{ scale: [1, 1.4, 1], boxShadow: [`0 0 4px ${colors.green}`, `0 0 12px ${colors.green}`, `0 0 4px ${colors.green}`] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span>LIVE TRACKING ACTIVE</span>
              </motion.p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Network Status */}
            <motion.div
              className="flex items-center gap-2 px-3 py-2 rounded-lg backdrop-blur-sm"
              style={{ backgroundColor: `${colors.blue}10`, border: `1px solid ${colors.blue}30` }}
              animate={{ opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Wifi className="w-4 h-4" style={{ color: colors.green }} />
              <span className="text-xs font-medium">Connected</span>
            </motion.div>

            {/* Live Mode Toggle */}
            <motion.button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className="px-4 py-2 rounded-lg border transition-all backdrop-blur-sm font-semibold text-sm"
              style={{
                borderColor: isLiveMode ? colors.orange : colors.blue,
                backgroundColor: isLiveMode ? `${colors.orange}15` : `${colors.blue}15`,
                color: isLiveMode ? colors.orange : colors.blue,
              }}
              whileHover={{ scale: 1.05, boxShadow: `0 0 16px ${isLiveMode ? colors.orange : colors.blue}40` }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                animate={{ opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {isLiveMode ? '● LIVE' : '○ PAUSED'}
              </motion.span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        {/* Premium Metrics Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {metrics.map((metric, i) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.label}
                custom={i}
                variants={statVariants}
                onMouseEnter={() => setHoveredMetric(i)}
                onMouseLeave={() => setHoveredMetric(null)}
                className={`group relative overflow-hidden rounded-2xl backdrop-blur-2xl transition-all duration-500 cursor-pointer`}
                style={{
                  border: `1px solid ${hoveredMetric === i ? `${metric.color}60` : 'rgba(255,255,255,0.08)'}`,
                  background: `linear-gradient(135deg, ${hoveredMetric === i ? metric.color : 'rgba(255,255,255,0.02)'}08, transparent)`,
                }}
                whileHover={{ y: -6, scale: 1.02 }}
              >
                {/* Animated glow border on hover */}
                {hoveredMetric === i && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{
                      border: `2px solid ${metric.color}`,
                      boxShadow: `0 0 20px ${metric.color}40, inset 0 0 20px ${metric.color}10`,
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                {/* Gradient background overlay */}
                <div
                  className={`absolute inset-0 transition-opacity duration-500 bg-gradient-to-br ${metric.bgGradient}`}
                  style={{ opacity: hoveredMetric === i ? 1 : 0 }}
                />

                <div className="relative p-6 space-y-4">
                  {/* Header with Premium Icon */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <motion.p
                        className="text-xs font-bold tracking-widest uppercase"
                        style={{ color: metric.color, opacity: 0.9 }}
                        animate={{ letterSpacing: hoveredMetric === i ? '0.15em' : '0.1em' }}
                      >
                        {metric.label}
                      </motion.p>
                      <motion.p
                        className="text-xs mt-2"
                        style={{ color: 'rgba(255,255,255,0.5)' }}
                        animate={{ opacity: hoveredMetric === i ? 0.8 : 0.5 }}
                      >
                        {metric.subtext}
                      </motion.p>
                    </div>
                    <motion.div
                      className="p-3 rounded-xl backdrop-blur-sm"
                      style={{
                        backgroundColor: `${metric.color}20`,
                        border: `1px solid ${metric.color}40`
                      }}
                      animate={{
                        scale: hoveredMetric === i ? 1.1 : 1,
                        boxShadow: hoveredMetric === i ? `0 0 16px ${metric.color}60` : `0 0 0px transparent`
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: metric.color }} />
                    </motion.div>
                  </div>

                  {/* Premium Metric Value */}
                  <div className="space-y-3">
                    <motion.div
                      className="text-4xl font-black tracking-tight"
                      style={{
                        background: `linear-gradient(135deg, ${metric.color}, ${metric.color}cc)`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                      key={metric.value}
                      animate={{ scale: hoveredMetric === i ? 1.05 : 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      {metric.value}
                    </motion.div>

                    {/* Trend indicator */}
                    {metric.change && (
                      <div className="flex items-center justify-between">
                        <motion.span
                          className="text-sm font-bold flex items-center gap-2 px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: `${metric.trend === 'up' ? colors.green : colors.orange}20`,
                            color: metric.trend === 'up' ? colors.green : colors.orange,
                            border: `1px solid ${metric.trend === 'up' ? colors.green : colors.orange}40`
                          }}
                          animate={{
                            scale: hoveredMetric === i ? 1.05 : 1,
                            boxShadow: hoveredMetric === i ? `0 0 12px ${metric.trend === 'up' ? colors.green : colors.orange}40` : 'none'
                          }}
                        >
                          {metric.change}
                        </motion.span>
                      </div>
                    )}
                  </div>

                  {/* Premium progress bar */}
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <motion.div
                      className="h-full rounded-full shadow-lg"
                      style={{
                        background: `linear-gradient(90deg, ${metric.color}, ${metric.color}80)`,
                        boxShadow: `0 0 12px ${metric.color}60`
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: hoveredMetric === i ? '95%' : `${60 + i * 10}%` }}
                      transition={{ duration: 1.2, delay: i * 0.12, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Premium Map Section */}
          <motion.div
            className="lg:col-span-2 rounded-2xl overflow-hidden backdrop-blur-2xl border transition-all duration-500"
            style={{
              border: `1px solid rgba(0, 204, 254, 0.2)`,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
              boxShadow: '0 8px 32px rgba(0, 204, 254, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
            whileHover={{
              y: -6,
              boxShadow: `0 16px 48px rgba(0, 204, 254, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)`
            }}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.35, duration: 0.6, ease: 'easeOut' }}
          >
            <div className="bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 p-6 border-b border-blue-500/10 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Map className="w-5 h-5" style={{ color: colors.blue }} />
                </motion.div>
                <h2 className="text-xl font-bold tracking-tight">
                  <span style={{ color: colors.blue }}>Live Fleet</span> Map
                </h2>
              </div>
            </div>

            {/* Live Fleet Map */}
            <div className="relative w-full h-96 bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden">
              <LiveFleetMap className="w-full h-full" />
              <AdvancedMapController />
            </div>
          </motion.div>

          {/* Right Sidebar - Premium Fleet Status */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
          >
            {/* Premium Fleet Status Panel */}
            <motion.div
              className="rounded-2xl overflow-hidden backdrop-blur-2xl border transition-all duration-500"
              style={{
                border: `1px solid rgba(16, 185, 129, 0.2)`,
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(20, 35, 60, 0.6))',
                boxShadow: '0 8px 32px rgba(16, 185, 129, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
              whileHover={{
                boxShadow: `0 16px 48px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
                borderColor: `rgba(16, 185, 129, 0.4)`
              }}
            >
              <div className="bg-gradient-to-br from-slate-900/60 via-slate-800/40 to-slate-900/60 p-6 border-b border-green-500/10 backdrop-blur-sm">
                <motion.h3
                  className="text-lg font-bold flex items-center gap-2"
                  animate={{ letterSpacing: '0.02em' }}
                >
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                    <Activity className="w-5 h-5" style={{ color: colors.green }} />
                  </motion.div>
                  <span>Fleet Status</span>
                </motion.h3>
              </div>

              <div className="divide-y divide-white/5 max-h-96 overflow-y-auto">
                {recentVehicles.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
                      {vehiclesResponse ? 'No vehicles found' : 'Loading vehicles...'}
                    </p>
                  </div>
                )}
                {recentVehicles.map((vehicle: any, i: number) => (
                  <motion.div
                    key={vehicle.id}
                    className="p-4 transition-colors cursor-pointer group"
                    style={{ backgroundColor: 'rgba(255,255,255,0)' }}
                    whileHover={{ backgroundColor: `rgba(255,255,255,0.04)` }}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + i * 0.08 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <motion.p
                          className="font-semibold text-sm truncate"
                          whileHover={{ scale: 1.02 }}
                        >
                          {vehicle.name}
                        </motion.p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {vehicle.location}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs">
                          <motion.span
                            className="px-2 py-1 rounded-full font-medium border"
                            style={{
                              backgroundColor: vehicle.status === 'active' ? `${colors.green}20` : vehicle.status === 'idle' ? `${colors.orange}20` : `${colors.gold}20`,
                              borderColor: vehicle.status === 'active' ? `${colors.green}40` : vehicle.status === 'idle' ? `${colors.orange}40` : `${colors.gold}40`,
                              color: vehicle.status === 'active' ? colors.green : vehicle.status === 'idle' ? colors.orange : colors.gold,
                            }}
                            whileHover={{ scale: 1.05 }}
                          >
                            ● {vehicle.status.toUpperCase()}
                          </motion.span>
                          <span style={{ color: 'rgba(255,255,255,0.5)' }}>{vehicle.speed}</span>
                        </div>
                      </div>
                      <motion.div
                        className="text-right"
                        animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.25 }}
                      >
                        <p className="font-bold" style={{ color: colors.green, fontSize: '0.95rem' }}>
                          {vehicle.efficiency}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          Fuel Level
                        </p>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Premium System Status Card */}
            <motion.div
              className="rounded-2xl overflow-hidden backdrop-blur-2xl border p-6 transition-all duration-500"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(0,204,254,0.03))`,
                border: `1px solid rgba(255,255,255,0.1)`,
                boxShadow: `0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)`
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: `0 16px 48px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)`,
                borderColor: `rgba(255,255,255,0.2)`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
            >
              <div className="flex items-center justify-between mb-5">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                >
                  <Zap className="w-5 h-5" style={{ color: colors.orange }} />
                </motion.div>
                <motion.span
                  className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: `${colors.orange}20`,
                    color: colors.orange,
                    border: `1px solid ${colors.orange}40`
                  }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  PREMIUM
                </motion.span>
              </div>
              <motion.p
                className="text-2xl font-black mb-2"
                style={{
                  background: `linear-gradient(135deg, ${colors.orange}, ${colors.blue})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                All Systems
              </motion.p>
              <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Optimal Performance
              </p>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${colors.orange}, ${colors.blue})`,
                    boxShadow: `0 0 16px ${colors.orange}60`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: '98%' }}
                  transition={{ duration: 2.5, ease: 'easeOut', delay: 0.6 }}
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
