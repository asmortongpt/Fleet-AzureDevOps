import {
  ListChecks,
  Wrench,
  MapTrifold,
  ClipboardText,
  Clock,
} from "@phosphor-icons/react";
import { ColumnDef } from "@tanstack/react-table";
import React, { useState, useMemo } from "react";
import { ReactNode } from "react";

import { DataGrid } from "../../components/common/DataGrid";
import { KPIStrip, KPIMetric } from "../../components/common/KPIStrip";
import { HubLayout } from "../../components/layout/HubLayout";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { useFleetData } from "../../hooks/use-fleet-data";

type WorkModule = "tasks" | "maintenance" | "routes";

interface TaskData {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "completed" | "overdue";
  priority: "high" | "medium" | "low";
  assignee: string;
  dueDate: string;
}

interface MaintenanceData {
  id: string;
  vehicle: string;
  type: string;
  scheduledDate: string;
  status: "scheduled" | "in-progress" | "completed" | "overdue";
  technician: string;
}

const TaskManagement: React.FC = () => {
  return <div>Task Management Analytics</div>;
};

const MaintenanceScheduling: React.FC = () => {
  return <div>Maintenance Scheduling History</div>;
};

const RouteManagement: React.FC<{ data: any }> = ({ data }) => {
  return <div>Route Management - Fleet Data: {data?.length || 0} items</div>;
};

