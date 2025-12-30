import {
    MagnifyingGlass,
    ArrowsClockwise,
    VideoCamera,
    X
} from "@phosphor-icons/react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"
import { CameraDataSource } from "@/lib/types"

interface TrafficCameraControlPanelProps {
    filters: {
        search: string;
        status: "all" | "operational" | "offline";
        source: string;
    };
    onFilterChange: (key: string, value: any) => void;
    onClose: () => void;
    isVisible: boolean;
}

export function TrafficCameraControlPanel({
    filters,
    onFilterChange,
    onClose,
    isVisible
}: TrafficCameraControlPanelProps) {

    // -- Sync Logic (Reused) --
    const syncMutation = useMutation({
        mutationFn: async () => apiClient.trafficCameras.sync(),
        onSuccess: () => toast.success("Camera data synchronized"),
        onError: () => toast.error("Failed to sync camera data")
    })

    // -- Data Source Stats --
    const { data: sources = [] } = useQuery({
        queryKey: ["trafficCameras", "sources"],
        queryFn: async () => {
            const result = await apiClient.trafficCameras.sources.list()
            return result as CameraDataSource[]
        }
    })

    if (!isVisible) return null;

    return (
        <Card className="fixed top-24 right-6 w-80 shadow-2xl z-40 border border-white/20 bg-white/80 backdrop-blur-xl animate-in slide-in-from-right-10 rounded-2xl overflow-hidden ring-1 ring-black/5">
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />
            <CardHeader className="pb-4 border-b border-black/5 flex flex-row items-center justify-between space-y-0 relative z-10 bg-white/40">
                <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                        <div className="p-1.5 bg-blue-500/10 rounded-md border border-blue-500/20">
                            <VideoCamera weight="fill" className="text-blue-600 w-4 h-4" />
                        </div>
                        Traffic Feed
                    </CardTitle>
                    <div className="flex items-center mt-1 ml-1 gap-1.5">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Live Monitoring</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-black/5 rounded-full" onClick={onClose}>
                    <X className="w-4 h-4 text-slate-500" />
                </Button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">

                {/* Sync Controls */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{sources.length} Sources Active</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2"
                        onClick={() => syncMutation.mutate()}
                        disabled={syncMutation.isPending}
                    >
                        <ArrowsClockwise className={`w-3 h-3 mr-1 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                        Sync
                    </Button>
                </div>

                {/* Filters */}
                <div className="space-y-3">
                    <div className="relative">
                        <MagnifyingGlass className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                            placeholder="Search cameras..."
                            value={filters.search}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>

                    <Select
                        value={filters.status}
                        onValueChange={(value) => onFilterChange('status', value)}
                    >
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="operational">Operational Only</SelectItem>
                            <SelectItem value="offline">Offline Only</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={filters.source}
                        onValueChange={(value) => onFilterChange('source', value)}
                    >
                        <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            {sources.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Legend */}
                <div className="pt-2 border-t flex gap-4 justify-center">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">Active</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-xs text-muted-foreground">Offline</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    )
}
