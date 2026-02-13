// motion removed - React 19 incompatible
import {
    Activity,
    Clock,
    Users,
    X,
    ShieldAlert,
    History
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Geofence } from "@/lib/types"

interface GeofenceIntelligencePanelProps {
    geofence: Geofence | null;
    onClose: () => void;
    breachedVehicleIds: string[];
    vehicles: any[];
}

export function GeofenceIntelligencePanel({
    geofence,
    onClose,
    breachedVehicleIds,
    vehicles
}: GeofenceIntelligencePanelProps) {
    if (!geofence) return null;

    const breachedVehicles = vehicles.filter(v => breachedVehicleIds.includes(v.id));

    return (
        <>
            {geofence && (
                <div
                    className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-card/95 border-l border-border/50 shadow-lg overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-muted/40 border-b border-border/50 p-2 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-200 border-blue-500/30">
                                    {geofence.type}
                                </Badge>
                                {geofence.active ? (
                                    <Badge className="bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30">Active Monitoring</Badge>
                                ) : (
                                    <Badge variant="secondary" className="bg-muted/50 text-muted-foreground">Inactive</Badge>
                                )}
                            </div>
                            <h2 className="text-base font-bold text-foreground">{geofence.name}</h2>
                            <p className="text-sm text-muted-foreground">{geofence.description || "No description provided"}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-white/10" aria-label="Close geofence intelligence panel">
                            <X className="w-3 h-3 text-muted-foreground" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-2 bg-muted/20">
                        <div className="space-y-2">
                            {/* Live Status Card */}
                            <Card className="border-l-4 border-l-blue-500/60 shadow-sm relative overflow-hidden bg-card/90 border-border/50">
                                <div className="absolute top-0 right-0 p-2 opacity-5">
                                    <Activity className="w-24 h-24" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Live Occupancy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-bold text-foreground">{breachedVehicles.length}</span>
                                        <span className="text-sm text-muted-foreground">vehicles inside</span>
                                    </div>

                                    {breachedVehicles.length > 0 && (
                                        <div className="mt-2 space-y-2">
                                            {breachedVehicles.map(v => (
                                                <div key={v.id} className="flex items-center justify-between p-2 bg-card/90 rounded border border-border/50 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                        <div>
                                                            <div className="font-medium text-sm">{v.name || v.number}</div>
                                                            <div className="text-[10px] text-muted-foreground">Entered 2m ago</div>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="h-6 text-xs">View</Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Analytics Grid */}
                            <div className="grid grid-cols-2 gap-2">
                                <Card className="bg-card/90 border-border/50">
                                    <CardContent className="p-2">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs font-semibold uppercase">Avg Dwell</span>
                                        </div>
                                        <div className="text-sm font-bold">14m</div>
                                        <div className="text-xs text-green-600 font-medium">↓ 2m vs avg</div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-card/90 border-border/50">
                                    <CardContent className="p-2">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                            <ShieldAlert className="w-4 h-4" />
                                            <span className="text-xs font-semibold uppercase">Alerts (24h)</span>
                                        </div>
                                        <div className="text-sm font-bold text-amber-600">3</div>
                                        <div className="text-xs text-muted-foreground">2 entry, 1 dwell</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Alert Configuration Summary */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-muted-foreground" />
                                    Active Triggers
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {geofence.triggers.onEnter && (
                                        <div className="bg-emerald-500/15 text-emerald-100 border border-emerald-500/30 px-3 py-2 rounded text-xs font-medium text-center">
                                            Entry
                                        </div>
                                    )}
                                    {geofence.triggers.onExit && (
                                        <div className="bg-blue-500/15 text-blue-100 border border-blue-500/30 px-3 py-2 rounded text-xs font-medium text-center">
                                            Exit
                                        </div>
                                    )}
                                    {geofence.triggers.onDwell && (
                                        <div className="bg-amber-500/15 text-amber-100 border border-amber-500/30 px-3 py-2 rounded text-xs font-medium text-center">
                                            Dwell
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* History Timeline */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <History className="w-4 h-4 text-muted-foreground" />
                                    Recent Activity
                                </h3>
                                <div className="relative pl-2 border-l border-border/50 space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-muted-foreground/40 border-2 border-card" />
                                            <div className="text-xs text-muted-foreground mb-0.5">Today, {10 + i}:30 AM</div>
                                            <div className="text-sm font-medium text-foreground">Vehicle {100 + i} Entered Area</div>
                                            <div className="text-xs text-muted-foreground">Duration: 45m • Driver: John Doe</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Footer Actions */}
                    <div className="p-2 border-t border-border/50 bg-card/95 flex gap-2">
                        <Button className="flex-1" variant="outline">Edit Rules</Button>
                        <Button className="flex-1" variant="destructive">Deactivate</Button>
                    </div>
                </div>
            )}
        </>
    )
}