const WorkHub: React.FC = () => {
  const [activeModule, setActiveModule] = useState<WorkModule>("tasks");
  const fleetData = useFleetData();

  // Sample data for the consolidated view
  const taskData: TaskData[] = useMemo(
    () => [
      {
        id: "1",
        title: "Pre-trip inspection - Unit 45",
        status: "in-progress",
        priority: "high",
        assignee: "John Smith",
        dueDate: "2025-11-27",
      },
      {
        id: "2",
        title: "Update driver records",
        status: "pending",
        priority: "medium",
        assignee: "Jane Doe",
        dueDate: "2025-11-28",
      },
      {
        id: "3",
        title: "Route optimization review",
        status: "overdue",
        priority: "high",
        assignee: "Mike Johnson",
        dueDate: "2025-11-26",
      },
    ],
    []
  );

  const maintenanceData: MaintenanceData[] = useMemo(
    () => [
      {
        id: "1",
        vehicle: "Unit 45",
        type: "Oil Change",
        scheduledDate: "2025-11-28",
        status: "scheduled",
        technician: "Tom Wilson",
      },
      {
        id: "2",
        vehicle: "Unit 23",
        type: "Tire Rotation",
        scheduledDate: "2025-11-29",
        status: "scheduled",
        technician: "Sarah Lee",
      },
      {
        id: "3",
        vehicle: "Unit 67",
        type: "Brake Inspection",
        scheduledDate: "2025-11-27",
        status: "in-progress",
        technician: "Tom Wilson",
      },
    ],
    []
  );

  // KPI metrics for the strip
  const kpiMetrics: KPIMetric[] = useMemo(
    () => [
      {
        id: "active-tasks",
        icon: <ListChecks className="w-5 h-5" />,
        label: "Active Tasks",
        value: 24,
        trend: { value: 12, direction: "up", isPositive: false },
        color: "text-blue-500",
      },
      {
        id: "in-progress",
        icon: <Clock className="w-5 h-5" />,
        label: "In Progress",
        value: 12,
        trend: { value: 5, direction: "up", isPositive: true },
        color: "text-orange-500",
      },
      {
        id: "maintenance-due",
        icon: <Wrench className="w-5 h-5" />,
        label: "Maintenance Due",
        value: 15,
        trend: { value: 8, direction: "down", isPositive: true },
        color: "text-purple-500",
      },
      {
        id: "route-efficiency",
        icon: <MapTrifold className="w-5 h-5" />,
        label: "Route Efficiency",
        value: "94%",
        trend: { value: 3, direction: "up", isPositive: true },
        color: "text-green-500",
      },
    ],
    []
  );

  // Column definitions for task grid
  const taskColumns: ColumnDef<TaskData>[] = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "Task",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.title}</div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "completed"
              ? "success"
              : status === "in-progress"
              ? "secondary"
              : status === "overdue"
              ? "destructive"
              : "outline";
          return <Badge variant={variant as any}>{status}</Badge>;
        },
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const priority = row.original.priority;
          const variant =
            priority === "high"
              ? "destructive"
              : priority === "medium"
              ? "secondary"
              : "outline";
          return <Badge variant={variant as any}>{priority}</Badge>;
        },
      },
      {
        accessorKey: "assignee",
        header: "Assignee",
        cell: ({ row }) => row.original.assignee,
      },
      {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => new Date(row.original.dueDate).toLocaleDateString(),
      },
    ],
    []
  );

  // Column definitions for maintenance grid
  const maintenanceColumns: ColumnDef<MaintenanceData>[] = useMemo(
    () => [
      {
        accessorKey: "vehicle",
        header: "Vehicle",
        cell: ({ row }) => (
          <div className="font-medium">{row.original.vehicle}</div>
        ),
      },
      {
        accessorKey: "type",
        header: "Service Type",
        cell: ({ row }) => row.original.type,
      },
      {
        accessorKey: "scheduledDate",
        header: "Scheduled",
        cell: ({ row }) =>
          new Date(row.original.scheduledDate).toLocaleDateString(),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const variant =
            status === "completed"
              ? "success"
              : status === "in-progress"
              ? "secondary"
              : status === "overdue"
              ? "destructive"
              : "outline";
          return <Badge variant={variant as any}>{status}</Badge>;
        },
      },
      {
        accessorKey: "technician",
        header: "Technician",
        cell: ({ row }) => row.original.technician,
      },
    ],
    []
  );

  return (
    <HubLayout title="Work Management" icon={ClipboardText}>
      <div className="h-full flex flex-col gap-4 p-4">
        {/* KPI Strip at the top */}
        <KPIStrip metrics={kpiMetrics} />

        {/* Consolidated Tabs for all work modules */}
        <div className="flex-1 min-h-0">
          <Tabs
            value={activeModule}
            onValueChange={(value) => setActiveModule(value as WorkModule)}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="tasks" className="flex items-center gap-1">
                <ListChecks className="w-4 h-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center gap-1">
                <Wrench className="w-4 h-4" />
                Maintenance
              </TabsTrigger>
              <TabsTrigger value="routes" className="flex items-center gap-1">
                <MapTrifold className="w-4 h-4" />
                Routes
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 min-h-0">
              <TabsContent value="tasks" className="h-full mt-0">
                <div className="h-full flex flex-col gap-4">
                  {/* Sub-tabs for task views */}
                  <Tabs defaultValue="active" className="h-full flex flex-col">
                    <TabsList className="grid w-fit grid-cols-3">
                      <TabsTrigger value="active">Active Tasks</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="flex-1 mt-4">
                      <DataGrid
                        data={taskData}
                        columns={taskColumns}
                        inspectorType="task"
                        className="h-full"
                      />
                    </TabsContent>

                    <TabsContent value="completed" className="flex-1 mt-4">
                      <DataGrid
                        data={taskData.filter((t) => t.status === "completed")}
                        columns={taskColumns}
                        inspectorType="task"
                        className="h-full"
                      />
                    </TabsContent>

                    <TabsContent value="analytics" className="flex-1 mt-4">
                      <TaskManagement />
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="maintenance" className="h-full mt-0">
                <div className="h-full flex flex-col gap-4">
                  {/* Sub-tabs for maintenance views */}
                  <Tabs defaultValue="schedule" className="h-full flex flex-col">
                    <TabsList className="grid w-fit grid-cols-3">
                      <TabsTrigger value="schedule">Schedule</TabsTrigger>
                      <TabsTrigger value="requests">Requests</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="schedule" className="flex-1 mt-4">
                      <DataGrid
                        data={maintenanceData}
                        columns={maintenanceColumns}
                        inspectorType="maintenance"
                        className="h-full"
                      />
                    </TabsContent>

                    <TabsContent value="requests" className="flex-1 mt-4">
                      <DataGrid
                        data={maintenanceData.filter((m) => m.status === "scheduled")}
                        columns={maintenanceColumns}
                        inspectorType="maintenance"
                        className="h-full"
                      />
                    </TabsContent>

                    <TabsContent value="history" className="flex-1 mt-4">
                      <MaintenanceScheduling />
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="routes" className="h-full mt-0">
                <RouteManagement data={fleetData} />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </HubLayout>
  );
};

export default WorkHub;