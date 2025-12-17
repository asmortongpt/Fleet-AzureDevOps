import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Badge } from "../../ui/badge";
import {
    Truck,
    MagnifyingGlass,
    Plus,
    Funnel,
    GasPump,
    Gauge
} from "@phosphor-icons/react";
import { useFleetData } from "@/hooks/use-fleet-data";
import { Vehicle } from "@/lib/types";

interface VehicleRosterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onVehicleSelect?: (vehicle: Vehicle) => void;
}

export const VehicleRoster: React.FC<VehicleRosterProps> = ({
    open,
    onOpenChange,
    onVehicleSelect
}) => {
    const { vehicles = [], addVehicle } = useFleetData();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    const filteredVehicles = vehicles.filter((v) => {
        const matchesSearch = !searchQuery ||
            (v.name && v.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (v.id && v.id.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesStatus = statusFilter === "all" || v.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "active": return "text-green-500 border-green-200 bg-green-50";
            case "maintenance": return "text-amber-500 border-amber-200 bg-amber-50";
            case "inactive": return "text-gray-500 border-gray-200 bg-gray-50";
            default: return "text-blue-500 border-blue-200 bg-blue-50";
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="w-[400px] sm:w-[540px] flex flex-col p-0 text-foreground glass-panel border-white/10"
                side="left"
                style={{ backgroundColor: 'transparent' }}
            >
                <SheetHeader className="p-6 border-b border-white/10 bg-black/20">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-semibold flex items-center gap-2 text-white">
                            <Truck className="w-6 h-6 text-emerald-400" weight="fill" />
                            Vehicle Fleet
                        </SheetTitle>
                        <Badge variant="secondary" className="font-mono">
                            {vehicles.length} UNITS
                        </Badge>
                    </div>
                    <SheetDescription>
                        Monitor and manage your entire fleet inventory.
                    </SheetDescription>

                    <div className="mt-4 space-y-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search unit #, VIN, or make..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Funnel className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex gap-2 overflow-x-auto pb-2 noscroll">
                            {['all', 'active', 'maintenance', 'inactive'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`
                    px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                    ${statusFilter === status
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-background hover:bg-muted text-muted-foreground border-border'}
                  `}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredVehicles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <Truck className="w-8 h-8 mb-2 opacity-50" />
                            <p>No vehicles found</p>
                        </div>
                    ) : (
                        filteredVehicles.map((vehicle) => (
                            <div
                                key={vehicle.id}
                                className="flex flex-col p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all cursor-pointer group"
                                onClick={() => onVehicleSelect?.(vehicle)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <Truck className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-base">{vehicle.name || vehicle.id}</h4>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                VIN: {vehicle.id.toUpperCase()}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={getStatusColor(vehicle.status)}>
                                        {vehicle.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Gauge className="w-4 h-4" />
                                        <span>{vehicle.fuelLevel || 0}% Fuel</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <GasPump className="w-4 h-4" />
                                        <span>{vehicle.fuelType || 'Unknown'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-muted/10">
                    <Button className="w-full" onClick={() => addVehicle?.({} as any)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Vehicle
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
