import { motion, AnimatePresence } from "framer-motion"
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
        <AnimatePresence>
            {geofence && (
                <motion.div
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white border-l shadow-2xl overflow-hidden flex flex-col"
                >
                    {/* Header */}
                    <div className="bg-slate-50 border-b p-4 flex items-start justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {geofence.type}
                                </Badge>
                                {geofence.active ? (
                                    <Badge className="bg-green-500 hover:bg-green-600">Active Monitoring</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{geofence.name}</h2>
                            <p className="text-sm text-slate-500">{geofence.description || "No description provided"}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-slate-200">
                            <X className="w-5 h-5 text-slate-500" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-4 bg-slate-50/50">
                        <div className="space-y-6">
                            {/* Live Status Card */}
                            <Card className="border-l-4 border-l-blue-500 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5">
                                    <Activity className="w-24 h-24" />
                                </div>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Users className="w-4 h-4" /> Live Occupancy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-slate-900">{breachedVehicles.length}</span>
                                        <span className="text-sm text-slate-500">vehicles inside</span>
                                    </div>

                                    {breachedVehicles.length > 0 && (
                                        <div className="mt-4 space-y-2">
                                            {breachedVehicles.map(v => (
                                                <div key={v.id} className="flex items-center justify-between p-2 bg-white rounded border border-slate-100 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                        <div>
                                                            <div className="font-medium text-sm">{v.name || v.number}</div>
                                                            <div className="text-[10px] text-slate-400">Entered 2m ago</div>
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
                            <div className="grid grid-cols-2 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-xs font-semibold uppercase">Avg Dwell</span>
                                        </div>
                                        <div className="text-2xl font-bold">14m</div>
                                        <div className="text-xs text-green-600 font-medium">↓ 2m vs avg</div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                                            <ShieldAlert className="w-4 h-4" />
                                            <span className="text-xs font-semibold uppercase">Alerts (24h)</span>
                                        </div>
                                        <div className="text-2xl font-bold text-amber-600">3</div>
                                        <div className="text-xs text-slate-400">2 entry, 1 dwell</div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Alert Configuration Summary */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4 text-slate-500" />
                                    Active Triggers
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {geofence.triggers.onEnter && (
                                        <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-3 py-2 rounded text-xs font-medium text-center">
                                            Entry
                                        </div>
                                    )}
                                    {geofence.triggers.onExit && (
                                        <div className="bg-blue-50 text-blue-700 border border-blue-100 px-3 py-2 rounded text-xs font-medium text-center">
                                            Exit
                                        </div>
                                    )}
                                    {geofence.triggers.onDwell && (
                                        <div className="bg-amber-50 text-amber-700 border border-amber-100 px-3 py-2 rounded text-xs font-medium text-center">
                                            Dwell
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* History Timeline */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                    <History className="w-4 h-4 text-slate-500" />
                                    Recent Activity
                                </h3>
                                <div className="relative pl-4 border-l border-slate-200 space-y-6">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 border-2 border-white" />
                                            <div className="text-xs text-slate-500 mb-0.5">Today, {10 + i}:30 AM</div>
                                            <div className="text-sm font-medium text-slate-800">Vehicle {100 + i} Entered Area</div>
                                            <div className="text-xs text-slate-500">Duration: 45m • Driver: John Doe</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>

                    {/* Footer Actions */}
                    <div className="p-4 border-t bg-white flex gap-2">
                        <Button className="flex-1" variant="outline">Edit Rules</Button>
                        <Button className="flex-1" variant="destructive">Deactivate</Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
