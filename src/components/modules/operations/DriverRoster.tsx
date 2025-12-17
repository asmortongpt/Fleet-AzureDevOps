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
    Phone,
    EnvelopeSimple,
    MagnifyingGlass,
    User,
    Plus
} from "@phosphor-icons/react";
import { useFleetData } from "@/hooks/use-fleet-data";

interface DriverRosterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const DriverRoster: React.FC<DriverRosterProps> = ({ open, onOpenChange }) => {
    const { drivers = [], staff = [] } = useFleetData();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"drivers" | "staff">("drivers");

    const filteredDrivers = drivers.filter(d =>
        !searchQuery ||
        (d.name && d.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (d.employeeId && d.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const filteredStaff = staff.filter(s =>
        !searchQuery ||
        (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.employeeId && s.employeeId.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                className="w-[400px] sm:w-[540px] flex flex-col p-0 text-foreground glass-panel border-white/10"
                side="left" // Changed to Left to balance UI (or keep right? Fleet/Team usually left, Ops right)
                style={{ backgroundColor: 'transparent' }}
            >
                <SheetHeader className="p-6 border-b border-white/10 bg-black/20">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-xl font-semibold text-white">Team Roster</SheetTitle>
                    </div>
                    <SheetDescription>
                        Manage drivers and fleet staff directly from operations.
                    </SheetDescription>

                    <div className="mt-4 space-y-4">
                        <div className="flex bg-muted/50 p-1 rounded-lg">
                            <button
                                className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${activeTab === "drivers"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                onClick={() => setActiveTab("drivers")}
                            >
                                Drivers ({drivers.length})
                            </button>
                            <button
                                className={`flex-1 text-sm font-medium py-1.5 px-3 rounded-md transition-all ${activeTab === "staff"
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                                onClick={() => setActiveTab("staff")}
                            >
                                Staff ({staff.length})
                            </button>
                        </div>

                        <div className="relative">
                            <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder={`Search ${activeTab}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activeTab === "drivers" ? (
                        filteredDrivers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                                <User className="w-8 h-8 mb-2 opacity-50" />
                                <p>No drivers found</p>
                            </div>
                        ) : (
                            filteredDrivers.map((driver) => (
                                <div
                                    key={driver.id}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                            {driver.name ? driver.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '??'}
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-sm">{driver.name}</h4>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Badge variant="outline" className="h-5 px-1.5">
                                                    {driver.licenseType || 'N/A'}
                                                </Badge>
                                                <span className={`flex items-center gap-1 ${driver.status === 'active' ? 'text-green-500' : 'text-gray-500'
                                                    }`}>
                                                    • {driver.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => window.location.href = `tel:${driver.phone}`}
                                            title="Call"
                                        >
                                            <Phone className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => window.location.href = `mailto:${driver.email}`}
                                            title="Email"
                                        >
                                            <EnvelopeSimple className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        filteredStaff.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center font-semibold text-sm">
                                        {member.name ? member.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2) : '??'}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm">{member.name}</h4>
                                        <div className="text-xs text-muted-foreground">{member.role}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{member.email}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => window.location.href = `tel:${member.phone}`}
                                        title="Call"
                                    >
                                        <Phone className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8"
                                        onClick={() => window.location.href = `mailto:${member.email}`}
                                        title="Email"
                                    >
                                        <EnvelopeSimple className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t bg-muted/10">
                    <Button className="w-full" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Person
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
