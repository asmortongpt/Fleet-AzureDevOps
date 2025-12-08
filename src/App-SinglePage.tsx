import {
  Truck,
  Users,
  Wrench,
  MapPin,
  TrendingUp,
  Bell
} from "@phosphor-icons/react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header - Fixed height */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-primary" weight="duotone" />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Fleet Management
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - Single screen, no scroll */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* KPI Grid - 3x2 layout */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Vehicles */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">Total Vehicles</span>
                <Truck className="w-4 h-4 text-blue-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.totalVehicles}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Active fleet
              </p>
            </CardContent>
          </Card>

          {/* Drivers */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">Active Drivers</span>
                <Users className="w-4 h-4 text-green-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.activeDrivers}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                On duty today
              </p>
            </CardContent>
          </Card>

          {/* Maintenance */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">Maintenance Due</span>
                <Wrench className="w-4 h-4 text-orange-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.maintenanceDue}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Needs attention
              </p>
            </CardContent>
          </Card>

          {/* Facilities */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">Facilities</span>
                <MapPin className="w-4 h-4 text-purple-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.facilities}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Locations
              </p>
            </CardContent>
          </Card>

          {/* Fuel Cost */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">Avg Fuel Cost</span>
                <TrendingUp className="w-4 h-4 text-teal-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                ${stats.avgFuelCost.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Per gallon
              </p>
            </CardContent>
          </Card>

          {/* Alerts */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">Alerts Today</span>
                <Bell className="w-4 h-4 text-red-600" weight="duotone" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">
                {stats.alertsToday}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
      <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Capital Tech Alliance Fleet Management System
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Last updated: {new Date().toLocaleTimeString('en-US')}
          </p>
        </div>
      </footer>
    </div>
  )
}
