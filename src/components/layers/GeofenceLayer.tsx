import { Geofence } from "@/lib/types"

interface GeofenceLayerProps {
    visible: boolean;
    geofences: Geofence[];
    onGeofenceSelect?: (geofence: Geofence) => void;
    breachedGeofenceIds?: string[];
}

export function GeofenceLayer({ visible, geofences, onGeofenceSelect, breachedGeofenceIds = [] }: GeofenceLayerProps) {
    if (!visible) return null;

    const filteredGeofences = geofences.filter(g => g.active);

    return (
        <>
            <style>
                {`
                @keyframes pulse-ring {
                    0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.5; }
                    100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
                }
                @keyframes pulse-dot {
                    0% { transform: translate(-50%, -50%) scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7); }
                    70% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
                    100% { transform: translate(-50%, -50%) scale(0.95); box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
                }
                `}
            </style>
            {filteredGeofences.map(geofence => {
                if (geofence.type === "circle" && geofence.center) {
                    const isBreached = breachedGeofenceIds.includes(geofence.id);
                    // If breached, override color to Red-500 (#EF4444), otherwise use defined color
                    const displayColor = isBreached ? '#EF4444' : geofence.color;
                    const pulseAnimation = isBreached ? 'pulse-ring 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite' : 'pulse-ring 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite';

                    return (
                        <div
                            key={geofence.id}
                            className="absolute group z-20"
                            style={{
                                left: `${((geofence.center.lng) + 180) / 3.6}%`,
                                top: `${((geofence.center.lat) + 90) / 1.8}%`,
                                transform: 'translate(-50%, -50%)',
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onGeofenceSelect?.(geofence);
                            }}
                        >
                            {/* Radar Pulse Effect */}
                            <div
                                className="absolute rounded-full pointer-events-none"
                                style={{
                                    width: isBreached ? '100px' : '80px',
                                    height: isBreached ? '100px' : '80px',
                                    border: `1px solid ${displayColor}`,
                                    backgroundColor: `${displayColor}20`,
                                    animation: pulseAnimation,
                                    transform: 'translate(-50%, -50%)',
                                    left: '50%',
                                    top: '50%'
                                }}
                            />

                            {/* Core Core */}
                            <div
                                className="relative rounded-full border-2 cursor-pointer transition-all hover:scale-110 shadow-sm"
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: `${displayColor}40`,
                                    borderColor: displayColor,
                                    backdropFilter: 'blur(2px)',
                                    animation: 'pulse-dot 2s infinite'
                                }}
                            />

                            {/* Tooltip */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 text-white text-xs py-1 px-2 rounded shadow-lg whitespace-nowrap z-30">
                                <div className="font-semibold">{geofence.name}</div>
                                <div className="text-[10px] text-slate-300">{geofence.type} • {geofence.radius}m</div>
                                {isBreached && <div className="text-[10px] text-red-400 font-bold uppercase mt-1">⚠️ Breach Detected</div>}
                            </div>
                        </div>
                    );
                }
                return null;
            })}
        </>
    );
}
