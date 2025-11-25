import React, { useState } from "react";
import { HubLayout } from "../../components/layout/HubLayout";
import { TaskManagement } from "../../components/modules/TaskManagement";
import { MaintenanceScheduling } from "../../components/modules/MaintenanceScheduling";
import { RouteManagement } from "../../components/modules/RouteManagement";
import { EnhancedTaskManagement } from "../../components/modules/EnhancedTaskManagement";
import { MaintenanceRequest } from "../../components/modules/MaintenanceRequest";
import { useFleetData } from "../../hooks/use-fleet-data";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  ListChecks,
  Wrench,
  MapTrifold,
  CalendarDots,
  ClipboardText,
  ChartLine,
} from "@phosphor-icons/react";

type WorkModule =
  | "tasks"
  | "maintenance"
  | "routes"
  | "enhanced-tasks"
  | "maintenance-requests"
  | "overview";

const WorkHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<WorkModule>("overview");
  const fleetData = useFleetData();

  const renderModule = () => {
    switch (activeModule) {
      case "tasks":
        return <TaskManagement />;
      case "maintenance":
        return <MaintenanceScheduling />;
      case "routes":
        return <RouteManagement data={fleetData} />;
      case "enhanced-tasks":
        return <EnhancedTaskManagement />;
      case "maintenance-requests":
        return <MaintenanceRequest />;
      case "overview":
      default:
        return (
          <div className="space-y-6 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-blue-500" />
                    Active Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">24</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    12 in progress, 8 pending, 4 overdue
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-orange-500" />
                    Maintenance Scheduled
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">15</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    8 this week, 7 next week
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:bg-accent/5 cursor-pointer transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapTrifold className="w-5 h-5 text-green-500" />
                    Active Routes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">18</div>
                  <p className="text-sm text-muted-foreground mt-2">
                    14 on schedule, 4 delayed
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Work Activity</CardTitle>
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
                      title: "Route optimization updated",
                      vehicle: "V-2045",
                      time: "4 hours ago",
                      type: "route",
                    },
                    {
                      title: "Safety inspection scheduled",
                      vehicle: "V-3012",
                      time: "5 hours ago",
                      type: "task",
                    },
                    {
                      title: "Tire replacement completed",
                      vehicle: "V-4028",
                      time: "6 hours ago",
                      type: "maintenance",
                    },
                    {
                      title: "Route delivery confirmed",
                      vehicle: "V-1056",
                      time: "7 hours ago",
                      type: "route",
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
                        {activity.type === "route" && (
                          <MapTrifold className="w-4 h-4 text-green-500" />
                        )}
                        {activity.type === "task" && (
                          <ListChecks className="w-4 h-4 text-blue-500" />
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
        );
    }
  };

  return (
    <HubLayout title="Work">
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
                Work Modules
              </h3>

              <Button
                variant={activeModule === "overview" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("overview")}
              >
                <ChartLine className="w-4 h-4 mr-2" />
                Overview
              </Button>

              <Button
                variant={activeModule === "tasks" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("tasks")}
              >
                <ListChecks className="w-4 h-4 mr-2" />
                Task Management
              </Button>

              <Button
                variant={
                  activeModule === "enhanced-tasks" ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                onClick={() => setActiveModule("enhanced-tasks")}
              >
                <ClipboardText className="w-4 h-4 mr-2" />
                Enhanced Tasks
              </Button>

              <Button
                variant={activeModule === "routes" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveModule("routes")}
              >
                <MapTrifold className="w-4 h-4 mr-2" />
                Route Management
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
                variant={
                  activeModule === "maintenance-requests" ? "secondary" : "ghost"
                }
                className="w-full justify-start"
                onClick={() => setActiveModule("maintenance-requests")}
              >
                <CalendarDots className="w-4 h-4 mr-2" />
                Maintenance Requests
              </Button>
            </div>

            <div className="mt-8 pt-8 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-500/10">
                  <span className="text-sm">Tasks Today</span>
                  <Badge variant="secondary">12</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <span className="text-sm">Pending Maintenance</span>
                  <Badge variant="secondary">5</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <span className="text-sm">Active Routes</span>
                  <Badge variant="secondary">18</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                  <span className="text-sm">Overdue Items</span>
                  <Badge variant="destructive">4</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HubLayout>
  );
};

export default WorkHub;
