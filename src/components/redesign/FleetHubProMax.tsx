/**
 * Fleet Hub - Redesigned using UI/UX Pro Max Design System
 *
 * Design Approach:
 * - Style: Glassmorphism + Bento Box Grid
 * - Color: Professional Tech (Emerald-Gray palette)
 * - Typography: Inter + Manrope (Professional Modern)
 * - Effects: Soft shadows, smooth transitions (250ms)
 * - Accessibility: WCAG AA compliant, reduced motion support
 */

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
import { useState, useEffect } from 'react'
// motion removed - React 19 incompatible

interface FleetMetric {
  label: string
  value: string | number
  change: number
  trend: 'up' | 'down'
  icon: any
  color: string
}

export function FleetHubProMax() {
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
      color: 'from-emerald-500/50 to-emerald-500'
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
      color: 'from-amber-500 to-amber-500'
    }
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      {/* Header with Glassmorphism */}
      <header
        className="mb-8 bg-[#0e0e0e] rounded-3xl p-6 border border-white/[0.04]"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">
              Fleet Command Center
            </h1>
            <p className="text-white/50 mt-2 font-medium">
              Real-time monitoring and predictive insights
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-semibold text-emerald-400">Live</span>
            </div>
            <button
              className="px-5 py-2.5 rounded-full bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-all duration-250 cursor-pointer"
              aria-label="View detailed analytics"
            >
              Analytics
            </button>
          </div>
        </div>
      </header>

      {/* Bento Box Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Key Metrics - Top Row */}
        {metrics.map((metric, index) => (
          <div
            key={metric.label}
            className="col-span-12 md:col-span-6 lg:col-span-3"
          >
            <div className="group relative bg-[#111111] rounded-2xl p-6 border border-white/[0.04] hover:bg-[#161616] transition-all duration-250 cursor-pointer overflow-hidden">

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/[0.06]">
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

                <h3 className="text-3xl font-bold text-white mb-1">
                  {metric.value}
                </h3>
                <p className="text-sm text-white/50 font-medium">
                  {metric.label}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* Live Fleet Map - Large Bento Box */}
        <div
          className="col-span-12 lg:col-span-8"
        >
          <div className="bg-[#0e0e0e] rounded-3xl p-6 border border-white/[0.04] h-[500px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/[0.06]">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Live Fleet Tracking</h2>
                  <p className="text-sm text-white/50">142 vehicles in service area</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-white/70 font-medium transition-colors duration-200 cursor-pointer">
                  3D View
                </button>
                <button className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-all duration-200 cursor-pointer">
                  Fullscreen
                </button>
              </div>
            </div>

            {/* Map Placeholder with Glassmorphic Overlays */}
            <div className="relative h-[400px] rounded-2xl bg-[#111111] overflow-hidden">
              {/* Simulated map with vehicle markers */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Activity className="w-16 h-16 text-white/50 mx-auto mb-3 animate-pulse" />
                  <p className="text-white/50 font-medium">Interactive Fleet Map</p>
                  <p className="text-sm text-white/40">Real-time GPS tracking visualization</p>
                </div>
              </div>

              {/* Floating Status Cards */}
              <div className="absolute top-4 left-4 bg-[#1a1a1a] rounded-xl p-3 border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-white/60">Online: 142</span>
                </div>
              </div>

              <div className="absolute top-4 right-4 bg-[#1a1a1a] rounded-xl p-3 border border-white/[0.04]">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm font-semibold text-white/60">Alerts: {alerts || 3}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed - Right Column */}
        <div
          className="col-span-12 lg:col-span-4"
        >
          <div className="bg-[#0e0e0e] rounded-3xl p-6 border border-white/[0.04] h-[500px] flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-white/[0.06]">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Live Activity</h2>
            </div>

            <div className="flex-1 overflow-auto space-y-3">
              {[
                { type: 'success', icon: CheckCircle2, text: 'Vehicle FL-2847 completed delivery', time: '2m ago', color: 'emerald' },
                { type: 'warning', icon: AlertTriangle, text: 'Low fuel alert: FL-1923', time: '5m ago', color: 'amber' },
                { type: 'info', icon: Truck, text: 'FL-3156 departed warehouse', time: '8m ago', color: 'emerald' },
                { type: 'success', icon: Shield, text: 'Safety inspection passed: FL-2001', time: '12m ago', color: 'emerald' },
                { type: 'info', icon: Calendar, text: 'Maintenance scheduled: 3 vehicles', time: '15m ago', color: 'amber' }
              ].map((activity) => (
                <div
                  key={activity.text}
                  className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.05] transition-colors duration-200 cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-white/[0.06] text-white/60 group-hover:scale-110 transition-transform duration-200">
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-tight">
                      {activity.text}
                    </p>
                    <p className="text-xs text-white/40 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Analytics - Bottom Row */}
        <div
          className="col-span-12 lg:col-span-6"
        >
          <div className="bg-[#0e0e0e] rounded-3xl p-6 border border-white/[0.04]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-white/[0.06]">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Performance Trends</h2>
                <p className="text-sm text-white/50">Last 30 days</p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-48 rounded-xl bg-[#111111] flex items-center justify-center">
              <p className="text-white/40 font-medium">Interactive Performance Chart</p>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                <p className="text-2xl font-bold text-white">+12.5%</p>
                <p className="text-xs text-white/35 mt-1">Efficiency</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                <p className="text-2xl font-bold text-white">-8.3%</p>
                <p className="text-xs text-white/35 mt-1">Fuel Cost</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-white/[0.03]">
                <p className="text-2xl font-bold text-white">98.2%</p>
                <p className="text-xs text-white/35 mt-1">Uptime</p>
              </div>
            </div>
          </div>
        </div>

        {/* Driver Performance */}
        <div
          className="col-span-12 lg:col-span-6"
        >
          <div className="bg-[#0e0e0e] rounded-3xl p-6 border border-white/[0.04]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-white/[0.06]">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Top Drivers</h2>
                <p className="text-sm text-white/50">By safety score</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Sarah Johnson', score: 98.5, deliveries: 127, badge: '🏆' },
                { name: 'Mike Chen', score: 96.8, deliveries: 115, badge: '🥈' },
                { name: 'Alex Rivera', score: 95.2, deliveries: 103, badge: '🥉' }
              ].map((driver) => (
                <div
                  key={driver.name}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center text-white/60 font-bold border border-white/[0.04]">
                      {driver.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{driver.name}</p>
                      <p className="text-xs text-white/50">{driver.deliveries} deliveries</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">{driver.score}</p>
                    <p className="text-xs text-white/50">Safety Score</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility: Hidden screen reader announcement for live updates */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {activeVehicles} active vehicles, {alerts} alerts
      </div>
    </div>
  )
}
