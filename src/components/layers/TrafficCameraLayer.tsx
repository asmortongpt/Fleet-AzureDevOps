import { VideoCamera } from "@phosphor-icons/react"
import { useQuery } from "@tanstack/react-query"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { apiClient } from "@/lib/api-client"
import { TrafficCamera } from "@/lib/types"

interface TrafficCameraLayerProps {
    visible: boolean;
    filters: {
        search: string;
        status: "all" | "operational" | "offline";
        source: string;
    };
    onCameraSelect: (camera: TrafficCamera) => void;
    selectedCameraId?: string;
}

export function TrafficCameraLayer({ visible, filters, onCameraSelect, selectedCameraId }: TrafficCameraLayerProps) {
    const { data: cameras = [] } = useQuery({
        queryKey: ["trafficCameras", "cameras"],
        queryFn: async () => {
            const result = await apiClient.trafficCameras.list()
            return result as TrafficCamera[]
        },
        enabled: visible,
        gcTime: 5 * 60 * 1000
    });

    if (!visible) return null;

    const filteredCameras = cameras.filter(camera => {
        // Status filter
        if (filters.status === "operational" && !camera.operational) return false
        if (filters.status === "offline" && camera.operational) return false

        // Source filter
        if (filters.source !== "all" && camera.sourceId !== filters.source) return false

        // Search filter
        if (filters.search) {
            const search = filters.search.toLowerCase()
            return (
                camera.name?.toLowerCase().includes(search) ||
                camera.address?.toLowerCase().includes(search) || false
            )
        }

        return true
    });

    return (
        <>
            {filteredCameras.map(camera => (
                <HoverCard key={camera.id}>
                    <HoverCardTrigger asChild>
                        <div
                            className={`
                                group absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200
                                ${selectedCameraId === camera.id ? 'scale-125 z-50' : 'hover:scale-110 z-10'}
                            `}
                            style={{
                                left: `${((camera.longitude || 0) + 180) / 3.6}%`,
                                top: `${((camera.latitude || 0) + 90) / 1.8}%`
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onCameraSelect(camera);
                            }}
                        >
                            <div
                                className={`
                                    p-1.5 rounded-full shadow-md border-2
                                    ${camera.operational
                                        ? 'bg-white border-green-500 text-green-600'
                                        : 'bg-white border-red-500 text-red-600'
                                    }
                                    ${selectedCameraId === camera.id ? 'ring-2 ring-primary ring-offset-2' : ''}
                                `}
                            >
                                {camera.operational && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                                    </span>
                                )}
                                <VideoCamera weight="fill" className="w-4 h-4" />
                            </div>
                        </div>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold">{camera.name}</h4>
                            <p className="text-xs text-muted-foreground">{camera.address}</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full ${camera.operational ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {camera.operational ? 'Active' : 'Offline'}
                                </span>
                            </div>
                            {camera.imageUrl && (
                                <div className="relative aspect-video bg-muted rounded-md overflow-hidden">
                                    <img
                                        src={camera.imageUrl}
                                        alt={camera.name || 'Traffic Camera'}
                                        className="object-cover w-full h-full"
                                        loading="lazy"
                                    />
                                </div>
                            )}
                        </div>
                    </HoverCardContent>
                </HoverCard>
            ))}
        </>
    );
}