import {
  Truck,
  Wrench,
  Activity,
  CheckCircle,
  TrendUp,
} from "@phosphor-icons/react";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState, useMemo } from "react";

import { DataGrid } from "../../components/common/DataGrid";
import { KPIStrip, KPIMetric } from "../../components/common/KPIStrip";
import { HubLayout } from "../../components/layout/HubLayout";
import { DashcamSurveillance } from "../../components/modules/DashcamSurveillance";
import { MaintenanceHistory } from "../../components/modules/MaintenanceHistory";
import { OBD2Data } from "../../components/modules/OBD2Data";
import { TelematicsInspector } from "../../components/modules/TelematicsInspector";
import { VehicleInspection } from "../../components/modules/VehicleInspection";
import { Badge } from "../../components/ui/badge";
import { Progress } from "../../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";


type FleetModule = "vehicles" | "telemetry" | "maintenance" | "inspections";

interface VehicleData {
  id: string;
  unit: string;
  type: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  status: "active" | "maintenance" | "inactive" | "retired";
  mileage: number;
  fuelType: string;
  lastService: string;
  nextService: string;
  driver: string;
  location: string;
  uptime: number;
}

const FleetHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<FleetModule>("vehicles");

  // Sample vehicle data
  const vehicleData: VehicleData[] = useMemo(
    () => [
      {
        id: "1",
        unit: "Unit 45",
        type: "Box Truck",
        make: "Freightliner",
        model: "Cascadia",
        year: 2022,
        vin: "1FUJBHDR3NLHM1234",
        status: "active",
        mileage: 45230,
        fuelType: "Diesel",
        lastService: "2025-11-15",
        nextService: "2025-12-15",
        driver: "John Smith",
        location: "Miami, FL",
        uptime: 98,
      },
      {
        id: "2",
        unit: "Unit 23",
        type: "Cargo Van",
        make: "Ford",
        model: "Transit",
        year: 2023,
        vin: "1FTBW1XM5PKA12345",
        status: "maintenance",
        mileage: 28150,
        fuelType: "Gasoline",
        lastService: "2025-11-01",
        nextService: "2025-12-01",
        driver: "Jane Doe",
        location: "Service Center",
        uptime: 95,
      },
      {
        id: "3",
        unit: "Unit 67",
        type: "Flatbed",
        make: "International",
        model: "LT625",
        year: 2021,
        vin: "3HSDJAPR4NN123456",
        status: "active",
        mileage: 67890,
        fuelType: "Diesel",
        lastService: "2025-11-20",
        nextService: "2025-12-20",
        driver: "Mike Johnson",
        location: "Atlanta, GA",
        uptime: 97,
      },
      {
        id: "4",
        unit: "Unit 89",
        type: "Refrigerated",
        make: "Volvo",
        model: "VNL",
        year: 2023,
        vin: "4V4NC9EJ5KN123456",
        status: "active",
        mileage: 31200,
        fuelType: "Diesel",
        lastService: "2025-11-10",
        nextService: "2025-12-10",
        driver: "Sarah Lee",
        location: "Orlando, FL",
        uptime: 99,
      },
    ],
    []
  );

  // KPI metrics
  const kpiMetrics: KPIMetric[] = useMemo(
    () => [
      {
        id: "total-vehicles",
        icon: <Truck className="w-5 h-5" />,
        label: "Total Vehicles",
        value: 45,
        trend: { value: 3, direction: "up", isPositive: true },
        color: "text-blue-500",
      },
      {
        id: "in-service",
        icon: <CheckCircle className="w-5 h-5" />,
        label: "In Service",
        value: 42,
        trend: { value: 2, direction: "up", isPositive: true },
        color: "text-green-500",
      },
      {
        id: "maintenance-due",
        icon: <Wrench className="w-5 h-5" />,
        label: "Maintenance Due",
        value: 8,
        trend: { value: 1, direction: "down", isPositive: true },
        color: "text-orange-500",
      },
      {
        id: "avg-uptime",
        icon: <TrendUp className="w-5 h-5" />,
        label: "Avg Uptime",
        value: "97%",
        trend: { value: 2, direction: "up", isPositive: true },
        color: "text-purple-500",
      },
    ],
    []
  );

  // Vehicle columns
  const vehicleColumns: ColumnDef<VehicleData>[] = useMemo(
    () => [
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.unit}</div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
      },
      {
        accessorKey: "make",
        header: "Make/Model",
        cell: ({ row }) => `${row.original.make} ${row.original.model}`,
      },
      {
        accessorKey: "year",
        header: "Year",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "active"
              ? "success"
              : status === "maintenance"
                ? "secondary"
                : status === "inactive"
                  ? "outline"
                  : "destructive";
          return <Badge variant={variant as any}>{status}</Badge>;
        },
      },
      {
        accessorKey: "mileage",
        header: "Mileage",
        cell: ({ row }) => row.original.mileage.toLocaleString(),
      },
      {
        accessorKey: "driver",
        header: "Assigned Driver",
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "uptime",
        header: "Uptime",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Progress value={row.original.uptime} className="w-12 h-2" />
            <span className="text-xs">{row.original.uptime}%</span>
          </div>
        ),
      },
    ],
    []
  );

  // Maintenance columns
  const maintenanceColumns: ColumnDef<VehicleData>[] = useMemo(
    () => [
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.unit}</div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
      },
      {
        accessorKey: "lastService",
        header: "Last Service",
        cell: ({ row }) =>
          new Date(row.original.lastService).toLocaleDateString(),
      },
      {
        accessorKey: "nextService",
        header: "Next Service",
        cell: ({ row }) => {
          const nextDate = new Date(row.original.nextService);
          const daysUntil = Math.floor(
            (nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const isOverdue = daysUntil < 0;
          const isDueSoon = daysUntil <= 7 && daysUntil >= 0;

          return (
            <div className="flex items-center gap-2">
              <span>{nextDate.toLocaleDateString()}</span>
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  Overdue
                </Badge>
              )}
              {isDueSoon && (
                <Badge variant="secondary" className="text-xs">
                  Due Soon
                </Badge>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "mileage",
        header: "Current Mileage",
        cell: ({ row }) => row.original.mileage.toLocaleString(),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "active"
              ? "success"
              : status === "maintenance"
                ? "secondary"
                : "outline";
          return <Badge variant={variant as any}>{status}</Badge>;
        },
      },
    ],
    []
  );

  // Inspection columns
  const inspectionColumns: ColumnDef<VehicleData>[] = useMemo(
    () => [
      {
        accessorKey: "unit",
        header: "Unit",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.unit}</div>
        ),
      },
      {
        accessorKey: "type",
        header: "Vehicle Type",
      },
      {
        accessorKey: "driver",
        header: "Driver",
      },
      {
        accessorKey: "lastService",
        header: "Last Inspection",
        cell: ({ row }) => {
          const date = new Date(row.original.lastService);
          const daysAgo = Math.floor(
            (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
          );
          return (
            <div>
              <div>{date.toLocaleDateString()}</div>
              <div className="text-xs text-muted-foreground">
                {daysAgo} days ago
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Inspection Status",
        cell: ({ row }) => {
          const lastDate = new Date(row.original.lastService);
          const daysSince = Math.floor(
            (Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );
          const status =
            daysSince <= 30 ? "passed" : daysSince <= 45 ? "due" : "overdue";
          const variant =
            status === "passed"
              ? "success"
              : status === "due"
                ? "secondary"
                : "destructive";
          return <Badge variant={variant as any}>{status}</Badge>;
        },
      },
      {
        accessorKey: "mileage",
        header: "Mileage",
        cell: ({ row }) => row.original.mileage.toLocaleString(),
      },
    ],
    []
  );

  return (
    <HubLayout title="Fleet Management" icon={Truck}>
      <div className="h-full flex flex-col gap-4 p-4">
        {/* KPI Strip */}
        <KPIStrip metrics={kpiMetrics} />

        {/* Main content area */}
        <div className="flex-1 min-h-0">
          <Tabs
            value={activeModule}
            onValueChange={(value) => setActiveModule(value as FleetModule)}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full max-w-md grid-cols-4">
              <TabsTrigger value="vehicles" className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                Vehicles
              </TabsTrigger>
              <TabsTrigger value="telemetry" className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                Telemetry
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-1">
                <Wrench className="w-4 h-4" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="inspections" className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Inspections
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 min-h-0">
              {/* Vehicles Tab */}
              <TabsContent value="vehicles" className="h-full mt-0">
                <DataGrid
                  data={vehicleData}
                  columns={vehicleColumns}
                  inspectorType="vehicle"
                  className="h-full"
                />
              </TabsContent>

              {/* Telemetry Tab */}
              <TabsContent value="telemetry" className="h-full mt-0">
                <Tabs defaultValue="obd2" className="h-full flex flex-col">
                  <TabsList className="grid w-fit grid-cols-3">
                    <TabsTrigger value="obd2">OBD2 Data</TabsTrigger>
                    <TabsTrigger value="dashcam">Dashcam Feeds</TabsTrigger>
                    <TabsTrigger value="inspector">Telematics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="obd2" className="flex-1 mt-4">
                    <OBD2Data />
                  </TabsContent>

                  <TabsContent value="dashcam" className="flex-1 mt-4">
                    <DashcamSurveillance />
                  </TabsContent>

                  <TabsContent value="inspector" className="flex-1 mt-4">
                    <TelematicsInspector />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Maintenance Tab */}
              <TabsContent value="maintenance" className="h-full mt-0">
                <Tabs defaultValue="schedule" className="h-full flex flex-col">
                  <TabsList className="grid w-fit grid-cols-2">
                    <TabsTrigger value="schedule">Schedule</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                  </TabsList>

                  <TabsContent value="schedule" className="flex-1 mt-4">
                    <DataGrid
                      data={vehicleData}
                      columns={maintenanceColumns}
                      inspectorType="maintenance"
                      className="h-full"
                    />
                  </TabsContent>

                  <TabsContent value="history" className="flex-1 mt-4">
                    <MaintenanceHistory />
                  </TabsContent>
                </Tabs>
              </TabsContent>

              {/* Inspections Tab */}
              <TabsContent value="inspections" className="h-full mt-0">
                <Tabs defaultValue="dvir" className="h-full flex flex-col">
                  <TabsList className="grid w-fit grid-cols-2">
                    <TabsTrigger value="dvir">DVIR</TabsTrigger>
                    <TabsTrigger value="pre-trip">Pre-Trip</TabsTrigger>
                  </TabsList>

                  <TabsContent value="dvir" className="flex-1 mt-4">
                    <DataGrid
                      data={vehicleData}
                      columns={inspectionColumns}
                      inspectorType="inspection"
                      className="h-full"
                    />
                  </TabsContent>

                  <TabsContent value="pre-trip" className="flex-1 mt-4">
                    <VehicleInspection />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </HubLayout>
  );
};

export default FleetHub;