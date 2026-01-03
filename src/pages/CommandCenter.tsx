

import React, { useState } from "react";

import { ProfessionalFleetMap } from "../components/Maps/ProfessionalFleetMap";
import { DispatchPanel } from "../components/modules/operations/DispatchPanel";
import { DriverRoster } from "../components/modules/operations/DriverRoster";
import { FuelPanel } from "../components/modules/operations/FuelPanel";
import { MaintenancePanel } from "../components/modules/operations/MaintenancePanel";
import { VehicleRoster } from "../components/modules/operations/VehicleRoster";
import { CommandDock } from "../components/ui/CommandDock";

import { useFleetData } from "@/hooks/use-fleet-data";

const CommandCenter: React.FC = () => {
    const { vehicles = [], facilities = [] } = useFleetData();

    // Panel States
    const [activePanel, setActivePanel] = useState<string | null>(null);

    // Derived States for Drawers
    const vehiclesOpen = activePanel === "fleet";
    const rosterOpen = activePanel === "team";
    const maintenanceOpen = activePanel === "service";
    const dispatchOpen = activePanel === "comms";
    const fuelOpen = activePanel === "fuel";

    const handlePanelSelect = (panel: string) => {
        // Toggle: if clicking active panel, close it.
        setActivePanel(current => current === panel ? null : panel);
    };

    // Metrics Logic
    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col h-full bg-slate-950 overflow-hidden relative selection:bg-emerald-500/30">
            {/* 1. Main Content Layer - The Map (Full Screen) */}
            <div className="absolute inset-0 z-0">
                <ProfessionalFleetMap
                    vehicles={vehicles}
                    facilities={facilities}
                    height="100%"
                    onVehicleSelect={(id) => {
                        console.log("Selected vehicle", id);
                        setActivePanel("fleet");
                    }}
                    showLegend={true}
                    enableRealTime={true}
                    variant="immersive"
                />
            </div>

            {/* 2. HUD - System Status (Top Right) */}
            <div className="absolute top-4 right-4 z-10 animate-fade-in-down pointer-events-none">
                <div className="bg-slate-900/80 backdrop-blur-md border border-emerald-500/20 shadow-lg p-3 rounded-lg flex flex-col items-end gap-2 pointer-events-auto">
                    <div className="font-mono text-2xl font-light text-white tracking-tighter">
                        {currentTime.toLocaleTimeString([], { hour12: false })}
                        <span className="text-xs text-slate-500 ml-1">UTC</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            ONLINE
                        </div>
                    </div>

                    <div className="h-6 overflow-hidden flex flex-col justify-end w-32 relative mask-gradient-top border-t border-white/5 pt-1">
                        <div className="text-[9px] font-mono text-emerald-500/70 animate-scroll-up space-y-0.5 leading-none text-right">
                            <div>SYS_CHECK_OK</div>
                            <div>LINK_STABLE</div>
                            <div>UPDATING...</div>
                            <div>PACKET_492</div>
                            <div>V_TELEM_OK</div>
                            <div>SYS_CHECK_OK</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Global Navigation - Floating Dock */}
            <CommandDock
                activePanel={activePanel}
                onPanelSelect={handlePanelSelect}
            />

            {/* 4. Drawers / Layers (Managed by Dock) */}
            <VehicleRoster
                open={vehiclesOpen}
                onOpenChange={(open) => !open && setActivePanel(null)}
            />

            <DriverRoster
                open={rosterOpen}
                onOpenChange={(open) => !open && setActivePanel(null)}
            />

            <MaintenancePanel
                open={maintenanceOpen}
                onOpenChange={(open) => !open && setActivePanel(null)}
            />

            <DispatchPanel
                open={dispatchOpen}
                onOpenChange={(open) => !open && setActivePanel(null)}
            />

            <FuelPanel
                open={fuelOpen}
                onOpenChange={(open) => !open && setActivePanel(null)}
            />
        </div>
    );
};

export default CommandCenter;
