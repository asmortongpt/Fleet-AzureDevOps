// motion removed - React 19 incompatible
import {
    X,
    Phone,
    Mail,
    MapPin,
    Truck,
    FileCheck,
    Activity
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Driver, Vehicle } from "@/lib/types"

interface DriverDetailPanelProps {
    driver: Driver | null
    onClose: () => void
    vehicles?: Vehicle[]
}

export function DriverDetailPanel({ driver, onClose, vehicles = [] }: DriverDetailPanelProps) {
    if (!driver) return null

    const assignment = vehicles.find(v => v.id === driver.assignedVehicle)
    const recentActivity = [
        { id: 1, type: 'trip', title: 'Route #402 Completed', time: '2 hours ago', score: 98 },
        { id: 2, type: 'alert', title: 'Hard Braking Event', time: '5 hours ago', score: -5 },
        { id: 3, type: 'system', title: 'Shift Started', time: '8 hours ago', score: null },
    ]

    return (
            <div
                className="absolute right-4 top-20 bottom-8 w-[400px] bg-card/95 backdrop-blur-md border border-border/50 shadow-lg rounded-lg overflow-hidden flex flex-col z-40"
            >
                {/* Header / Profile Cover */}
                <div className="relative h-32 bg-gradient-to-br from-slate-900 to-slate-800 shrink-0">
                    <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-2 top-2 text-white/70 hover:text-white hover:bg-white/10" aria-label="Close driver details">
                        <X className="w-3 h-3" />
                    </Button>
                    <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 rounded-full border-4 border-border/40 bg-muted/40 shadow-md flex items-center justify-center text-sm font-bold text-muted-foreground">
                            {driver.name.charAt(0)}
                        </div>
                    </div>
                    <div className="absolute bottom-3 right-4 flex gap-2">
                        <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm">
                            <Phone className="w-3 h-3 mr-1.5" />
                            Call
                        </Button>
                        <Button size="sm" variant="secondary" className="h-7 text-xs bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm">
                            <Mail className="w-3 h-3 mr-1.5" />
                            Email
                        </Button>
                    </div>
                </div>

                {/* Body */}
                <div className="pt-12 px-3 pb-3 flex-1 flex flex-col overflow-hidden">

                    {/* Identity */}
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">{driver.name}</h2>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
                            <Badge variant="outline" className="rounded-md font-normal">
                                {driver.id}
                            </Badge>
                            <span>•</span>
                            <span>{driver.department || 'Unassigned Dept'}</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-3 mb-3">
                        <div className="bg-muted/40 p-3 rounded-md border border-border/50 text-center">
                            <div className={`text-base font-bold ${driver.safetyScore >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                                {driver.safetyScore}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Safety</div>
                        </div>
                        <div className="bg-muted/40 p-3 rounded-md border border-border/50 text-center">
                            <div className="text-base font-bold text-muted-foreground">
                                4.9
                            </div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">Rating</div>
                        </div>
                        <div className="bg-muted/40 p-3 rounded-md border border-border/50 text-center">
                            <div className="text-base font-bold text-blue-800">
                                98%
                            </div>
                            <div className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">On-Time</div>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="w-full justify-start h-8 p-1 bg-muted/40 mb-2">
                            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
                            <TabsTrigger value="vehicle" className="text-xs">Vehicle</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1 -mx-3 px-3">
                            <TabsContent value="overview" className="space-y-2 mt-0">

                                {/* Status */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Status</h4>
                                    <div className="flex items-center justify-between p-3 bg-card/90 border border-border/50 rounded-md shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Activity className="w-3 h-3 text-blue-800" />
                                            <div>
                                                <div className="font-semibold text-sm capitalize">{driver.status}</div>
                                                <div className="text-xs text-muted-foreground">Since 08:00 AM</div>
                                            </div>
                                        </div>
                                        <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                                            {driver.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* assigned Vehicle */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Vehicle</h4>
                                    {assignment ? (
                                        <div className="p-3 bg-card/90 border border-border/50 rounded-md shadow-sm hover:border-blue-500/50 transition-colors cursor-pointer group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-8 bg-muted/40 rounded-lg flex items-center justify-center">
                                                        <Truck className="w-3 h-3 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm group-hover:text-blue-200 transition-colors">
                                                            {assignment.make} {assignment.model}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-0.5">
                                                            {assignment.number}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {assignment.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                                                <MapPin className="w-3.5 h-3.5" />
                                                Loading Dock B, Warehouse 4
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center p-3 border-2 border-dashed border-border/50 rounded-md">
                                            <p className="text-sm text-muted-foreground mb-2">No vehicle currently assigned</p>
                                            <Button variant="outline" size="sm">Assign Vehicle</Button>
                                        </div>
                                    )}
                                </div>

                                {/* Licenses */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Compliance</h4>
                                    <div className="p-3 bg-muted/40 rounded-lg border border-border/50 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <FileCheck className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Commercial License</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Exp: {driver.licenseExpiry}</span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="activity" className="mt-0">
                                <div className="space-y-2">
                                    {recentActivity.map((item) => (
                                        <div key={item.id} className="relative pl-3 pb-3 border-l border-border/50 last:pb-0">
                                            <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-card ${item.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                                                }`} />
                                            <div className="flex justify-between items-start -mt-1">
                                                <div>
                                                    <div className="text-sm font-semibold">{item.title}</div>
                                                    <div className="text-xs text-muted-foreground mt-0.5">{item.time}</div>
                                                </div>
                                                {item.score && (
                                                    <Badge variant={item.score > 0 ? 'secondary' : 'destructive'} className="text-[10px]">
                                                        {item.score > 0 ? '+' : ''}{item.score} pts
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="vehicle" className="mt-0 p-1">
                                {assignment ? (
                                    <div className="space-y-2">
                                        <div className="bg-muted/40 p-2 rounded-md border border-border/50 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                                <Truck className="w-4 h-4 text-blue-800" />
                                            </div>
                                            <h3 className="font-bold text-sm">{assignment.make} {assignment.model}</h3>
                                            <div className="text-sm text-muted-foreground">{assignment.number}</div>
                                            <Badge className="mt-2" variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                                                {assignment.status}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                                <div className="text-xs text-muted-foreground uppercase font-semibold">Fuel Level</div>
                                                <div className="text-sm font-bold text-foreground">{assignment.fuelLevel || '76'}%</div>
                                            </div>
                                            <div className="p-3 bg-muted/40 rounded-lg border border-border/50">
                                                <div className="text-xs text-muted-foreground uppercase font-semibold">Odometer</div>
                                                <div className="text-sm font-bold text-foreground">{(assignment.mileage || 0).toLocaleString()} mi</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <p>No vehicle assigned.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>
            </div>
    )
}
