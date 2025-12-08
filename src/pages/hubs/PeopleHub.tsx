import { ColumnDef } from "@tanstack/react-table";
import {
  Users,
  Shield,
  Clock,
  CheckCircle,
  Warning,
  TrendUp,
  Calendar,
  Download,
  Plus,
} from "lucide-react";
import React, { useMemo } from "react";

import { DataGrid } from "../../components/common/DataGrid";
import { KPIStrip, KPIMetric } from "../../components/common/KPIStrip";
import { HubLayout } from "../../components/layout/HubLayout";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

import { useInspect } from "@/services/inspect/InspectContext";

interface Driver {
  id: string;
  name: string;
  status: "active" | "on-duty" | "off-duty" | "on-leave";
  licenseClass: string;
  safetyScore: number;
  hoursThisWeek: number;
  nextShift: string;
  email: string;
  phone: string;
  experience: string;
  violations: number;
  certifications: string[];
  photoUrl?: string; // Microsoft AD profile photo URL
  performance: {
    trips: number;
    onTimeRate: number;
    fuelEfficiency: number;
  };
}

const PeopleHub: React.FC = () => {
  const { openInspect } = useInspect();

  // Mock data for drivers
  const drivers: Driver[] = useMemo(() => [
    {
      id: "DRV001",
      name: "John Martinez",
      status: "on-duty",
      licenseClass: "CDL-A",
      safetyScore: 98,
      hoursThisWeek: 42,
      nextShift: "Today, 2:00 PM",
      email: "j.martinez@fleet.com",
      phone: "(555) 123-4567",
      experience: "8 years",
      violations: 0,
      certifications: ["HAZMAT", "Tanker", "Double/Triple"],
      performance: {
        trips: 156,
        onTimeRate: 98,
        fuelEfficiency: 92,
      },
    },
    {
      id: "DRV002",
      name: "Sarah Johnson",
      status: "active",
      licenseClass: "CDL-A",
      safetyScore: 96,
      hoursThisWeek: 38,
      nextShift: "Tomorrow, 6:00 AM",
      email: "s.johnson@fleet.com",
      phone: "(555) 234-5678",
      experience: "5 years",
      violations: 0,
      certifications: ["HAZMAT", "Tanker"],
      performance: {
        trips: 142,
        onTimeRate: 96,
        fuelEfficiency: 88,
      },
    },
    {
      id: "DRV003",
      name: "Michael Chen",
      status: "on-duty",
      licenseClass: "CDL-B",
      safetyScore: 94,
      hoursThisWeek: 45,
      nextShift: "Today, 6:00 PM",
      email: "m.chen@fleet.com",
      phone: "(555) 345-6789",
      experience: "12 years",
      violations: 1,
      certifications: ["Passenger", "School Bus"],
      performance: {
        trips: 138,
        onTimeRate: 94,
        fuelEfficiency: 90,
      },
    },
    {
      id: "DRV004",
      name: "Emily Rodriguez",
      status: "off-duty",
      licenseClass: "CDL-A",
      safetyScore: 92,
      hoursThisWeek: 36,
      nextShift: "Tomorrow, 8:00 AM",
      email: "e.rodriguez@fleet.com",
      phone: "(555) 456-7890",
      experience: "3 years",
      violations: 0,
      certifications: ["HAZMAT"],
      performance: {
        trips: 134,
        onTimeRate: 92,
        fuelEfficiency: 85,
      },
    },
    {
      id: "DRV005",
      name: "David Thompson",
      status: "on-leave",
      licenseClass: "CDL-A",
      safetyScore: 91,
      hoursThisWeek: 0,
      nextShift: "Monday, 6:00 AM",
      email: "d.thompson@fleet.com",
      phone: "(555) 567-8901",
      experience: "7 years",
      violations: 1,
      certifications: ["Tanker", "Double/Triple"],
      performance: {
        trips: 128,
        onTimeRate: 89,
        fuelEfficiency: 87,
      },
    },
    {
      id: "DRV006",
      name: "Lisa Anderson",
      status: "active",
      licenseClass: "CDL-B",
      safetyScore: 89,
      hoursThisWeek: 40,
      nextShift: "Today, 10:00 AM",
      email: "l.anderson@fleet.com",
      phone: "(555) 678-9012",
      experience: "2 years",
      violations: 2,
      certifications: ["Passenger"],
      performance: {
        trips: 98,
        onTimeRate: 88,
        fuelEfficiency: 82,
      },
    },
    {
      id: "DRV007",
      name: "James Wilson",
      status: "on-duty",
      licenseClass: "CDL-A",
      safetyScore: 95,
      hoursThisWeek: 44,
      nextShift: "Today, 4:00 PM",
      email: "j.wilson@fleet.com",
      phone: "(555) 789-0123",
      experience: "10 years",
      violations: 0,
      certifications: ["HAZMAT", "Tanker", "Double/Triple"],
      performance: {
        trips: 189,
        onTimeRate: 97,
        fuelEfficiency: 93,
      },
    },
    {
      id: "DRV008",
      name: "Maria Garcia",
      status: "off-duty",
      licenseClass: "CDL-A",
      safetyScore: 93,
      hoursThisWeek: 35,
      nextShift: "Tomorrow, 5:00 AM",
      email: "m.garcia@fleet.com",
      phone: "(555) 890-1234",
      experience: "6 years",
      violations: 0,
      certifications: ["HAZMAT", "Tanker"],
      performance: {
        trips: 145,
        onTimeRate: 95,
        fuelEfficiency: 89,
      },
    },
  ], []);

  // Calculate KPI metrics
  const kpiMetrics: KPIMetric[] = useMemo(() => {
    const totalDrivers = drivers.length;
    const activeDrivers = drivers.filter(d => d.status === "on-duty").length;
    const onLeave = drivers.filter(d => d.status === "on-leave").length;
    const avgSafetyScore = Math.round(
      drivers.reduce((sum, d) => sum + d.safetyScore, 0) / totalDrivers
    );

    return [
      {
        id: "total-drivers",
        icon: <Users className="w-4 h-4" />,
        label: "Total Drivers",
        value: totalDrivers,
        color: "text-blue-500",
      },
      {
        id: "active-drivers",
        icon: <CheckCircle className="w-4 h-4" />,
        label: "Active Drivers",
        value: activeDrivers,
        color: "text-green-500",
        trend: {
          value: 5,
          direction: "up",
          isPositive: true,
        },
      },
      {
        id: "on-leave",
        icon: <Clock className="w-4 h-4" />,
        label: "On Leave",
        value: onLeave,
        color: "text-orange-500",
      },
      {
        id: "safety-score",
        icon: <Shield className="w-4 h-4" />,
        label: "Avg Safety Score",
        value: `${avgSafetyScore}%`,
        color: "text-purple-500",
        trend: {
          value: 3,
          direction: "up",
          isPositive: true,
        },
      },
    ];
  }, [drivers]);

  // Define columns for the DataGrid
  const columns: ColumnDef<Driver>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const initials = row.original.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase();
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={row.original.photoUrl} alt={row.original.name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="font-medium">{row.original.name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        const variant =
          status === "on-duty" ? "default" :
          status === "active" ? "secondary" :
          status === "off-duty" ? "outline" :
          "destructive";
        return <Badge variant={variant}>{status}</Badge>;
      },
    },
    {
      accessorKey: "licenseClass",
      header: "License Class",
    },
    {
      accessorKey: "safetyScore",
      header: "Safety Score",
      cell: ({ row }) => {
        const score = row.original.safetyScore;
        const color = score >= 95 ? "text-green-500" : score >= 90 ? "text-blue-500" : score >= 85 ? "text-orange-500" : "text-red-500";
        return (
          <span className={`font-bold ${color}`}>
            {score}%
          </span>
        );
      },
    },
    {
      accessorKey: "hoursThisWeek",
      header: "Hours This Week",
      cell: ({ row }) => `${row.original.hoursThisWeek}h`,
    },
    {
      accessorKey: "nextShift",
      header: "Next Shift",
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          <span className="text-sm">{row.original.nextShift}</span>
        </div>
      ),
    },
  ], []);

  const handleDriverClick = (driver: Driver) => {
    openInspect({
      type: "driver",
      id: driver.id,
      data: driver,
      tabs: [
        {
          id: "profile",
          label: "Profile",
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Basic Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span>{driver.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">License:</span>
                    <span>{driver.licenseClass}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Experience:</span>
                    <span>{driver.experience}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email:</span>
                    <span>{driver.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span>{driver.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "performance",
          label: "Performance",
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Trips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{driver.performance.trips}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">On-Time Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{driver.performance.onTimeRate}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Fuel Efficiency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{driver.performance.fuelEfficiency}%</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Violations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{driver.violations}</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "scorecard",
          label: "Scorecard",
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Safety Scorecard</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>Overall Safety Score</span>
                      <span className="font-bold">{driver.safetyScore}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${driver.safetyScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-3 border-t">
                    <h4 className="text-sm font-medium mb-2">Incident History</h4>
                    <p className="text-sm text-muted-foreground">
                      {driver.violations === 0
                        ? "No violations or incidents on record"
                        : `${driver.violations} minor violation(s) in the past year`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ),
        },
        {
          id: "training",
          label: "Training",
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Certifications</h3>
                <div className="flex flex-wrap gap-2">
                  {driver.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary">
                      {cert}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Required Training</h3>
                <p className="text-sm text-muted-foreground">
                  All training requirements are up to date
                </p>
              </div>
            </div>
          ),
        },
        {
          id: "schedule",
          label: "Schedule",
          content: (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3">Current Schedule</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge>{driver.status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hours This Week:</span>
                    <span>{driver.hoursThisWeek}h</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Shift:</span>
                    <span>{driver.nextShift}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Availability</h3>
                <p className="text-sm text-muted-foreground">
                  Available for regular shifts Monday through Friday
                </p>
              </div>
            </div>
          ),
        },
      ],
    });
  };

  return (
    <HubLayout title="People">
      <div className="flex flex-col h-full p-6 gap-4">
        {/* KPI Strip */}
        <KPIStrip metrics={kpiMetrics} className="flex-shrink-0" />

        {/* Driver Roster DataGrid */}
        <div className="flex-1 min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between pb-4">
              <CardTitle>Driver Roster</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Driver
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 pb-4">
              <DataGrid
                data={drivers}
                columns={columns}
                onRowClick={handleDriverClick}
                enableInspector={false}
                compactMode={true}
                pageSize={20}
                className="h-full"
              />
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section */}
        <div className="flex-shrink-0">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {[
                  { text: "License renewed - James Wilson", time: "1h ago", type: "success" },
                  { text: "Safety training completed - Maria Garcia", time: "3h ago", type: "info" },
                  { text: "Performance review scheduled - Robert Lee", time: "4h ago", type: "warning" },
                  { text: "New driver onboarded - Lisa Anderson", time: "6h ago", type: "success" },
                ].map((activity, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg min-w-fit"
                  >
                    {activity.type === "success" && <CheckCircle className="w-3 h-3 text-green-500" />}
                    {activity.type === "warning" && <Warning className="w-3 h-3 text-orange-500" />}
                    {activity.type === "info" && <TrendUp className="w-3 h-3 text-blue-500" />}
                    <span className="text-sm">{activity.text}</span>
                    <span className="text-xs text-muted-foreground">• {activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </HubLayout>
  );
};

export default PeopleHub;