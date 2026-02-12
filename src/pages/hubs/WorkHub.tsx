import {
  ListChecks,
  Wrench,
  MapTrifold,
  Clock,
} from "@phosphor-icons/react";
import { ColumnDef } from "@tanstack/react-table";
import React, { useEffect, useMemo, useState } from "react";

import { DataGrid } from "../../components/common/DataGrid";
import { KPIStrip, KPIMetric } from "../../components/common/KPIStrip";
import { HubLayout } from "../../components/layout/HubLayout";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { secureFetch } from "../../hooks/use-api";
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
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadTasks = async () => {
      try {
        setTasksLoading(true);
        const res = await secureFetch("/api/tasks?limit=200");
        if (!res.ok) throw new Error("Failed to load tasks");
        const payload = await res.json();
        const rows = payload?.data ?? payload ?? [];
        if (!cancelled) {
          setTasks(Array.isArray(rows) ? rows : []);
        }
      } catch {
        if (!cancelled) setTasks([]);
      } finally {
        if (!cancelled) setTasksLoading(false);
      }
    };

    loadTasks();
    return () => {
      cancelled = true;
    };
  }, []);

  const driversById = useMemo(() => {
    return new Map((fleetData.drivers || []).map((driver: any) => [driver.id ?? driver.driver_id, driver]));
  }, [fleetData.drivers]);

  const vehiclesById = useMemo(() => {
    return new Map((fleetData.vehicles || []).map((vehicle: any) => [vehicle.id, vehicle]));
  }, [fleetData.vehicles]);

  const taskData: TaskData[] = useMemo(() => {
    return tasks.map((task) => {
      const assignee = driversById.get(task.assignedToId);
      const assigneeName = assignee ? `${assignee.first_name || ''} ${assignee.last_name || ''}`.trim() : '';
      return {
        id: task.id,
        title: task.title,
        status: task.status || "pending",
        priority: task.priority || "medium",
        assignee: assigneeName,
        dueDate: task.dueDate || '',
      };
    });
  }, [tasks, driversById]);

  const maintenanceData: MaintenanceData[] = useMemo(() => {
    const workOrders = fleetData.workOrders || [];
    return workOrders.map((order: any) => {
      const vehicle = vehiclesById.get(order.vehicle_id || order.vehicleId);
      return {
        id: order.id,
        vehicle: vehicle ? `${vehicle.name || vehicle.make} ${vehicle.model || ''}`.trim() : '',
        type: order.title || order.type || 'Maintenance',
        scheduledDate: order.scheduled_date || order.due_date || order.created_at || '',
        status: order.status || "scheduled",
        technician: order.assigned_to || order.technician || ''
      };
    });
  }, [fleetData.workOrders, vehiclesById]);

  // KPI metrics for the strip
  const kpiMetrics: KPIMetric[] = useMemo(() => {
    const activeTasks = taskData.filter((task) => task.status !== "completed").length;
    const inProgress = taskData.filter((task) => task.status === "in-progress").length;
    const maintenanceDue = maintenanceData.filter((item) => item.status === "overdue").length;
    const routesCount = (fleetData.routes || []).length;

    return [
      {
        id: "active-tasks",
        icon: <ListChecks className="w-3 h-3" />,
        label: "Active Tasks",
        value: activeTasks,
        trend: { value: 0, direction: "up", isPositive: true },
        color: "text-blue-800",
      },
      {
        id: "in-progress",
        icon: <Clock className="w-3 h-3" />,
        label: "In Progress",
        value: inProgress,
        trend: { value: 0, direction: "up", isPositive: true },
        color: "text-orange-500",
      },
      {
        id: "maintenance-due",
        icon: <Wrench className="w-3 h-3" />,
        label: "Maintenance Due",
        value: maintenanceDue,
        trend: { value: 0, direction: "down", isPositive: true },
        color: "text-purple-500",
      },
      {
        id: "route-efficiency",
        icon: <MapTrifold className="w-3 h-3" />,
        label: "Routes",
        value: routesCount,
        trend: { value: 0, direction: "up", isPositive: true },
        color: "text-green-500",
      },
    ];
  }, [taskData, maintenanceData, fleetData.routes]);

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
    <HubLayout title="Work Management">
      <div className="h-full flex flex-col gap-2 p-2">
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

            <div className="flex-1 mt-2 min-h-0">
              <TabsContent value="tasks" className="h-full mt-0">
                <div className="h-full flex flex-col gap-2">
                  {/* Sub-tabs for task views */}
                  <Tabs defaultValue="active" className="h-full flex flex-col">
                    <TabsList className="grid w-fit grid-cols-3">
                      <TabsTrigger value="active">Active Tasks</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                      <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active" className="flex-1 mt-2">
                      <DataGrid
                        data={taskData}
                        columns={taskColumns}
                        inspectorType="task"
                        className="h-full"
                      />
                    </TabsContent>

                    <TabsContent value="completed" className="flex-1 mt-2">
                      <DataGrid
                        data={taskData.filter((t) => t.status === "completed")}
                        columns={taskColumns}
                        inspectorType="task"
                        className="h-full"
                      />
                    </TabsContent>

                    <TabsContent value="analytics" className="flex-1 mt-2">
                      <TaskManagement />
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="maintenance" className="h-full mt-0">
                <div className="h-full flex flex-col gap-2">
                  {/* Sub-tabs for maintenance views */}
                  <Tabs defaultValue="schedule" className="h-full flex flex-col">
                    <TabsList className="grid w-fit grid-cols-3">
                      <TabsTrigger value="schedule">Schedule</TabsTrigger>
                      <TabsTrigger value="requests">Requests</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="schedule" className="flex-1 mt-2">
                      <DataGrid
                        data={maintenanceData}
                        columns={maintenanceColumns}
                        className="h-full"
                      />
                    </TabsContent>

                    <TabsContent value="requests" className="flex-1 mt-2">
                      <DataGrid
                        data={maintenanceData.filter((m) => m.status === "scheduled")}
                        columns={maintenanceColumns}
                        className="h-full"
                      />
                    </TabsContent>

                    <TabsContent value="history" className="flex-1 mt-2">
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
