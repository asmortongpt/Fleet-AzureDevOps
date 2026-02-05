/**
 * Fleet Hub - Redesigned using UI/UX Pro Max Design System
 *
 * Design Approach:
 * - Style: Glassmorphism + Bento Box Grid
 * - Color: Professional Tech (Blue-Gray palette)
 * - Typography: Inter + Manrope (Professional Modern)
 * - Effects: Soft shadows, smooth transitions (250ms)
 * - Accessibility: WCAG AA compliant, reduced motion support
 */

import { useState, useEffect } from 'react'
import {
  Truck,
  AlertTriangle,
  CheckCircle2,
  Activity,
  MapPin,
  TrendingUp,
  Zap,
  Shield,
  Users,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'

interface FleetMetric {
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down'
  icon: any
  color: string
}

export function FleetHubProMax() {
  const shouldReduceMotion = useReducedMotion()
  const [activeVehicles, setActiveVehicles] = useState(0)
  const [alerts, setAlerts] = useState(0)

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setActiveVehicles(prev => Math.min(156, prev + Math.floor(Math.random() * 3)))
      setAlerts(prev => Math.max(0, prev + Math.floor(Math.random() * 2) - 1))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const metrics: FleetMetric[] = [
    {
      label: 'Active Vehicles',
      value: activeVehicles || 142,
      change: 8.2,
      trend: 'up',
      icon: Truck,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      label: 'Safety Score',
      value: '94.8%',
      change: 2.1,
      trend: 'up',
      icon: Shield,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      label: 'Active Alerts',
      value: alerts || 3,
      change: -12.5,
      trend: 'down',
      icon: AlertTriangle,
      color: 'from-orange-500 to-amber-500'
    },
    {
      label: 'Efficiency',
      value: '87.3%',
      change: 5.7,
      trend: 'up',
      icon: Zap,
      color: 'from-violet-500 to-purple-500'
    }
  ]

  const animationProps = shouldReduceMotion ? {} : {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.25, ease: 'easeOut' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-6">
      {/* Header with Glassmorphism */}
      <motion.header
        className="mb-8 backdrop-blur-xl bg-white/70 rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-white/20"
        {...animationProps}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Fleet Command Center
            </h1>
            <p className="text-slate-600 mt-2 font-medium">
              Real-time monitoring and predictive insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-700">Live</span>
            </div>
            <button
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-250 hover:scale-105 cursor-pointer"
              aria-label="View detailed analytics"
            >
              Analytics
            </button>
          </div>
        </div>
      </motion.header>

      {/* Bento Box Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Key Metrics - Top Row */}
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            className="col-span-12 md:col-span-6 lg:col-span-3"
            {...(!shouldReduceMotion && {
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.25, delay: index * 0.05 }
            })}
          >
            <div className="group relative backdrop-blur-xl bg-white/80 rounded-2xl p-6 shadow-lg shadow-slate-200/50 border border-white/20 hover:shadow-xl hover:shadow-slate-300/50 transition-all duration-250 cursor-pointer overflow-hidden">
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-0 group-hover:opacity-5 transition-opacity duration-250`} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${metric.color} shadow-lg`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-bold ${
                    metric.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {metric.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(metric.change)}%
                  </div>
                </div>

                <h3 className="text-3xl font-bold text-slate-900 mb-1">
                  {metric.value}
                </h3>
                <p className="text-sm text-slate-600 font-medium">
                  {metric.label}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Live Fleet Map - Large Bento Box */}
        <motion.div
          className="col-span-12 lg:col-span-8"
          {...(!shouldReduceMotion && {
            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            transition: { duration: 0.3, delay: 0.2 }
          })}
        >
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-white/20 h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Live Fleet Tracking</h2>
                  <p className="text-sm text-slate-600">142 vehicles in service area</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors duration-200 cursor-pointer">
                  3D View
                </button>
                <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all duration-200 cursor-pointer">
                  Fullscreen
                </button>
              </div>
            </div>

            {/* Map Placeholder with Glassmorphic Overlays */}
            <div className="relative h-[400px] rounded-2xl bg-gradient-to-br from-slate-100 to-blue-50 overflow-hidden">
              {/* Simulated map with vehicle markers */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Activity className="w-16 h-16 text-slate-400 mx-auto mb-3 animate-pulse" />
                  <p className="text-slate-600 font-medium">Interactive Fleet Map</p>
                  <p className="text-sm text-slate-500">Real-time GPS tracking visualization</p>
                </div>
              </div>

              {/* Floating Status Cards */}
              <div className="absolute top-4 left-4 backdrop-blur-xl bg-white/90 rounded-xl p-3 shadow-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-slate-700">Online: 142</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 backdrop-blur-xl bg-white/90 rounded-xl p-3 shadow-lg border border-white/20">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-semibold text-slate-700">Alerts: {alerts || 3}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Activity Feed - Right Column */}
        <motion.div
          className="col-span-12 lg:col-span-4"
          {...(!shouldReduceMotion && {
            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            transition: { duration: 0.3, delay: 0.25 }
          })}
        >
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-white/20 h-[500px] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Live Activity</h2>
            </div>

            <div className="flex-1 overflow-auto space-y-3">
              {[
                { type: 'success', icon: CheckCircle2, text: 'Vehicle FL-2847 completed delivery', time: '2m ago', color: 'emerald' },
                { type: 'warning', icon: AlertTriangle, text: 'Low fuel alert: FL-1923', time: '5m ago', color: 'amber' },
                { type: 'info', icon: Truck, text: 'FL-3156 departed warehouse', time: '8m ago', color: 'blue' },
                { type: 'success', icon: Shield, text: 'Safety inspection passed: FL-2001', time: '12m ago', color: 'emerald' },
                { type: 'info', icon: Calendar, text: 'Maintenance scheduled: 3 vehicles', time: '15m ago', color: 'violet' }
              ].map((activity, index) => (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-200 cursor-pointer group"
                  {...(!shouldReduceMotion && {
                    initial: { opacity: 0, x: 10 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.2, delay: 0.3 + index * 0.05 }
                  })}
                >
                  <div className={`p-2 rounded-lg bg-${activity.color}-100 text-${activity.color}-600 group-hover:scale-110 transition-transform duration-200`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 leading-tight">
                      {activity.text}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Performance Analytics - Bottom Row */}
        <motion.div
          className="col-span-12 lg:col-span-6"
          {...(!shouldReduceMotion && {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3, delay: 0.3 }
          })}
        >
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Performance Trends</h2>
                <p className="text-sm text-slate-600">Last 30 days</p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-48 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
              <p className="text-slate-500 font-medium">Interactive Performance Chart</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                <p className="text-2xl font-bold text-slate-900">+12.5%</p>
                <p className="text-xs text-slate-600 mt-1">Efficiency</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50">
                <p className="text-2xl font-bold text-slate-900">-8.3%</p>
                <p className="text-xs text-slate-600 mt-1">Fuel Cost</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50">
                <p className="text-2xl font-bold text-slate-900">98.2%</p>
                <p className="text-xs text-slate-600 mt-1">Uptime</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Driver Performance */}
        <motion.div
          className="col-span-12 lg:col-span-6"
          {...(!shouldReduceMotion && {
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.3, delay: 0.35 }
          })}
        >
          <div className="backdrop-blur-xl bg-white/80 rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Top Drivers</h2>
                <p className="text-sm text-slate-600">By safety score</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Sarah Johnson', score: 98.5, deliveries: 127, badge: '🏆' },
                { name: 'Mike Chen', score: 96.8, deliveries: 115, badge: '🥈' },
                { name: 'Alex Rivera', score: 95.2, deliveries: 103, badge: '🥉' }
              ].map((driver, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-blue-50 hover:from-slate-100 hover:to-blue-100 transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-lg">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{driver.name}</p>
                      <p className="text-xs text-slate-600">{driver.deliveries} deliveries</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">{driver.score}</p>
                    <p className="text-xs text-slate-600">Safety Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Accessibility: Hidden screen reader announcement for live updates */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {activeVehicles} active vehicles, {alerts} alerts
      </div>
    </div>
  )
}
