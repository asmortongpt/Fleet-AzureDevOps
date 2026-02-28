// motion removed - React 19 incompatible
import {
  Layout,
  Filter,
  Plus,
  MoreHorizontal,
  Truck,
  User,
  Clock,
  Search,
  Map as MapIcon,
  Navigation
} from 'lucide-react';
import { useState, useMemo } from 'react';

import { LiveFleetDashboard } from '@/components/dashboard/LiveFleetDashboard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFleetData } from '@/hooks/use-fleet-data';
import { cn } from '@/lib/utils';
import { formatEnum } from '@/utils/format-enum';
import { formatTime } from '@/utils/format-helpers';

export function OperationsWorkspace() {
  const { vehicles, routes } = useFleetData();
  const [activeTab, setActiveTab] = useState('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // active tasks derived from routes
  const tasks = useMemo(() => {
    const sourceData = routes.length > 0 ? routes : [];

    return sourceData.map((item: any, i) => {
      const timeValue = item.startTime || item.start_time || item.updatedAt || item.updated_at
      const formattedTime = formatTime(timeValue)

      return ({
        id: item.id || `task-${i}`,
        title: item.name || item.route_name || 'Route',
        vehicle: item.vehicleNumber || item.number || item.vehicle_id || '—',
        driver: item.driverName || item.driver_name || item.driver_id || '—',
        status: item.status || 'active',
        time: formattedTime,
        type: item.type || 'delivery'
      })
    }).filter(t => {
      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return t.status === 'pending';
      if (activeTab === 'alerts') return t.status === 'delayed';
      if (activeTab === 'active') return t.status === 'active' || t.status === 'in_progress';
      return true;
    }).filter(t => {
      if (!searchQuery) return true;
      return t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.vehicle.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [vehicles, routes, activeTab, searchQuery]);

  return (
    <div className="flex h-full w-full bg-[var(--surface-0)] text-[var(--text-primary)] overflow-hidden relative group/workspace">

      {/* 
        MAIN MAP AREA (Canvas) 
      */}
      <div className="flex-1 relative z-0 flex flex-col">
        {/* Floating Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="p-1.5 rounded-md flex items-center gap-2 border border-[var(--border-subtle)] bg-[var(--surface-1)]">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-9 w-9 p-0 hover:bg-[var(--surface-glass-hover)] rounded-lg", !isSidebarCollapsed && "text-emerald-700 bg-emerald-500/10")}
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <Layout className="h-5 w-5" />
              </Button>
              <Separator orientation="vertical" className="h-5 bg-white/10 mx-1" />
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 hover:bg-[var(--surface-glass-hover)] text-xs font-medium text-[var(--text-secondary)] rounded-lg">
                <MapIcon className="h-4 w-4 text-[var(--text-secondary)]" />
                Map Layers
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 hover:bg-[var(--surface-glass-hover)] text-xs font-medium text-[var(--text-secondary)] rounded-lg">
                <Filter className="h-4 w-4 text-[var(--text-secondary)]" />
                Filters
              </Button>
            </div>
          </div>

          {/* Global Search / Command Bar */}
          <div className="pointer-events-auto w-96">
            <div className="rounded-md flex items-center px-2 h-9 border border-[var(--border-subtle)] bg-[var(--surface-1)] focus-within:ring-1 focus-within:ring-emerald-500/50 transition-all">
              <Search className="h-4 w-4 text-[var(--text-secondary)] mr-3" />
              <input
                className="bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-full"
                placeholder="Search drivers, vehicles, or locations..."
              />
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-[var(--border-default)] bg-white/5 px-2 font-mono text-[10px] font-medium text-[var(--text-secondary)] opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        <LiveFleetDashboard />
      </div>

      {/* 
        RIGHT SIDEBAR (Task/Feed) 
      */}
        {!isSidebarCollapsed && (
          <div
            className="h-full border-l border-[var(--border-subtle)] bg-[var(--surface-1)] relative z-20 flex flex-col"
            style={{ width: 400 }}
          >
            {/* Sidebar Header */}
            <div className="p-5 border-b border-[var(--border-subtle)] flex flex-col gap-2 bg-white/[0.03]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Navigation className="h-5 w-5 text-emerald-800" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm tracking-wide text-[var(--text-primary)]">Dispatch Queue</h2>
                    <p className="text-[10px] text-[var(--text-tertiary)]">Real-time operations feed</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] h-6 px-2">
                    {tasks.length} Active
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-[var(--surface-glass-hover)] rounded-full" aria-label="More options">
                        <MoreHorizontal className="h-4 w-4 text-[var(--text-secondary)]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#161616] border-[var(--border-subtle)] text-[var(--text-secondary)]">
                      <DropdownMenuItem className="focus:bg-white/[0.06]">Export Manifest</DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-white/[0.06]">Batch Assignment</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--text-tertiary)]" />
                  <Input
                    placeholder="Filter queue..."
                    className="bg-white/5 border-[var(--border-default)] h-9 text-xs pl-3 focus-visible:ring-emerald-500/50 rounded-lg placeholder:text-[var(--text-secondary)]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 border border-white/5 hover:bg-[var(--surface-glass-hover)] rounded-lg shrink-0" aria-label="Add new task">
                  <Plus className="h-4 w-4 text-[var(--text-secondary)]" />
                </Button>
              </div>
            </div>

            <div className="px-5 py-3 shrink-0 bg-white/[0.02] border-b border-[var(--border-subtle)]">
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full bg-white/[0.03] p-1 h-9 border border-[var(--border-subtle)] rounded-lg">
                  <TabsTrigger value="all" className="flex-1 text-[10px] uppercase tracking-wider font-semibold h-7 data-[state=active]:bg-white/10 data-[state=active]:text-white text-[var(--text-tertiary)]">All</TabsTrigger>
                  <TabsTrigger value="active" className="flex-1 text-[10px] uppercase tracking-wider font-semibold h-7 data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-700 text-[var(--text-tertiary)]">Active</TabsTrigger>
                  <TabsTrigger value="pending" className="flex-1 text-[10px] uppercase tracking-wider font-semibold h-7 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-[var(--text-tertiary)]">Pending</TabsTrigger>
                  <TabsTrigger value="alerts" className="flex-1 text-[10px] uppercase tracking-wider font-semibold h-7 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-[var(--text-tertiary)]">Alerts</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content Stream */}
            <ScrollArea className="flex-1 p-0 bg-[var(--surface-0)]">
              <div className="p-2 space-y-3">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)] gap-2">
                    <div className="p-3 rounded-full bg-white/5 border border-white/5">
                      <Filter className="h-6 w-6 opacity-50" />
                    </div>
                    <span className="text-xs">No tasks match your filter</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer Status */}
            <div className="p-3 border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-tertiary)] flex justify-between bg-[var(--surface-0)]">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> System Online</span>
              <span>Updated: Just now</span>
            </div>
          </div>
        )}
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  const statusConfig = {
    'active': { color: 'text-emerald-700', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', solid: 'bg-emerald-500/50' },
    'delayed': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', solid: 'bg-red-500' },
    'completed': { color: 'text-emerald-700', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', solid: 'bg-emerald-500' },
    'pending': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', solid: 'bg-amber-500' },
  }[task.status as string] || { color: 'text-[var(--text-secondary)]', bg: 'bg-white/[0.1]/10', border: 'border-[var(--border-strong)]/20', solid: 'bg-white/[0.1]' };

  return (
    <Card className="border border-[var(--border-subtle)] bg-[var(--surface-2)] hover:bg-[#161616] rounded-md p-0 cursor-pointer transition-all group relative overflow-hidden hover:border-[var(--border-default)]">
      {/* Status Stripe */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors", statusConfig.solid)} />

      <div className="p-3 pl-2">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className={cn("text-[10px] h-5 border px-2 uppercase tracking-wider font-bold rounded-md", statusConfig.color, statusConfig.bg, statusConfig.border)}>
            {formatEnum(task.status)}
          </Badge>
          <span className="text-[10px] text-[var(--text-tertiary)] font-mono flex items-center gap-1.5 bg-black/20 px-1.5 py-0.5 rounded">
            <Clock className="h-3 w-3" /> {task.time}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1.5 leading-snug group-hover:text-emerald-700 transition-colors pr-3">
          {task.title}
        </h4>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
            <Truck className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
            <span className="truncate">{task.vehicle}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
            <User className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" />
            <span className="truncate">{task.driver}</span>
          </div>
        </div>

        {/* Hover Actions (Desktop) */}
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-[var(--surface-glass-hover)] text-[var(--text-secondary)] hover:text-white" aria-label="Task actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
