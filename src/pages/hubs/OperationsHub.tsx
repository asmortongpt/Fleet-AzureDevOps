import React, { useState } from "react";
import { HubLayout } from "../../components/layout/HubLayout";
import { GPSTracking } from "../../components/modules/GPSTracking";
import DispatchConsole from "../../components/DispatchConsole";
import { RadioPopover } from "../../components/RadioPopover";
import { FuelManagement } from "../../components/modules/FuelManagement";
import { AssetManagement } from "../../components/modules/AssetManagement";
import { useFleetData } from "../../hooks/use-fleet-data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  MapPin,
  Broadcast,
  GasPump,
  Package,
  ChartLine,
  Truck,
  NavigationArrow,
  Warning,
  CheckCircle,
  Clock,
} from "@phosphor-icons/react";

type OperationsModule =
  | "overview"
  | "tracking"
  | "fuel"
  | "assets";

const OperationsHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<OperationsModule>("overview");
  const fleetData = useFleetData();

  const renderModule = () => {
    switch (activeModule) {
      case "tracking":
        return (
          <div style={{ height: "100%", padding: "16px" }}>
            <GPSTracking
              vehicles={fleetData.vehicles || []}
              facilities={fleetData.facilities || []}
            />
          </div>
        );
      case "fuel":
        return <FuelManagement data={fleetData} />;
      case "assets":
        return <AssetManagement />;
      case "overview":
      default:
        return (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-500" />
                    Active Vehicles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {fleetData.vehicles?.filter(v => v.status === 'active').length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {fleetData.vehicles?.length || 0} total vehicles
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <NavigationArrow className="w-5 h-5 text-green-500" />
                    Pending Dispatches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">8</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    5 assigned, 3 unassigned
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-purple-500" />
                    Today's Routes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">24</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    18 completed, 6 in progress
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Warning className="w-5 h-5 text-orange-500" />
                    Fuel Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">3</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Vehicles below 25% fuel
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fleet Status Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        label: "Vehicles in Transit",
                        value: 15,
                        total: fleetData.vehicles?.length || 0,
                        color: "bg-blue-500",
                      },
                      {
                        label: "Vehicles at Facilities",
                        value: 8,
                        total: fleetData.vehicles?.length || 0,
                        color: "bg-green-500",
                      },
                      {
                        label: "Vehicles Idle",
                        value: 5,
                        total: fleetData.vehicles?.length || 0,
                        color: "bg-yellow-500",
                      },
                      {
                        label: "Vehicles in Maintenance",
                        value: 2,
                        total: fleetData.vehicles?.length || 0,
                        color: "bg-orange-500",
                      },
                    ].map((stat, i) => (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{stat.label}</span>
                          <span className="text-sm font-bold">
                            {stat.value}/{stat.total}
                          </span>
                        </div>
                        <div className="w-full bg-accent/20 rounded-full h-2">
                          <div
                            className={`${stat.color} h-2 rounded-full transition-all`}
                            style={{ width: `${(stat.value / stat.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Operations Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      {
                        title: "Dispatch completed",
                        vehicle: "V-1023",
                        time: "2 minutes ago",
                        type: "dispatch",
                      },
                      {
                        title: "Fuel refill recorded",
                        vehicle: "V-2045",
                        time: "15 minutes ago",
                        type: "fuel",
                      },
                      {
                        title: "Route checkpoint reached",
                        vehicle: "V-3012",
                        time: "28 minutes ago",
                        type: "tracking",
                      },
                      {
                        title: "Asset inspection completed",
                        vehicle: "V-4028",
                        time: "45 minutes ago",
                        type: "asset",
                      },
                      {
                        title: "Emergency alert cleared",
                        vehicle: "V-1056",
                        time: "1 hour ago",
                        type: "dispatch",
                      },
                    ].map((activity, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-lg bg-accent/5 hover:bg-accent/10 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {activity.type === "dispatch" && (
                            <Broadcast className="w-4 h-4 text-blue-500" />
                          )}
                          {activity.type === "fuel" && (
                            <GasPump className="w-4 h-4 text-green-500" />
                          )}
                          {activity.type === "tracking" && (
                            <MapPin className="w-4 h-4 text-purple-500" />
                          )}
                          {activity.type === "asset" && (
                            <Package className="w-4 h-4 text-orange-500" />
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
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Operations Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-blue-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Utilization</span>
                    </div>
                    <div className="text-2xl font-bold">87%</div>
                    <p className="text-xs text-muted-foreground mt-1">+5% vs last week</p>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">On-Time</span>
                    </div>
                    <div className="text-2xl font-bold">94%</div>
                    <p className="text-xs text-muted-foreground mt-1">+2% vs last week</p>
                  </div>
                  <div className="p-4 rounded-lg bg-purple-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <GasPump className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Fuel Efficiency</span>
                    </div>
                    <div className="text-2xl font-bold">8.2 MPG</div>
                    <p className="text-xs text-muted-foreground mt-1">+0.3 vs last week</p>
                  </div>
                  <div className="p-4 rounded-lg bg-orange-500/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium">Avg Response</span>
                    </div>
                    <div className="text-2xl font-bold">12 min</div>
                    <p className="text-xs text-muted-foreground mt-1">-3 min vs last week</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <HubLayout title="Operations">
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
                Operations Modules
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
                variant={activeModule === "tracking" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("tracking")}
              >
                <MapPin className="w-4 h-4 mr-2" />
                Live Tracking
              </Button>

              <Button
                variant={activeModule === "fuel" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("fuel")}
              >
                <GasPump className="w-4 h-4 mr-2" />
                Fuel Management
              </Button>

              <Button
                variant={activeModule === "assets" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("assets")}
              >
                <Package className="w-4 h-4 mr-2" />
                Asset Management
              </Button>

              {/* Radio Console - Compact Popover */}
              <div className="pt-4 border-t border-border">
                <RadioPopover className="w-full" />
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <span className="text-sm">Active Vehicles</span>
                  <Badge variant="secondary">
                    {fleetData.vehicles?.filter(v => v.status === 'active').length || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <span className="text-sm">Pending Dispatches</span>
                  <Badge variant="secondary">8</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10">
                  <span className="text-sm">Today's Routes</span>
                  <Badge variant="secondary">24</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <span className="text-sm">Fuel Alerts</span>
                  <Badge variant="destructive">3</Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Broadcast className="w-4 h-4 mr-2" />
                  Quick Dispatch
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <MapPin className="w-4 h-4 mr-2" />
                  View All Routes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <GasPump className="w-4 h-4 mr-2" />
                  Fuel Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Asset Check
                </Button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                System Status
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>GPS: Online</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Dispatch: Active</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Tracking: Real-time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HubLayout>
  );
};

export default OperationsHub;
