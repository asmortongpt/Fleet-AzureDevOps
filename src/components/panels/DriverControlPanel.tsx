// motion removed - React 19 incompatible
import {
    Users,
    Search,
    Plus,
    MoreVertical,
    Shield,
    Trophy,
    AlertTriangle,
    X
} from "lucide-react"
import { useState, useMemo } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Driver } from "@/lib/types"
import { useDriverMutations } from "@/hooks/use-api"

interface DriverControlPanelProps {
    isVisible: boolean
    drivers: Driver[]
    onDriverSelect: (driver: Driver) => void
    onClose: () => void
    onDriversChange?: (drivers: Driver[]) => void
}

export function DriverControlPanel({
    isVisible,
    drivers = [],
    onDriverSelect,
    onClose,
    onDriversChange
}: DriverControlPanelProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const { createDriver } = useDriverMutations()

    // -- Derived Stats --
    const stats = useMemo(() => {
        const total = drivers.length
        const active = drivers.filter(d => d.status === 'active').length
        const actionRequired = drivers.filter(d => d.status === 'suspended' || d.safetyScore < 75).length
        const avgScore = total > 0
            ? Math.round(drivers.reduce((acc, d) => acc + (d.safetyScore || 0), 0) / total)
            : 0
        return { total, active, actionRequired, avgScore }
    }, [drivers])

    // -- Filter Logic --
    const filteredDrivers = useMemo(() => {
        return drivers.filter(d => {
            // Safe access with optional chaining to handle undefined/null properties
            const matchesSearch = d.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.email?.toLowerCase().includes(searchQuery.toLowerCase())
            // Cast d.status to any because the Driver type definition might not perfectly align with our filter set
            const matchesStatus = statusFilter === 'all' || (d.status as any) === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [drivers, searchQuery, statusFilter])

    // -- Handlers --
    const handleCreateDriver = async (e: React.FormEvent) => {
        e.preventDefault()
        const formData = new FormData(e.target as HTMLFormElement)
        const name = (formData.get('name') as string || '').trim()
        const [firstName, ...lastParts] = name.split(' ')
        const lastName = lastParts.join(' ').trim()

        const payload = {
            name,
            first_name: firstName || undefined,
            last_name: lastName || undefined,
            email: formData.get('email') as string,
            phone: formData.get('phone') as string,
            license_number: formData.get('license') as string,
            license_state: formData.get('license_state') as string,
            license_expiry_date: formData.get('license_expiry_date') as string,
            department: formData.get('department') as string
        }

        try {
            const created: any = await createDriver.mutateAsync(payload as any)
            if (onDriversChange) {
                const metadata = created?.metadata && typeof created.metadata === 'object'
                    ? created.metadata
                    : created?.metadata
                        ? (() => {
                            try {
                                return JSON.parse(created.metadata)
                            } catch {
                                return {}
                            }
                        })()
                        : {}

                const normalized: Driver = {
                    id: created.id,
                    tenantId: created.tenant_id,
                    employeeId: created.employee_number || '',
                    name: `${created.first_name || ''} ${created.last_name || ''}`.trim() || created.email,
                    firstName: created.first_name,
                    lastName: created.last_name,
                    email: created.email,
                    phone: created.phone,
                    department: metadata.department || '',
                    licenseType: created.cdl ? 'CDL' : 'Standard',
                    licenseExpiry: created.license_expiry_date,
                    safetyScore: created.performance_score ? Number(created.performance_score) : 100,
                    certifications: [],
                    status: created.status === 'inactive'
                        ? 'off-duty'
                        : created.status === 'on_leave'
                            ? 'on-leave'
                            : created.status === 'suspended'
                                ? 'suspended'
                                : 'active'
                }

                onDriversChange([...drivers, normalized])
            }
            setIsCreateDialogOpen(false)
        } catch (error) {
            // Mutation handles error reporting; keep dialog open for correction
        }
    }

    return (
        <>
            {isVisible && (
                <div
                    className="absolute left-4 top-20 bottom-8 w-[400px] bg-white/95 backdrop-blur-md border border-slate-200 shadow-sm rounded-lg overflow-hidden flex flex-col z-40"
                >
                    {/* Header */}
                    <div className="p-2 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                        <div>
                            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800">
                                <Users className="w-3 h-3 text-blue-800" />
                                Driver Roster
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">
                                {drivers.length} total • {stats.active} on duty
                            </p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 -mt-1 -mr-1" aria-label="Close driver panel">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* KPI Cards (Mini) */}
                    <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50/30 border-b border-slate-100">
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-[10px] text-gray-800 uppercase font-semibold">Avg Safety</div>
                                <div className={`text-sm font-bold ${stats.avgScore >= 90 ? 'text-green-600' : stats.avgScore >= 75 ? 'text-amber-600' : 'text-red-600'}`}>
                                    {stats.avgScore}
                                </div>
                            </div>
                            <Shield className="w-4 h-4 text-slate-300" />
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
                            <div>
                                <div className="text-[10px] text-gray-800 uppercase font-semibold">Attention</div>
                                <div className="text-sm font-bold text-slate-700">{stats.actionRequired}</div>
                            </div>
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-3 space-y-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-700" />
                                <Input
                                    placeholder="Search name or ID..."
                                    className="pl-9 h-9 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    aria-label="Search drivers by name or ID"
                                />
                            </div>
                            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="icon" className="h-9 w-9 shrink-0" aria-label="Add new driver">
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add New Driver</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateDriver} className="space-y-2 mt-2">
                                        <div className="grid w-full gap-1.5">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input id="name" name="name" placeholder="John Doe" required />
                                        </div>
                                        <div className="grid w-full gap-1.5">
                                            <Label htmlFor="email">Email</Label>
                                            <Input id="email" name="email" type="email" placeholder="john@example.com" required />
                                        </div>
                                        <div className="grid w-full gap-1.5">
                                            <Label htmlFor="phone">Phone</Label>
                                            <Input id="phone" name="phone" placeholder="(555) 123-4567" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="license">License #</Label>
                                                <Input id="license" name="license" placeholder="DL-12345" required />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="license_state">State</Label>
                                                <Input id="license_state" name="license_state" placeholder="FL" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="license_expiry_date">License Expiry</Label>
                                                <Input id="license_expiry_date" name="license_expiry_date" type="date" required />
                                            </div>
                                            <div className="grid gap-1.5">
                                                <Label htmlFor="department">Department</Label>
                                                <Input id="department" name="department" placeholder="Logistics" />
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={createDriver.isPending}>
                                            {createDriver.isPending ? "Creating..." : "Create Driver"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {['all', 'active', 'off-duty', 'suspended'].map(status => (
                                <Button
                                    key={status}
                                    variant={statusFilter === status ? "secondary" : "ghost"}
                                    size="sm"
                                    onClick={() => setStatusFilter(status)}
                                    className="h-7 text-xs capitalize rounded-full px-3"
                                >
                                    {status.replace('-', ' ')}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {filteredDrivers.map(driver => (
                                <div
                                    key={driver.id}
                                    onClick={() => onDriverSelect(driver)}
                                    className="group flex items-center justify-between p-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 cursor-pointer transition-all"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="w-10 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm border-2 border-white shadow-sm">
                                                {driver.name.charAt(0)}
                                            </div>
                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${driver.status === 'active' ? 'bg-green-500' :
                                                    (driver.status as string) === 'suspended' ? 'bg-red-500' : 'bg-slate-400'
                                                }`} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm text-slate-900 leading-none">{driver.name}</div>
                                            <div className="text-[11px] text-gray-800 mt-1 flex items-center gap-1">
                                                <Badge variant="outline" className="h-4 px-1 text-[9px] font-normal border-slate-200 text-slate-500">
                                                    {driver.department || 'General'}
                                                </Badge>
                                                {driver.safetyScore >= 90 && (
                                                    <span className="flex items-center text-amber-500">
                                                        <Trophy className="w-3 h-3 mr-0.5" />
                                                        Elite
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <div className={`text-sm font-bold ${driver.safetyScore >= 90 ? 'text-green-600' :
                                                driver.safetyScore < 75 ? 'text-red-500' : 'text-amber-500'
                                            }`}>
                                            {driver.safetyScore}
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Driver actions menu">
                                                    <MoreVertical className="h-4 w-4 text-slate-700" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDriverSelect(driver) }}>
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>Assign Vehicle</DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600">Suspend Driver</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}

                            {filteredDrivers.length === 0 && (
                                <div className="text-center py-10 text-slate-700">
                                    <p className="text-sm">No drivers found.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </>
    )
}
