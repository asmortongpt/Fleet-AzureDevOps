import {
  MapPin,
  Broadcast,
  GasPump,
  Package,
  Truck,
  NavigationArrow,
  Clock,
  ChevronDown,
  ChevronUp,
} from "@phosphor-icons/react";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState, useMemo } from "react";

import { DataGrid } from "../../components/common/DataGrid";
import { KPIStrip, KPIMetric } from "../../components/common/KPIStrip";
import { HubLayout } from "../../components/layout/HubLayout";
import { UnifiedFleetMap } from "../../components/maps/UnifiedFleetMap";
import { AssetManagement } from "../../components/modules/AssetManagement";
import { FuelManagement } from "../../components/modules/FuelManagement";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../components/ui/collapsible";
import { ResizablePanelGroup, ResizablePanel } from "../../components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useFleetData } from "../../hooks/use-fleet-data";


type OperationsModule = "tracking" | "dispatch" | "fuel" | "assets";

interface VehicleData {
  id: string;
  unit: string;
  driver: string;
  status: "active" | "idle" | "offline" | "maintenance";
  location: string;
  speed: number;
  fuel: number;
  lastUpdate: string;
}

interface DispatchData {
  id: string;
  tripId: string;
  vehicle: string;
  driver: string;
  origin: string;
  destination: string;
  status: "pending" | "en-route" | "completed" | "delayed";
  eta: string;
}

const OperationsHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<OperationsModule>("tracking");
  const [chartCollapsed, setChartCollapsed] = useState(false);
  const fleetData = useFleetData();

  // Sample vehicle tracking data
  const vehicleData: VehicleData[] = useMemo(
    () => [
      {
        id: "1",
        unit: "Unit 45",
        driver: "John Smith",
        status: "active",
        location: "I-95 N, Mile 42",
        speed: 55,
        fuel: 75,
        lastUpdate: "2 min ago",
      },
      {
        id: "2",
        unit: "Unit 23",
        driver: "Jane Doe",
        status: "idle",
        location: "Rest Stop, Exit 15",
        speed: 0,
        fuel: 60,
        lastUpdate: "15 min ago",
      },
      {
        id: "3",
        unit: "Unit 67",
        driver: "Mike Johnson",
        status: "active",
        location: "Highway 301 S",
        speed: 48,
        fuel: 45,
        lastUpdate: "1 min ago",
      },
    ],
    []
  );

  // Sample dispatch data
  const dispatchData: DispatchData[] = useMemo(
    () => [
      {
        id: "1",
        tripId: "TR-2025-001",
        vehicle: "Unit 45",
        driver: "John Smith",
        origin: "Miami, FL",
        destination: "Atlanta, GA",
        status: "en-route",
        eta: "4:30 PM",
      },
      {
        id: "2",
        tripId: "TR-2025-002",
        vehicle: "Unit 23",
        driver: "Jane Doe",
        origin: "Orlando, FL",
        destination: "Tampa, FL",
        status: "pending",
        eta: "6:00 PM",
      },
      {
        id: "3",
        tripId: "TR-2025-003",
        vehicle: "Unit 67",
        driver: "Mike Johnson",
        origin: "Jacksonville, FL",
        destination: "Savannah, GA",
        status: "delayed",
        eta: "7:15 PM",
      },
    ],
    []
  );

  // KPI metrics
  const kpiMetrics: KPIMetric[] = useMemo(
    () => [
      {
        id: "active-trips",
        icon: <Truck className="w-5 h-5" />,
        label: "Active Trips",
        value: 18,
        trend: { value: 5, direction: "up", isPositive: true },
        color: "text-green-500",
      },
      {
        id: "idle-vehicles",
        icon: <Clock className="w-5 h-5" />,
        label: "Idle Vehicles",
        value: 7,
        trend: { value: 2, direction: "down", isPositive: true },
        color: "text-orange-500",
      },
      {
        id: "fuel-alerts",
        icon: <GasPump className="w-5 h-5" />,
        label: "Fuel Alerts",
        value: 3,
        trend: { value: 1, direction: "up", isPositive: false },
        color: "text-red-500",
      },
      {
        id: "route-efficiency",
        icon: <NavigationArrow className="w-5 h-5" />,
        label: "Route Efficiency",
        value: "92%",
        trend: { value: 4, direction: "up", isPositive: true },
        color: "text-blue-500",
      },
    ],
    []
  );

  // Vehicle tracking columns
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
        accessorKey: "driver",
        header: "Driver",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "active"
              ? "success"
              : status === "idle"
                ? "secondary"
                : status === "offline"
                  ? "outline"
                  : "destructive";
          return <Badge variant={variant as any}>{status}</Badge>;
        },
      },
      {
        accessorKey: "location",
        header: "Location",
      },
      {
        accessorKey: "speed",
        header: "Speed",
        cell: ({ row }) => `${row.original.speed} mph`,
      },
      {
        accessorKey: "fuel",
        header: "Fuel",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  row.original.fuel > 50
                    ? "bg-green-500"
                    : row.original.fuel > 25
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${row.original.fuel}%` }}
              />
            </div>
            <span className="text-xs">{row.original.fuel}%</span>
          </div>
        ),
      },
      {
        accessorKey: "lastUpdate",
        header: "Last Update",
      },
    ],
    []
  );

  // Dispatch columns
  const dispatchColumns: ColumnDef<DispatchData>[] = useMemo(
    () => [
      {
        accessorKey: "tripId",
        header: "Trip ID",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.tripId}</div>
        ),
      },
      {
        accessorKey: "vehicle",
        header: "Vehicle",
      },
      {
        accessorKey: "driver",
        header: "Driver",
      },
      {
        accessorKey: "origin",
        header: "Origin",
      },
      {
        accessorKey: "destination",
        header: "Destination",
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "completed"
              ? "success"
              : status === "en-route"
                ? "secondary"
                : status === "delayed"
                  ? "destructive"
                  : "outline";
          return <Badge variant={variant as any}>{status}</Badge>;
        },
      },
      {
        accessorKey: "eta",
        header: "ETA",
      },
    ],
    []
  );

  return (
    <HubLayout title="Operations Center" icon={Broadcast}>
      <div className="h-full flex flex-col gap-4 p-4">
        {/* KPI Strip */}
        <KPIStrip metrics={kpiMetrics} />

        {/* Main content area */}
        <div className="flex-1 min-h-0">
          <Tabs
            value={activeModule}
            onValueChange={(value) => setActiveModule(value as OperationsModule)}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full max-w-lg grid-cols-4">
              <TabsTrigger value="tracking" className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                GPS Tracking
              </TabsTrigger>
              <TabsTrigger value="dispatch" className="flex items-center gap-1">
                <Broadcast className="w-4 h-4" />
                Dispatch
              </TabsTrigger>
              <TabsTrigger value="fuel" className="flex items-center gap-1">
                <GasPump className="w-4 h-4" />
                Fuel
              </TabsTrigger>
              <TabsTrigger value="assets" className="flex items-center gap-1">
                <Package className="w-4 h-4" />
                Assets
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 min-h-0">
              {/* GPS Tracking Tab - Unified Map View */}
              <TabsContent value="tracking" className="h-full mt-0">
                <UnifiedFleetMap
                  vehicles={fleetData.vehicles || []}
                  facilities={fleetData.facilities || []}
                  enableRealTime={true}
                  height="100%"
                />
              </TabsContent>

              {/* Dispatch Board Tab */}
              <TabsContent value="dispatch" className="h-full mt-0">
                <DataGrid
                  data={dispatchData}
                  columns={dispatchColumns}
                  inspectorType="dispatch"
                  className="h-full"
                />
              </TabsContent>

              {/* Fuel Management Tab */}
              <TabsContent value="fuel" className="h-full mt-0">
                <div className="h-full flex flex-col gap-4">
                  <Collapsible open={!chartCollapsed} onOpenChange={setChartCollapsed}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Fuel Analytics</h3>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm">
                          {chartCollapsed ? (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Show Charts
                            </>
                          ) : (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Hide Charts
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="mt-2">
                      <Card className="p-4 h-64">
                        <FuelManagement />
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  <div className="flex-1">
                    <DataGrid
                      data={vehicleData}
                      columns={vehicleColumns.filter(
                        (col) =>
                          col.accessorKey === "unit" ||
                          col.accessorKey === "fuel" ||
                          col.accessorKey === "location"
                      )}
                      inspectorType="fuel"
                      className="h-full"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Asset Tracking Tab */}
              <TabsContent value="assets" className="h-full mt-0">
                <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
                  <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    <div className="h-full p-4 border-r">
                      <h3 className="font-semibold mb-4">Filters</h3>
                      <div className="space-y-2">
                        <Button variant="ghost" className="w-full justify-start">
                          All Assets
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          Vehicles
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          Equipment
                        </Button>
                        <Button variant="ghost" className="w-full justify-start">
                          Tools
                        </Button>
                      </div>
                    </div>
                  </ResizablePanel>
                  <ResizablePanel defaultSize={80}>
                    <div className="h-full p-2">
                      <AssetManagement />
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </HubLayout>
  );
};

export default OperationsHub;