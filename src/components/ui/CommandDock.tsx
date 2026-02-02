import {
    Users,
    Truck,
    Wrench,
    Radio,
    Fuel
} from "lucide-react";
import React, { useState } from "react";

import { cn } from "@/lib/utils";

interface CommandDockProps {
    activePanel: string | null;
    onPanelSelect: (panel: string) => void;
}

export const CommandDock: React.FC<CommandDockProps> = ({ activePanel, onPanelSelect }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const items = [
        { id: "fleet", icon: Truck, label: "Fleet" },
        { id: "team", icon: Users, label: "Team" },
        { id: "comms", icon: Radio, label: "Comms" },
        { id: "service", icon: Wrench, label: "Service" },
        { id: "fuel", icon: Fuel, label: "Fuel" },
    ];

    return (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40">
            {/* Dock Container */}
            <div
                className={cn(
                    "flex items-end gap-2 px-2 py-3 rounded-lg",
                    "bg-slate-950/40 backdrop-blur-xl border border-white/10 shadow-sm",
                    "transition-all duration-300 ease-out"
                )}
                onMouseLeave={() => setHoveredIndex(null)}
            >
                {items.map((item, index) => {
                    const isHovered = hoveredIndex === index;
                    const isNeighbor = hoveredIndex !== null && Math.abs(hoveredIndex - index) === 1;
                    const isActive = activePanel === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onPanelSelect(item.id)}
                            onMouseEnter={() => setHoveredIndex(index)}
                            className={cn(
                                "group relative flex flex-col items-center justify-end transition-all duration-300 ease-out origin-bottom",
                                // Magnification effect logic
                                isHovered ? "w-20 h-20" : isNeighbor ? "w-16 h-16" : "w-14 h-14"
                            )}
                        >
                            {/* Icon Container */}
                            <div className={cn(
                                "relative flex items-center justify-center rounded-md transition-all duration-300",
                                "border border-white/5 shadow-sm overflow-hidden",
                                isHovered ? "w-16 h-16 bg-white/10" : isNeighbor ? "w-14 h-14 bg-white/5" : "w-12 h-9 bg-slate-900/50",
                                isActive && "bg-emerald-500/20 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                            )}>
                                {/* Active Indicator Dot */}
                                {isActive && (
                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_rgba(16,185,129,1)]" />
                                )}

                                <Icon
                                    className={cn(
                                        "transition-all duration-300",
                                        isHovered ? "w-4 h-4 text-white" : "w-4 h-4 text-slate-700",
                                        isActive && "text-emerald-700"
                                    )}
                                />

                                {/* Reflection/Glass Effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent opacity-50 pointer-events-none" />
                            </div>

                            {/* Label (Tooltip style) */}
                            <span className={cn(
                                "absolute -top-10 px-2 py-1 rounded bg-slate-900/90 border border-white/10 text-xs font-medium text-white shadow-sm backdrop-blur-sm transition-all duration-200",
                                isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
