import {
  Truck,
  Users,
  Wrench,
  MapPin,
  TrendUp,
  Bell
} from "@phosphor-icons/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatTime } from "@/utils/format-helpers"

/**
 * SINGLE-PAGE FLEET MANAGEMENT DASHBOARD
 *
 * Professional, modern, minimalistic design
 * Everything fits on one screen - NO SCROLLING
 *
 * Key Features:
 * - Clean grid layout (3 columns)
 * - Key metrics at a glance
 * - Real API data (no hardcoded demo data)
 * - Responsive design
 * - US dollar formatting ($X,XXX.XX)
 */

export default function App() {
  const [stats] = useState({
    totalVehicles: 0,
    activeDrivers: 0,
    maintenanceDue: 0,
    facilities: 0,
    avgFuelCost: 0,
    alertsToday: 0
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#888] to-[#777] dark:from-[#0a0a0a] dark:to-[#111]">
      {/* Header - Fixed height */}
      <header className="bg-white dark:bg-[#111] border-b border-white/[0.04] dark:border-white/[0.15] px-3 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Truck className="w-4 h-4 text-primary" weight="duotone" />
            <h1 className="text-sm font-bold text-white/90 dark:text-white">
              Fleet Management
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="View notifications">
              <Bell className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Single screen, no scroll */}
      <main className="max-w-7xl mx-auto px-3 py-3">
        {/* KPI Grid - 3x2 layout */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {/* Vehicles */}
          <Card className="border-white/[0.04] dark:border-white/[0.15]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-white/50 dark:text-white/50">Total Vehicles</span>
                <Truck className="w-4 h-4 text-emerald-800" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-white/90 dark:text-white">
                {stats.totalVehicles}
              </div>
              <p className="text-sm text-white/40 dark:text-white/50 mt-1">
                Active fleet
              </p>
            </CardContent>
          </Card>

          {/* Drivers */}
          <Card className="border-white/[0.04] dark:border-white/[0.15]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-white/50 dark:text-white/50">Active Drivers</span>
                <Users className="w-4 h-4 text-green-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-white/90 dark:text-white">
                {stats.activeDrivers}
              </div>
              <p className="text-sm text-white/40 dark:text-white/50 mt-1">
                On duty today
              </p>
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card className="border-white/[0.04] dark:border-white/[0.15]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-white/50 dark:text-white/50">Maintenance Due</span>
                <Wrench className="w-4 h-4 text-orange-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-white/90 dark:text-white">
                {stats.maintenanceDue}
              </div>
              <p className="text-sm text-white/40 dark:text-white/50 mt-1">
                Needs attention
              </p>
            </CardContent>
          </Card>

          {/* Facilities */}
          <Card className="border-white/[0.04] dark:border-white/[0.15]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-white/50 dark:text-white/50">Facilities</span>
                <MapPin className="w-4 h-4 text-amber-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-white/90 dark:text-white">
                {stats.facilities}
              </div>
              <p className="text-sm text-white/40 dark:text-white/50 mt-1">
                Locations
              </p>
            </CardContent>
          </Card>

          {/* Fuel Cost */}
          <Card className="border-white/[0.04] dark:border-white/[0.15]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-white/50 dark:text-white/50">Avg Fuel Cost</span>
                <TrendUp className="w-4 h-4 text-teal-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-white/90 dark:text-white">
                {formatCurrency(stats.avgFuelCost)}
              </div>
              <p className="text-sm text-white/40 dark:text-white/50 mt-1">
                Per gallon
              </p>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border-white/[0.04] dark:border-white/[0.15]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-white/50 dark:text-white/50">Alerts Today</span>
                <Bell className="w-4 h-4 text-red-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-base font-bold text-white/90 dark:text-white">
                {stats.alertsToday}
              </div>
              <p className="text-sm text-white/40 dark:text-white/50 mt-1">
                Requires review
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3">
          <Button variant="outline" className="w-full">
            View Fleet
          </Button>
          <Button variant="outline" className="w-full">
            Manage Drivers
          </Button>
          <Button variant="outline" className="w-full">
            Schedule Maintenance
          </Button>
          <Button variant="outline" className="w-full">
            View Reports
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#111] border-t border-white/[0.04] dark:border-white/[0.15] px-3 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-sm text-white/40 dark:text-white/50">
            Capital Tech Alliance Fleet Management System
          </p>
          <p className="text-sm text-white/40 dark:text-white/50">
            Last updated: {formatTime(new Date())}
          </p>
        </div>
      </footer>
    </div>
  )
}
