import React, { useState } from "react";
import { HubLayout } from "../../components/layout/HubLayout";
import { FleetDashboard } from "../../components/modules/FleetDashboard";
import { AssetManagement } from "../../components/modules/AssetManagement";
import { MaintenanceScheduling } from "../../components/modules/MaintenanceScheduling";
import { VehicleTelemetry } from "../../components/modules/VehicleTelemetry";
import { PredictiveMaintenance } from "../../components/modules/PredictiveMaintenance";
import { GarageService } from "../../components/modules/GarageService";
import { useFleetData } from "../../hooks/use-fleet-data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  Car,
  Wrench,
  Engine,
  ChartLine,
  Buildings,
  ClipboardText,
  Plus,
  CalendarPlus,
  Gauge,
  Broadcast,
} from "@phosphor-icons/react";

type FleetModule =
  | "overview"
  | "vehicles"
  | "models"
  | "maintenance"
  | "work-orders"
  | "telemetry";

const FleetHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<FleetModule>("overview");
  const fleetData = useFleetData();

  const renderModule = () => {
    switch (activeModule) {
      case "vehicles":
        return <AssetManagement />;
      case "models":
        return <AssetManagement />;
      case "maintenance":
        return <MaintenanceScheduling />;
      case "work-orders":
        return <GarageService />;
      case "telemetry":
        return <VehicleTelemetry />;
      case "overview":
      default:
        return (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-500" />
                    Total Vehicles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {fleetData.vehicles?.length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Active fleet assets
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-orange-500" />
                    Maintenance Due
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">12</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Scheduled this week
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Engine className="w-5 h-5 text-green-500" />
                    In Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {fleetData.vehicles?.filter((v) => v.status === "active")
                      .length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Operational vehicles
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Fleet Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      title: "Oil change completed",
                      vehicle: "V-1023",
                      time: "2 hours ago",
                      type: "maintenance",
                    },
                    {
                      title: "New vehicle added to fleet",
                      vehicle: "V-2055",
                      time: "4 hours ago",
                      type: "vehicle",
                    },
                    {
                      title: "Tire replacement scheduled",
                      vehicle: "V-3012",
                      time: "5 hours ago",
                      type: "maintenance",
                    },
                    {
                      title: "Vehicle inspection completed",
                      vehicle: "V-4028",
                      time: "6 hours ago",
                      type: "inspection",
                    },
                    {
                      title: "Work order created",
                      vehicle: "V-1056",
                      time: "7 hours ago",
                      type: "work-order",
                    },
                  ].map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {activity.type === "maintenance" && (
                          <Wrench className="w-4 h-4 text-orange-500" />
                        )}
                        {activity.type === "vehicle" && (
                          <Car className="w-4 h-4 text-blue-500" />
                        )}
                        {activity.type === "inspection" && (
                          <ClipboardText className="w-4 h-4 text-green-500" />
                        )}
                        {activity.type === "work-order" && (
                          <Buildings className="w-4 h-4 text-purple-500" />
                        )}
                        <div>
                          <div className="font-medium">{activity.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {activity.vehicle}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChartLine className="w-5 h-5" />
                    Quick Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Average Fuel Level</span>
                      <Badge variant="secondary">67%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Vehicles Under Maintenance</span>
                      <Badge variant="secondary">8</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Active Work Orders</span>
                      <Badge variant="secondary">15</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Telemetry Connected</span>
                      <Badge variant="secondary">42</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Broadcast className="w-5 h-5" />
                    Telemetry Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connected Devices</span>
                      <Badge className="bg-green-100 text-green-700">
                        {fleetData.vehicles?.filter((v) => v.status === "active")
                          .length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Offline Devices</span>
                      <Badge variant="secondary">3</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Diagnostic Codes</span>
                      <Badge className="bg-orange-100 text-orange-700">5</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Last Update</span>
                      <span className="text-sm text-muted-foreground">
                        2 min ago
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <HubLayout title="Fleet">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 320px",
          height: "100%",
          gap: 0,
        }}
      >
        <div style={{ minHeight: 0, overflow: "auto" }}>{renderModule()}</div>

        <div
          style={{
            borderLeft: "1px solid #1e232a",
            minHeight: 0,
            overflow: "auto",
            background: "#0b0f14",
          }}
        >
          <div style={{ padding: "16px" }}>
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Fleet Modules
              </h3>

              <Button
                variant={activeModule === "overview" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("overview")}
              >
                <ChartLine className="w-4 h-4 mr-2" />
                Overview Dashboard
              </Button>

              <Button
                variant={activeModule === "vehicles" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("vehicles")}
              >
                <Car className="w-4 h-4 mr-2" />
                Vehicles Management
              </Button>

              <Button
                variant={activeModule === "models" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("models")}
              >
                <Buildings className="w-4 h-4 mr-2" />
                Vehicle Models
              </Button>

              <Button
                variant={activeModule === "maintenance" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("maintenance")}
              >
                <Wrench className="w-4 h-4 mr-2" />
                Maintenance Scheduling
              </Button>

              <Button
                variant={activeModule === "work-orders" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("work-orders")}
              >
                <ClipboardText className="w-4 h-4 mr-2" />
                Work Orders
              </Button>

              <Button
                variant={activeModule === "telemetry" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("telemetry")}
              >
                <Gauge className="w-4 h-4 mr-2" />
                Telematics/Diagnostics
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <span className="text-sm">Total Vehicles</span>
                  <Badge variant="secondary">
                    {fleetData.vehicles?.length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <span className="text-sm">In Service</span>
                  <Badge variant="secondary">
                    {fleetData.vehicles?.filter((v) => v.status === "active")
                      .length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <span className="text-sm">Under Maintenance</span>
                  <Badge variant="secondary">8</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                  <span className="text-sm">Telematics Active</span>
                  <Badge variant="secondary">
                    {fleetData.vehicles?.filter((v) => v.status === "active")
                      .length || 0}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveModule("vehicles")}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Vehicle
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveModule("maintenance")}
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Schedule Maintenance
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveModule("work-orders")}
                >
                  <ClipboardText className="w-4 h-4 mr-2" />
                  Create Work Order
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setActiveModule("telemetry")}
                >
                  <Gauge className="w-4 h-4 mr-2" />
                  View Telematics
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HubLayout>
  );
};

export default FleetHub;
