/**
 * Enhanced Fleet Map Dashboard
 * Professional interface for real-time fleet tracking
 */

import { motion } from 'framer-motion'
import { MapPin, Zap, AlertCircle, TrendingUp, Truck } from 'lucide-react'

import { LiveFleetMap } from './LiveFleetMap'

import { ArchonYLogo } from '@/components/branding/ArchonYLogo'

export function EnhancedFleetMapDashboard() {
  const colors = {
    orange: '#f5f5f5',
    blue: '#3B82F6',
    green: '#10B981',
    gold: '#a0a0a0',
  }

  const stats = [
    { label: 'Active Vehicles', value: '156', icon: Truck, color: colors.blue },
    { label: 'In Transit', value: '89', icon: Zap, color: colors.orange },
    { label: 'Alerts', value: '3', icon: AlertCircle, color: colors.gold },
    { label: 'Avg Efficiency', value: '94.2%', icon: TrendingUp, color: colors.green },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Header */}
      <motion.div
        className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-10"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6" style={{ color: colors.blue }} />
            <div>
              <h1 className="text-2xl font-bold">Live Fleet Tracking</h1>
              <p className="text-sm text-muted-foreground">Real-time vehicle monitoring and analytics</p>
            </div>
          </div>
          <div className="hidden md:block opacity-70 hover:opacity-100 transition-opacity">
            <ArchonYLogo variant="icon" />
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              className="rounded-xl p-4 border border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-border/80 transition-colors"
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm font-semibold text-muted-foreground">{stat.label}</span>
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Map Container */}
      <motion.div
        className="max-w-7xl mx-auto px-4 pb-8"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="rounded-2xl overflow-hidden border border-border/50 shadow-2xl" 
          style={{
            background: `linear-gradient(135deg, ${colors.orange}08, ${colors.blue}08)`,
            boxShadow: `0 20px 60px -12px ${colors.blue}20`
          }}>
          <div className="relative w-full h-[600px]">
            <LiveFleetMap className="w-full h-full" />
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <motion.div
        className="border-t border-border/50 bg-background/50 backdrop-blur-xl py-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Status</p>
              <p className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                All systems operational
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Last Updated</p>
              <p>Just now • Real-time sync enabled</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-1">Data</p>
              <p>Powered by Archon-Y Intelligence</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default EnhancedFleetMapDashboard
