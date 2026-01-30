import {
    Fuel,
    TrendingUp,
    DollarSign,
    Drop,
    MapPin
} from "lucide-react";
import React from "react";

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "../../ui/sheet";

import { useFleetData } from "@/hooks/use-fleet-data";

interface FuelPanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const FuelPanel: React.FC<FuelPanelProps> = ({ open, onOpenChange }) => {
    const { fuelTransactions = [] } = useFleetData();

    // Mock data if empty
    const transactions = fuelTransactions.length > 0 ? fuelTransactions : Array.from({ length: 10 }).map((_, i) => ({
        id: `tx-${i}`,
        date: new Date(Date.now() - i * 86400000).toISOString(),
        vehicleNumber: `Unit ${100 + i}`,
        station: i % 2 === 0 ? "Shell Station 42" : "Chevron West",
        gallons: 15 + Math.random() * 10,
        pricePerGallon: 3.50 + Math.random(),
        totalCost: 65 + Math.random() * 20
    }));

    const totalCost = transactions.reduce((acc, t) => acc + (t.totalCost || 0), 0);
    const totalVolume = transactions.reduce((acc, t) => acc + (t.gallons || 0), 0);
    const avgPrice = totalVolume > 0 ? totalCost / totalVolume : 0;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="w-[400px] sm:w-[540px] flex flex-col p-0 text-foreground glass-panel border-white/10"
                side="right"
                style={{ backgroundColor: 'transparent' }}
            >
                <SheetHeader className="p-3 border-b border-white/10 bg-black/20">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-base font-semibold flex items-center gap-2 text-white">
                            <Fuel className="w-4 h-4 text-emerald-400" />
                            Fuel Intelligence
                        </SheetTitle>
                    </div>
                    <SheetDescription>
                        Real-time fuel consumption and station analytics.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto bg-muted/5">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 gap-2 p-2">
                        <div className="bg-card p-2 rounded-md border shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
                                <DollarSign className="w-4 h-4" /> Total Spend
                            </div>
                            <div className="text-sm font-bold font-mono">
                                ${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                            <div className="text-xs text-green-500 flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" /> +2.4% vs last week
                            </div>
                        </div>

                        <div className="bg-card p-2 rounded-md border shadow-sm">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium uppercase tracking-wider mb-2">
                                <Drop className="w-4 h-4" /> Volume (Gal)
                            </div>
                            <div className="text-sm font-bold font-mono">
                                {Math.round(totalVolume).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Avg ${avgPrice.toFixed(2)} / gal
                            </div>
                        </div>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="px-2 pb-2">
                        <div className="text-sm font-semibold mb-3 px-1">Recent Transactions</div>
                        <div className="bg-card rounded-md border shadow-sm overflow-hidden">
                            {transactions.map((tx, i) => (
                                <div key={tx.id} className={`p-3 flex items-center justify-between border-b last:border-0 hover:bg-muted/50 transition-colors`}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center text-green-700">
                                            <Fuel className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-sm">{tx.vehicleNumber}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <MapPin className="w-3 h-3" /> {tx.station}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-mono font-medium text-sm">
                                            ${tx.totalCost?.toFixed(2)}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {tx.gallons?.toFixed(1)} gal
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Efficiency Tip */}
                    <div className="p-2">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <h4 className="font-semibold text-blue-800 text-sm mb-1 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Optimization Insight
                            </h4>
                            <p className="text-xs text-blue-800">
                                Average fuel price at "Shell Station 42" is $0.15 higher than regional average. Consider redirecting units to "Chevron West".
                            </p>
                        </div>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
