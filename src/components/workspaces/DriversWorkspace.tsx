
import {
    Users,
    Map as MapIcon,
    LayoutGrid,
    Search,
    User as UserIcon,
    Phone,
    Calendar,
    Award,
    TrendingUp
} from "lucide-react"
import { useState, useMemo } from "react"

import { ProfessionalFleetMap } from "@/components/Maps/ProfessionalFleetMap"
import { DriverCard } from "@/components/drivers/DriverCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFleetData } from "@/hooks/use-fleet-data"
import { Vehicle } from "@/lib/types"

export function DriversWorkspace() {
    const { drivers = [], vehicles = [] } = useFleetData()
    const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filteredDrivers = useMemo(() => {
        return drivers.filter(driver => {
            const matchesSearch = driver.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                driver.id.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === 'all' || driver.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [drivers, searchQuery, statusFilter])

    const selectedDriver = useMemo(() =>
        drivers.find(d => d.id === selectedDriverId),
        [drivers, selectedDriverId]
    )

    const selectedDriverVehicle = useMemo(() => {
        if (!selectedDriver?.assignedVehicle) return null
        // Assuming vehicle ID matches or we find by name/license. 
        // In a real app, we'd have a direct link ID.
        // For this mock, we'll try to find a vehicle that looks assigned.
        return vehicles.find(v => v.id === selectedDriver.assignedVehicle || v.name === selectedDriver.assignedVehicle)
    }, [selectedDriver, vehicles])

    // Map drivers to vehicles for the map
    const mapVehicles = useMemo(() => {
        return drivers.map(d => {
            // Find the vehicle this driver is assigned to, or create a mock position if they have a location string
            // This is a bit of a hack for the visual transition, usually you'd plot vehicles.
            // Here we want to see WHERE the drivers are.
            // If the driver is assigned to a vehicle, we use that vehicle's position.
            const vehicle = vehicles.find(v => v.id === d.assignedVehicle)
            if (vehicle) return { ...vehicle, driver: d.name } // Enrich with driver name
            return null
        }).filter(Boolean) as Vehicle[]
    }, [drivers, vehicles])

    return (
        <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b px-4 py-2 bg-background/95 backdrop-blur z-10">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-6 gap-1">
                        <Users className="h-3 w-3" />
                        <span className="font-medium">Drivers Workspace</span>
                    </Badge>
                    <span className="text-muted-foreground text-sm">
                        {filteredDrivers.length} active
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'map' | 'list')}>
                        <TabsList className="h-8">
                            <TabsTrigger value="map" className="text-xs px-2 h-6"><MapIcon className="w-3 h-3 mr-1" /> Map</TabsTrigger>
                            <TabsTrigger value="list" className="text-xs px-2 h-6"><LayoutGrid className="w-3 h-3 mr-1" /> Grid</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Main Content (Map or Grid) */}
                <div className="flex-1 relative">
                    {viewMode === 'map' ? (
                        <div className="absolute inset-0">
                            <ProfessionalFleetMap
                                vehicles={mapVehicles}
                                onVehicleSelect={(vid) => {
                                    // Try to find driver by vehicle ID
                                    const driver = drivers.find(d => d.assignedVehicle === vid)
                                    if (driver) setSelectedDriverId(driver.id)
                                }}
                                forceSimulatedView={false} // Use the robust fallback we built!
                            />
                            {/* Overlay Driver List for Map View */}
                            <div className="absolute top-4 left-4 w-80 flex flex-col gap-2 pointer-events-none">
                                <div className="pointer-events-auto">
                                    <Card className="shadow-lg border-none bg-background/90 backdrop-blur-sm">
                                        <div className="p-2 gap-2 flex flex-col">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Find driver..."
                                                    className="pl-8 h-9"
                                                    value={searchQuery}
                                                    onChange={e => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
                                                <Badge
                                                    variant={statusFilter === 'all' ? 'default' : 'outline'}
                                                    className="cursor-pointer whitespace-nowrap"
                                                    onClick={() => setStatusFilter('all')}
                                                >
                                                    All
                                                </Badge>
                                                <Badge
                                                    variant={statusFilter === 'active' ? 'default' : 'outline'}
                                                    className="cursor-pointer whitespace-nowrap bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200"
                                                    onClick={() => setStatusFilter('active')}
                                                >
                                                    Active
                                                </Badge>
                                                <Badge
                                                    variant={statusFilter === 'on_break' ? 'default' : 'outline'}
                                                    className="cursor-pointer whitespace-nowrap bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200"
                                                    onClick={() => setStatusFilter('on_break')}
                                                >
                                                    On Break
                                                </Badge>
                                            </div>
                                        </div>
                                    </Card>
                                </div>

                                <ScrollArea className="h-[60vh] pointer-events-auto pr-2">
                                    <div className="space-y-2">
                                        {filteredDrivers.map(driver => (
                                            <DriverCard
                                                key={driver.id}
                                                driver={{
                                                  id: driver.id,
                                                  name: driver.name,
                                                  status: (driver.status === 'off-duty' ? 'off_duty' : driver.status === 'on-leave' ? 'inactive' : driver.status) as 'active' | 'inactive' | 'on_break' | 'off_duty',
                                                  performance: driver.performance,
                                                  contact: driver.phone,
                                                }}
                                                compact
                                                onClick={() => setSelectedDriverId(driver.id)}
                                            />
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredDrivers.map(driver => (
                                    <DriverCard
                                        key={driver.id}
                                        driver={{
                                          id: driver.id,
                                          name: driver.name,
                                          status: (driver.status === 'off-duty' ? 'off_duty' : driver.status === 'on-leave' ? 'inactive' : driver.status) as 'active' | 'inactive' | 'on_break' | 'off_duty',
                                          performance: driver.performance,
                                          contact: driver.phone,
                                        }}
                                        onClick={() => setSelectedDriverId(driver.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel - Driver Details */}
                {selectedDriver && (
                    <div className="w-[400px] border-l bg-background flex flex-col h-full shadow-2xl z-20 transition-all">
                        <div className="p-4 border-b flex items-start justify-between bg-muted/20">
                            <div className="flex gap-4">
                                <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl font-bold">
                                    {selectedDriver.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold">{selectedDriver.name}</h2>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Badge variant="outline" className="uppercase text-[10px]">{selectedDriver.licenseType}</Badge>
                                        <span>• {selectedDriver.department}</span>
                                    </div>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDriverId(null)}>×</Button>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-6">
                                {/* Status Section */}
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Status</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between mb-4">
                                            <Badge className={`px-3 py-1 ${selectedDriver.status === 'active' ? 'bg-green-500' :
                                                selectedDriver.status === 'on_break' ? 'bg-yellow-500' : 'bg-gray-500'
                                                }`}>
                                                {selectedDriver.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">Since 08:30 AM</span>
                                        </div>

                                        {selectedDriver.location && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapIcon className="w-4 h-4 text-muted-foreground" />
                                                <span>{selectedDriver.location.address || 'No address'}</span>
                                            </div>
                                        )}

                                        {selectedDriverVehicle && (
                                            <div className="mt-4 pt-4 border-t">
                                                <div className="text-xs text-muted-foreground mb-2">ASSIGNED ASSET</div>
                                                <div className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg">
                                                    <div className="p-2 bg-background rounded-md border shadow-sm">
                                                        <Users className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{selectedDriver.assignedVehicle}</div>
                                                        <div className="text-xs text-muted-foreground">International LT625</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Performance Section */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="flex justify-center mb-2">
                                                <Award className="w-8 h-8 text-yellow-500" />
                                            </div>
                                            <div className="text-2xl font-bold">{selectedDriver.performance?.safetyScore}</div>
                                            <div className="text-xs text-muted-foreground">Safety Score</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-4 text-center">
                                            <div className="flex justify-center mb-2">
                                                <TrendingUp className="w-8 h-8 text-green-500" />
                                            </div>
                                            <div className="text-2xl font-bold">{selectedDriver.performance?.onTimeRate}%</div>
                                            <div className="text-xs text-muted-foreground">On-Time Rate</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <div className="space-y-2">
                                    <Button className="w-full">
                                        <UserIcon className="w-4 h-4 mr-2" /> View Full Profile
                                    </Button>
                                    <Button variant="outline" className="w-full">
                                        <Phone className="w-4 h-4 mr-2" /> Contact Driver
                                    </Button>
                                    <Button variant="outline" className="w-full">
                                        <Calendar className="w-4 h-4 mr-2" /> View Schedule
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>
    )
}
