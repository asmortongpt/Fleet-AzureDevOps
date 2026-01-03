import { motion, AnimatePresence } from "framer-motion"
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
        <AnimatePresence>
            <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute right-4 top-20 bottom-8 w-[400px] bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl overflow-hidden flex flex-col z-40"
            >
                {/* Header / Profile Cover */}
                <div className="relative h-32 bg-gradient-to-br from-slate-900 to-slate-800 shrink-0">
                    <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-2 top-2 text-white/50 hover:text-white hover:bg-white/10" aria-label="Close driver details">
                        <X className="w-5 h-5" />
                    </Button>
                    <div className="absolute -bottom-10 left-6">
                        <div className="w-20 h-20 rounded-full border-4 border-white bg-slate-200 shadow-md flex items-center justify-center text-2xl font-bold text-slate-600">
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
                <div className="pt-12 px-6 pb-6 flex-1 flex flex-col overflow-hidden">

                    {/* Identity */}
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">{driver.name}</h2>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                            <Badge variant="outline" className="rounded-md font-normal">
                                {driver.id}
                            </Badge>
                            <span>•</span>
                            <span>{driver.department || 'Unassigned Dept'}</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 mt-6 mb-6">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className={`text-xl font-bold ${driver.safetyScore >= 90 ? 'text-green-600' : 'text-amber-600'}`}>
                                {driver.safetyScore}
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Safety</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-xl font-bold text-slate-700">
                                4.9
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">Rating</div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                            <div className="text-xl font-bold text-blue-600">
                                98%
                            </div>
                            <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">On-Time</div>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="w-full justify-start h-10 p-1 bg-slate-100/80 mb-4">
                            <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
                            <TabsTrigger value="activity" className="text-xs">Activity</TabsTrigger>
                            <TabsTrigger value="vehicle" className="text-xs">Vehicle</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1 -mx-6 px-6">
                            <TabsContent value="overview" className="space-y-6 mt-0">

                                {/* Status */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Status</h4>
                                    <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <Activity className="w-5 h-5 text-blue-500" />
                                            <div>
                                                <div className="font-semibold text-sm capitalize">{driver.status}</div>
                                                <div className="text-xs text-slate-500">Since 08:00 AM</div>
                                            </div>
                                        </div>
                                        <Badge variant={driver.status === 'active' ? 'default' : 'secondary'}>
                                            {driver.status}
                                        </Badge>
                                    </div>
                                </div>

                                {/* assigned Vehicle */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Vehicle</h4>
                                    {assignment ? (
                                        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-colors cursor-pointer group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-3">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                                                        <Truck className="w-5 h-5 text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-sm group-hover:text-blue-600 transition-colors">
                                                            {assignment.make} {assignment.model}
                                                        </div>
                                                        <div className="text-xs text-slate-500 mt-0.5">
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
                                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                                <MapPin className="w-3.5 h-3.5" />
                                                Loading Dock B, Warehouse 4
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
                                            <p className="text-sm text-slate-500 mb-2">No vehicle currently assigned</p>
                                            <Button variant="outline" size="sm">Assign Vehicle</Button>
                                        </div>
                                    )}
                                </div>

                                {/* Licenses */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliance</h4>
                                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <FileCheck className="w-4 h-4 text-slate-500" />
                                            <span className="text-sm font-medium">Commercial License</span>
                                        </div>
                                        <span className="text-xs text-slate-500">Exp: {driver.licenseExpiry}</span>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="activity" className="mt-0">
                                <div className="space-y-4">
                                    {recentActivity.map((item) => (
                                        <div key={item.id} className="relative pl-6 pb-6 border-l border-slate-200 last:pb-0">
                                            <div className={`absolute -left-1.5 top-0 w-3 h-3 rounded-full border-2 border-white ${item.type === 'alert' ? 'bg-red-500' : 'bg-blue-500'
                                                }`} />
                                            <div className="flex justify-between items-start -mt-1">
                                                <div>
                                                    <div className="text-sm font-semibold">{item.title}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5">{item.time}</div>
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
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col items-center">
                                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                                <Truck className="w-8 h-8 text-blue-600" />
                                            </div>
                                            <h3 className="font-bold text-lg">{assignment.make} {assignment.model}</h3>
                                            <div className="text-sm text-slate-500">{assignment.number}</div>
                                            <Badge className="mt-2" variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                                                {assignment.status}
                                            </Badge>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="text-xs text-slate-500 uppercase font-semibold">Fuel Level</div>
                                                <div className="text-lg font-bold text-slate-900">{assignment.fuelLevel || '76'}%</div>
                                            </div>
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="text-xs text-slate-500 uppercase font-semibold">Odometer</div>
                                                <div className="text-lg font-bold text-slate-900">{(assignment.mileage || 0).toLocaleString()} mi</div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-400">
                                        <p>No vehicle assigned.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
