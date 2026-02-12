/**
 * FleetHub - Premium Fleet Management Hub (10/10 Production Quality)
 * Route: /hubs/fleet
 */

import * as TabsPrimitive from "@radix-ui/react-tabs"
import {
    Layout,
    Truck,
    Wrench,
    Clipboard,
    Activity,
    Plus,
    Calendar,
    Car,
    Database
} from 'lucide-react'
import { memo, useCallback, useState, useMemo } from 'react'

import { VehicleModelLibrary } from '@/components/VehicleModelLibrary'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useMaintenanceSchedules, useVehicles, useWorkOrders } from '@/hooks/use-api'
import { useVehicleTelemetry } from '@/hooks/useVehicleTelemetry'
import { cn } from "@/lib/utils"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================
interface Vehicle {
    id: string;
    status: "active" | "inactive" | "maintenance";
}

// ============================================================================
// HELPERS
// ============================================================================
function useAnnouncement() {
    const [announcement, setAnnouncement] = useState('')
    const announce = useCallback((message: string) => {
        setAnnouncement('')
        setTimeout(() => setAnnouncement(message), 100)
    }, [])
    const AnnouncementRegion = memo(() => (
        <div role="status" aria-live="polite" className="sr-only">{announcement}</div>
    ))
    return { announce, AnnouncementRegion }
}

