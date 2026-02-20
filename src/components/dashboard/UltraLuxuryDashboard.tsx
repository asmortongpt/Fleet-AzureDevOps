/**
 * Ultra-Luxury Fleet Dashboard
 * Next-generation premium interface with ambient particles, animated visualizations, and world-class design
 */

import { motion } from 'framer-motion'
import { MapPin, Zap, AlertTriangle, TrendingUp, Activity, Navigation, Fuel } from 'lucide-react'
import { ArchonYLogo } from '@/components/branding/ArchonYLogo'
import { AnimatedMetricsVisualization } from './AnimatedMetricsVisualization'
import { useState } from 'react'

export function UltraLuxuryDashboard() {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null)

  const colors = {
    orange: '#f5f5f5',      // Neutral white
    blue: '#3B82F6',        // Blue Skies
    green: '#10B981',       // For status indicators (approved by spec)
    gold: '#a0a0a0',        // Neutral gray
    red: '#f5f5f5',         // Neutral white
    navy: '#1F3076',        // Navy (from spec)
  }

  // Premium metrics with real data
  const metrics = [
    {
      id: 'vehicles',
      label: 'Active Vehicles',
      currentValue: 247,
      targetValue: 300,
      trend: 12,
      icon: <MapPin className="w-5 h-5" style={{ color: colors.blue }} />,
      color: colors.blue,
      accentColor: colors.red,
    },
    {
      id: 'miles',
      label: 'Total Miles',
      currentValue: 58300,
      targetValue: 100000,
      trend: 8,
      icon: <Navigation className="w-5 h-5" style={{ color: colors.orange }} />,
      color: colors.orange,
      accentColor: colors.gold,
    },
    {
      id: 'efficiency',
      label: 'Fuel Efficiency',
      currentValue: 94,
      targetValue: 100,
      trend: 3,
      icon: <Fuel className="w-5 h-5" style={{ color: colors.green }} />,
      color: colors.green,
      accentColor: colors.blue,
    },
    {
      id: 'alerts',
      label: 'System Health',
      currentValue: 98,
      targetValue: 100,
      trend: -2,
      icon: <Zap className="w-5 h-5" style={{ color: colors.gold }} />,
      color: colors.gold,
      accentColor: colors.orange,
    },
  ]

  // Advanced ambient particles
  const ambientParticles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 1,
    duration: Math.random() * 15 + 20,
    delay: Math.random() * 5,
    color: [colors.blue, '#ffffff', '#a0a0a0', colors.blue][i % 4],
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#111] via-[#1a1a1a] to-[#111] text-white overflow-hidden relative">
      {/* Ultra-premium ambient background with multi-layered particles and glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Dynamic gradient glows */}
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${colors.blue}30, transparent)` }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${colors.orange}25, transparent)` }}
          animate={{
            opacity: [0.4, 0.7, 0.4],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-72 h-72 rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle, ${colors.blue}20, transparent)` }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.25, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />

        {/* Ambient floating particles */}
        {ambientParticles.map(particle => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 3}px ${particle.color}80`,
            }}
            animate={{
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight - 100],
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth + 50],
              opacity: [0, 0.6, 0],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Animated grid background */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(0deg, transparent 24%, ${colors.blue}05 25%, ${colors.blue}05 26%, transparent 27%, transparent 74%, ${colors.blue}05 75%, ${colors.blue}05 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.02) 26%, transparent 27%, transparent 74%, rgba(255,255,255,0.02) 75%, rgba(255,255,255,0.02) 76%, transparent 77%, transparent)
          `,
          backgroundSize: '50px 50px',
          opacity: 0.2,
        }} />
      </div>

      {/* Premium Header */}
      <motion.header
        className="relative z-50 border-b border-white/10 backdrop-blur-3xl"
        style={{
          background: 'linear-gradient(180deg, rgba(15,23,42,0.9) 0%, rgba(15,23,42,0.7) 100%)',
          boxShadow: `0 8px 32px ${colors.blue}15, inset 0 1px 0 rgba(255,255,255,0.05)`
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-8 py-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ArchonYLogo variant="compact" />
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-black tracking-tight"
                style={{
                  background: `linear-gradient(135deg, ${colors.orange}, ${colors.blue}, ${colors.red})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                FLEET COMMAND
              </h1>
              <motion.p
                className="text-xs font-bold tracking-widest flex items-center gap-2"
                style={{ color: colors.blue }}
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: colors.green }}
                  animate={{
                    scale: [1, 1.5, 1],
                    boxShadow: [`0 0 4px ${colors.green}`, `0 0 12px ${colors.green}`, `0 0 4px ${colors.green}`]
                  }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                LIVE SYSTEM OPERATIONAL
              </motion.p>
            </div>
          </div>
          <motion.div
            className="px-6 py-3 rounded-xl backdrop-blur-sm border"
            style={{
              backgroundColor: `${colors.green}15`,
              borderColor: `${colors.green}40`,
            }}
            whileHover={{ scale: 1.05, boxShadow: `0 0 20px ${colors.green}40` }}
          >
            <span className="text-sm font-bold" style={{ color: colors.green }}>
              ● ALL SYSTEMS OPTIMAL
            </span>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-8 py-12">
        {/* Premium Section Title */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-black tracking-tight mb-2">
            <span style={{ color: colors.blue }}>Real-Time</span> Performance Metrics
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-sm">
            Live fleet analytics with advanced visualization
          </p>
        </motion.div>

        {/* Premium Metrics Grid with Animations */}
        <AnimatedMetricsVisualization metrics={metrics} />

        {/* Ultra-Premium Info Cards Section */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          {/* Fleet Status Card */}
          <PremiumInfoCard
            title="Fleet Status"
            icon={<Activity className="w-6 h-6" />}
            color={colors.green}
            stats={[
              { label: 'Online Vehicles', value: '247 / 300', percentage: 82 },
              { label: 'In Transit', value: '156', percentage: 63 },
              { label: 'Idle', value: '91', percentage: 37 },
            ]}
          />

          {/* Performance Card */}
          <PremiumInfoCard
            title="System Performance"
            icon={<Zap className="w-6 h-6" />}
            color={colors.gold}
            stats={[
              { label: 'CPU Usage', value: '34%', percentage: 34 },
              { label: 'Memory', value: '2.4 GB', percentage: 48 },
              { label: 'Response Time', value: '142 ms', percentage: 28 },
            ]}
          />

          {/* Alerts Card */}
          <PremiumInfoCard
            title="Active Alerts"
            icon={<AlertTriangle className="w-6 h-6" />}
            color={colors.orange}
            stats={[
              { label: 'Critical', value: '0', percentage: 0 },
              { label: 'Warning', value: '3', percentage: 15 },
              { label: 'Info', value: '8', percentage: 40 },
            ]}
          />
        </motion.div>

        {/* Premium Footer */}
        <motion.div
          className="mt-16 p-8 rounded-2xl backdrop-blur-2xl border"
          style={{
            border: `1px solid ${colors.blue}20`,
            background: `linear-gradient(135deg, ${colors.blue}08, rgba(255,255,255,0.02))`,
            boxShadow: `0 8px 32px ${colors.blue}10, inset 0 1px 0 rgba(255,255,255,0.05)`
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black mb-2">Powered by Archon-Y Intelligence</h3>
              <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-sm">
                Enterprise-grade fleet management with real-time analytics and AI-driven insights
              </p>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <ArchonYLogo variant="icon" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function PremiumInfoCard({
  title,
  icon,
  color,
  stats
}: {
  title: string
  icon: React.ReactNode
  color: string
  stats: Array<{ label: string; value: string; percentage: number }>
}) {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null)

  return (
    <motion.div
      className="group rounded-2xl backdrop-blur-2xl border p-8 transition-all duration-500 cursor-pointer"
      style={{
        border: `1px solid ${color}20`,
        background: `linear-gradient(135deg, ${color}08, transparent)`,
      }}
      whileHover={{
        y: -8,
        boxShadow: `0 20px 60px ${color}30, inset 0 1px 0 rgba(255,255,255,0.1)`
      }}
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at center, ${color}20, transparent)`,
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black tracking-tight">{title}</h3>
          <motion.div
            style={{ color }}
            whileHover={{ scale: 1.2, rotate: 10 }}
          >
            {icon}
          </motion.div>
        </div>

        {/* Stats */}
        <div className="space-y-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              onMouseEnter={() => setHoveredStat(index)}
              onMouseLeave={() => setHoveredStat(null)}
              className="space-y-2"
            >
              <div className="flex justify-between items-center text-sm">
                <span style={{ color: 'rgba(255,255,255,0.8)' }} className="font-medium">
                  {stat.label}
                </span>
                <motion.span
                  style={{ color }}
                  className="font-bold"
                  animate={{
                    scale: hoveredStat === index ? 1.1 : 1,
                  }}
                >
                  {stat.value}
                </motion.span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${color}, ${color}80)`,
                    boxShadow: `0 0 16px ${color}60`
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: hoveredStat === index ? '100%' : `${stat.percentage}%` }}
                  transition={{ duration: hoveredStat === index ? 0.4 : 0.8 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default UltraLuxuryDashboard
