import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "../../ui/sheet";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import {
    Wrench,
    CheckCircle,
    Warning,
    Clock,
    CalendarCheck
} from "@phosphor-icons/react";
import { useFleetData } from "@/hooks/use-fleet-data";

interface MaintenancePanelProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const MaintenancePanel: React.FC<MaintenancePanelProps> = ({ open, onOpenChange }) => {
    const { vehicles = [] } = useFleetData();
    const [filter, setFilter] = useState<'all' | 'overdue' | 'due-soon'>('all');

    // Mock maintenance logic based on vehicles
    const maintenanceTasks = vehicles.map(v => {
        // Simulate some logic
        const isOverdue = Math.random() > 0.8;
        const isDueSoon = Math.random() > 0.6;
        return {
            id: v.id,
            vehicleName: v.name,
            status: isOverdue ? 'overdue' : (isDueSoon ? 'due-soon' : 'good'),
            lastService: '2023-10-15',
            nextService: isOverdue ? '2023-12-01' : '2024-02-15',
            task: 'Regular Service B'
        };
    }).sort((a, b) => {
        const score = (s: string) => s === 'overdue' ? 0 : s === 'due-soon' ? 1 : 2;
        return score(a.status) - score(b.status);
    });

    const filteredTasks = maintenanceTasks.filter(t => {
        if (filter === 'all') return true;
        return t.status === filter;
    });

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="w-[400px] sm:w-[540px] flex flex-col p-0 text-foreground glass-panel border-white/10"
                side="right"
                style={{ backgroundColor: 'transparent' }}
            >
                <SheetHeader className="p-6 border-b border-white/10 bg-black/20">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-semibold flex items-center gap-2 text-white">
                            <Wrench className="w-6 h-6 text-orange-500" weight="fill" />
                            Maintenance
                        </SheetTitle>
                        <div className="flex gap-2">
                            <Badge variant="destructive" className="font-mono">
                                {maintenanceTasks.filter(t => t.status === 'overdue').length} CRITICAL
                            </Badge>
                        </div>
                    </div>
                    <SheetDescription>
                        Track service schedules and vehicle health.
                    </SheetDescription>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === 'all' ? 'bg-orange-500 text-white border-orange-500' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                        >
                            All Tasks
                        </button>
                        <button
                            onClick={() => setFilter('overdue')}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === 'overdue' ? 'bg-red-500 text-white border-red-500' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                        >
                            Overdue
                        </button>
                        <button
                            onClick={() => setFilter('due-soon')}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filter === 'due-soon' ? 'bg-amber-500 text-white border-amber-500' : 'bg-background hover:bg-muted text-muted-foreground'}`}
                        >
                            Due Soon
                        </button>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {filteredTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <CheckCircle className="w-8 h-8 mb-2 opacity-50 text-green-500" />
                            <p>All systems operational</p>
                        </div>
                    ) : (
                        filteredTasks.map((task, idx) => (
                            <div
                                key={idx}
                                className="flex flex-col p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all group relative overflow-hidden"
                            >
                                {task.status === 'overdue' && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
                                )}
                                {task.status === 'due-soon' && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
                                )}

                                <div className="flex justify-between items-start mb-2 pl-2">
                                    <div>
                                        <h4 className="font-bold text-sm">{task.vehicleName}</h4>
                                        <div className="text-xs text-muted-foreground">{task.task}</div>
                                    </div>
                                    {task.status === 'overdue' && (
                                        <Badge variant="destructive" className="flex items-center gap-1">
                                            <Warning className="w-3 h-3" /> Overdue
                                        </Badge>
                                    )}
                                    {task.status === 'due-soon' && (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                                            <Clock className="w-3 h-3 mr-1" /> Due Soon
                                        </Badge>
                                    )}
                                    {task.status === 'good' && (
                                        <Badge variant="outline" className="text-green-600 border-green-200">
                                            On Schedule
                                        </Badge>
                                    )}
                                </div>

                                <div className="flex items-center justify-between mt-2 pl-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <CalendarCheck className="w-3 h-3" />
                                        <span>Last: {task.lastService}</span>
                                    </div>
                                    <div className="font-medium text-foreground">
                                        Next: {task.nextService}
                                    </div>
                                </div>

                                <div className="mt-3 pl-2 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button size="sm" variant="default" className="w-full h-7 text-xs">
                                        Schedule Service
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
};