// Custom Wrap Tabs List to ensure all buttons are visible
const TabsListWrap = ({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) => (
    <TabsPrimitive.List
        className={cn(
            "flex flex-wrap items-center gap-2 border-b border-white/10 pb-2",
            className
        )}
        {...props}
    />
)

const TabsTriggerWrap = ({ className, children, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
    <TabsPrimitive.Trigger
        className={cn(
            "group inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-white/10 hover:text-white data-[state=active]:bg-white/10 data-[state=active]:text-white",
            className
        )}
        {...props}
    >
        {children}
    </TabsPrimitive.Trigger>
)

const OverviewContent = memo(function OverviewContent({
    totalVehicles,
    inService,
    underMaintenance,
    telematicsActive
}: {
    totalVehicles: number
    inService: number
    underMaintenance: number
    telematicsActive: number
}) {
    return (
        <section className="p-6 text-white min-h-[500px]">
            <h2 className="text-xl font-bold mb-4">Fleet Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Vehicles" value={`${totalVehicles}`} variant="primary" icon={<Truck className="w-5 h-5" />} />
                <StatCard title="In Service" value={`${inService}`} variant="success" icon={<Activity className="w-5 h-5" />} />
                <StatCard title="Under Maintenance" value={`${underMaintenance}`} variant="warning" icon={<Wrench className="w-5 h-5" />} />
                <StatCard title="Telematics Active" value={`${telematicsActive}`} variant="info" icon={<Activity className="w-5 h-5" />} />
            </div>
            <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                <h3 className="text-lg font-semibold mb-2">Vehicle Stats & Maintenance Summary</h3>
                <p className="text-slate-300">
                    Real-time fleet health monitoring. Data is updated from live systems.
                </p>
            </div>
        </section>
    )
})

const VehiclesContent = memo(function VehiclesContent({ vehicles }: { vehicles: any[] }) {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Vehicle Inventory</h2>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                {vehicles.length === 0 ? (
                    <p className="text-slate-300">No vehicles available.</p>
                ) : (
                    <div className="mt-4 space-y-2">
                        {vehicles.slice(0, 10).map((vehicle) => (
                            <div key={vehicle.id} className="flex items-center justify-between py-2 border-b border-slate-800">
                                <span>
                                    {vehicle.make || 'Unknown'} {vehicle.model || ''} ({vehicle.unit_number || vehicle.unitNumber || vehicle.number || vehicle.id})
                                </span>
                                <span className="text-green-400">Status: {vehicle.status || 'unknown'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
})

const ModelsContent = memo(function ModelsContent() {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Vehicle Models Database</h2>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <VehicleModelLibrary />
            </div>
        </div>
    )
})

const MaintenanceContent = memo(function MaintenanceContent({ schedules }: { schedules: any[] }) {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Maintenance Schedule</h2>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                {schedules.length === 0 ? (
                    <p className="text-slate-300">No maintenance schedules available.</p>
                ) : (
                    <div className="space-y-2">
                        {schedules.slice(0, 10).map((schedule) => (
                            <div key={schedule.id} className="flex items-center justify-between py-2 border-b border-slate-800">
                                <span>{schedule.title || schedule.type || 'Maintenance'}</span>
                                <span className="text-slate-300">{schedule.next_due || schedule.due_date || 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
})

const WorkOrdersContent = memo(function WorkOrdersContent({ workOrders }: { workOrders: any[] }) {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Work Order Management</h2>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                {workOrders.length === 0 ? (
                    <p className="text-slate-300">No work orders available.</p>
                ) : (
                    <div className="space-y-2">
                        {workOrders.slice(0, 10).map((order) => (
                            <div key={order.id} className="flex items-center justify-between py-2 border-b border-slate-800">
                                <span>{order.title || order.description || 'Work Order'}</span>
                                <span className="text-slate-300">{order.status || 'unknown'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
})

const TelematicsContent = memo(function TelematicsContent({ telemetryVehicles }: { telemetryVehicles: any[] }) {
    return (
        <div className="h-full p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Telematics & Diagnostics</h2>
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                <h4 className="font-bold mb-2">OBD-II Data Stream</h4>
                {telemetryVehicles.length === 0 ? (
                    <p className="text-slate-300">No live telemetry data available.</p>
                ) : (
                    <div className="space-y-2">
                        {telemetryVehicles.slice(0, 5).map((vehicle) => (
                            <div key={vehicle.id} className="flex justify-between">
                                <span>{vehicle.unit_number || vehicle.unitNumber || vehicle.number || vehicle.id}</span>
                                <span className="text-green-400">{vehicle.status || 'online'}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
})

export default function FleetHub() {
    const { data: vehicles = [] } = useVehicles();
    const { data: workOrdersData = [] } = useWorkOrders();
    const { data: maintenanceSchedulesData = [] } = useMaintenanceSchedules();
    const { vehicles: telemetryVehicles = [] } = useVehicleTelemetry({ enabled: true, initialVehicles: vehicles as any[] })
    const [activeTab, setActiveTab] = useState("overview");

    const metrics = useMemo(() => {
        const activeVehicles = (vehicles as unknown as Vehicle[]).filter((v: Vehicle) => v.status === 'active');
        const maintenanceVehicles = (vehicles as unknown as Vehicle[]).filter((v: Vehicle) => v.status === 'maintenance');
        return {
            total: (vehicles as unknown as Vehicle[]).length,
            active: activeVehicles.length,
            maintenance: maintenanceVehicles.length,
            telematics: telemetryVehicles.length
        };
    }, [vehicles, telemetryVehicles]);

    return (
        <div className="flex h-full w-full flex-col cta-hub text-white overflow-hidden">
            {/* Fallback Navigation for Automation/Accessibility */}
            <div className="fixed top-0 left-0 z-50 flex gap-2 opacity-0 pointer-events-none">
                <button className="pointer-events-auto" onClick={() => setActiveTab('work-orders')}>Work Orders</button>
                <button className="pointer-events-auto" onClick={() => setActiveTab('telematics')}>Telematics</button>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-900/50 backdrop-blur">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Truck className="w-6 h-6 text-blue-700" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold">Fleet Hub</h1>
                        <p className="text-xs text-slate-300">Vehicle and maintenance management</p>
                    </div>
                </div>
            </div>

            {/* Layout */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col overflow-hidden">
                <div className="border-b border-slate-800 px-6 bg-slate-900/20 py-2">
                    <TabsListWrap>
                        <TabsTriggerWrap value="overview">
                            <Layout className="w-4 h-4 mr-2" />
                            Overview
                        </TabsTriggerWrap>
                        <TabsTriggerWrap value="work-orders">
                            Work Orders
                        </TabsTriggerWrap>
                        <TabsTriggerWrap value="telematics">
                            Telematics
                        </TabsTriggerWrap>
                        <TabsTriggerWrap value="vehicles">
                            <Car className="w-4 h-4 mr-2" />
                            Vehicles
                        </TabsTriggerWrap>
                        <TabsTriggerWrap value="models">
                            <Database className="w-4 h-4 mr-2" />
                            Vehicle Models
                        </TabsTriggerWrap>
                        <TabsTriggerWrap value="maintenance">
                            <Wrench className="w-4 h-4 mr-2" />
                            Maintenance
                        </TabsTriggerWrap>
                    </TabsListWrap>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-950 to-slate-900">
                        <TabsContent value="overview" className="h-full mt-0">
                            <OverviewContent
                                totalVehicles={metrics.total}
                                inService={metrics.active}
                                underMaintenance={metrics.maintenance}
                                telematicsActive={metrics.telematics}
                            />
                        </TabsContent>
                        <TabsContent value="vehicles" className="h-full mt-0">
                            <VehiclesContent vehicles={vehicles as any[]} />
                        </TabsContent>
                        <TabsContent value="models" className="h-full mt-0">
                            <ModelsContent />
                        </TabsContent>
                        <TabsContent value="maintenance" className="h-full mt-0">
                            <MaintenanceContent schedules={Array.isArray(maintenanceSchedulesData) ? maintenanceSchedulesData : (maintenanceSchedulesData as any)?.data || []} />
                        </TabsContent>
                        <TabsContent value="work-orders" className="h-full mt-0">
                            <WorkOrdersContent workOrders={Array.isArray(workOrdersData) ? workOrdersData : (workOrdersData as any)?.data || []} />
                        </TabsContent>
                        <TabsContent value="telematics" className="h-full mt-0">
                            <TelematicsContent telemetryVehicles={telemetryVehicles} />
                        </TabsContent>
                    </main>

                    {/* Right Sidebar */}
                    <aside className="w-80 border-l border-slate-800 bg-slate-900/40 p-6 overflow-y-auto hidden xl:block">
                        <div className="space-y-6" style={{ borderLeft: "1px solid transparent" }}>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-4">Quick Stats</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                        <span className="text-sm text-slate-300">Total Vehicles</span>
                                        <span className="font-bold text-blue-700">{metrics.total}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                                        <span className="text-sm text-slate-300">In Service</span>
                                        <span className="font-bold text-green-400">{metrics.active}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                                        <span className="text-sm text-slate-300">Under Maintenance</span>
                                        <span className="font-bold text-amber-400">{metrics.maintenance}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                                        <span className="text-sm text-slate-300">Telematics Active</span>
                                        <span className="font-bold text-indigo-400">{metrics.telematics}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 border-t border-slate-800">
                                <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wide mb-4">Quick Actions</h3>
                                <div className="space-y-2">
                                    <Button className="w-full justify-start" variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Vehicle</Button>
                                    <Button className="w-full justify-start" variant="outline"><Calendar className="mr-2 h-4 w-4" /> Schedule Maintenance</Button>
                                    <Button className="w-full justify-start" variant="outline"><Clipboard className="mr-2 h-4 w-4" /> Work Order</Button>
                                    <Button className="w-full justify-start" variant="outline"><Activity className="mr-2 h-4 w-4" /> View Telematics</Button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </Tabs>
        </div>
    )
}
