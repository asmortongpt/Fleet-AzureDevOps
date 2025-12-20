import React, { useState, useMemo } from 'react';
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
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import { useFleetData } from '@/hooks/use-fleet-data';
import { LiveFleetDashboard } from '@/components/dashboard/LiveFleetDashboard';
import { cn } from '@/lib/utils';

export function OperationsWorkspace() {
  const { vehicles, routes } = useFleetData();
  const [activeTab, setActiveTab] = useState('all');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // active tasks generation (mocked from vehicles/routes if real routes are empty)
  const tasks = useMemo(() => {
    // If we have actual routes, use them. Otherwise simulate tasks from active vehicles.
    const sourceData = routes.length > 0 ? routes : vehicles.slice(0, 15);

    return sourceData.map((item: any, i) => ({
      id: item.id || `task-${i}`,
      title: item.name || `Route #${2039 + i} - ${item.destination || 'Downtown Logistics'}`,
      vehicle: item.vehicleNumber || item.number || 'Unassigned',
      driver: item.driverName || 'Pending',
      status: i % 4 === 0 ? 'delayed' : i % 3 === 0 ? 'completed' : 'active',
      time: '10:42 AM',
      type: 'delivery'
    })).filter(t => {
      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return t.status === 'active'; // Map pending tab to active tasks for demo
      if (activeTab === 'alerts') return t.status === 'delayed'; // Map alerts tab to delayed tasks
      return true;
    }).filter(t => {
      if (!searchQuery) return true;
      return t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.vehicle.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [vehicles, routes, activeTab, searchQuery]);

  return (
    <div className="flex h-full w-full bg-[#0a0f1c] text-slate-100 overflow-hidden relative group/workspace">

      {/* 
        MAIN MAP AREA (Canvas) 
      */}
      <div className="flex-1 relative z-0 flex flex-col">
        {/* Floating Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="glass-panel p-1 rounded-lg flex items-center gap-1 shadow-2xl backdrop-blur-xl border-white/10">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 w-8 p-0 hover:bg-white/10", !isSidebarCollapsed && "text-blue-400 bg-blue-500/10")}
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <Layout className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-4 bg-white/10 mx-1" />
              <Button variant="ghost" size="sm" className="h-8 gap-2 hover:bg-white/10 text-xs font-medium text-slate-300">
                <MapIcon className="h-3.5 w-3.5" />
                Map Layers
              </Button>
              <Button variant="ghost" size="sm" className="h-8 gap-2 hover:bg-white/10 text-xs font-medium text-slate-300">
                <Filter className="h-3.5 w-3.5" />
                Filters
              </Button>
            </div>
          </div>

          {/* Global Search / Command Bar */}
          <div className="pointer-events-auto w-96">
            <div className="glass-panel rounded-lg flex items-center px-3 h-10 shadow-2xl border-white/10 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
              <Search className="h-4 w-4 text-slate-500 mr-2" />
              <input
                className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full"
                placeholder="Search drivers, vehicles, or locations..."
              />
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-400 opacity-100">
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
      <AnimatePresence>
        {!isSidebarCollapsed && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 400, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="h-full border-l border-white/5 bg-[#0d1221]/80 backdrop-blur-2xl relative z-20 flex flex-col shadow-2xl"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-white/5 flex flex-col gap-4 bg-gradient-to-b from-white/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="h-4 w-4 text-blue-500" />
                  <h2 className="font-semibold text-sm tracking-wide text-slate-200">Dispatch Queue</h2>
                  <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] h-5 px-1.5">
                    {tasks.length}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/10 rounded-full">
                    <Plus className="h-4 w-4 text-slate-400" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-7 w-7 hover:bg-white/10 rounded-full">
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem>Export Manifest</DropdownMenuItem>
                      <DropdownMenuItem>Batch Assignment</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <Input
                  placeholder="Filter queue..."
                  className="bg-white/5 border-white/10 h-8 text-xs focus-visible:ring-blue-500/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="px-4 py-2 shrink-0 bg-white/[0.02]">
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full bg-black/20 p-1 h-9 border border-white/5">
                  <TabsTrigger value="all" className="flex-1 text-xs h-7 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Active</TabsTrigger>
                  <TabsTrigger value="pending" className="flex-1 text-xs h-7 data-[state=active]:bg-amber-600 data-[state=active]:text-white">Pending</TabsTrigger>
                  <TabsTrigger value="alerts" className="flex-1 text-xs h-7 data-[state=active]:bg-red-600 data-[state=active]:text-white">Alerts</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content Stream */}
            <ScrollArea className="flex-1 p-0">
              <div className="p-3 space-y-2">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    No tasks found matching current filters.
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer Status */}
            <div className="p-2 border-t border-white/5 text-[10px] text-slate-500 flex justify-between bg-black/20">
              <span>System Status: Online</span>
              <span>Last Synced: Just now</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  const statusColor = {
    'active': 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    'delayed': 'text-red-400 border-red-500/30 bg-red-500/10',
    'completed': 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  }[task.status as string] || 'text-slate-400 border-slate-500/30 bg-slate-500/10';

  return (
    <Card className="glass-card border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-md p-3 cursor-pointer transition-all group relative overflow-hidden">
      {/* Status Stripe */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1",
        task.status === 'delayed' ? 'bg-red-500' :
          task.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
      )} />

      <div className="pl-2">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className={cn("text-[10px] h-5 border px-1.5 uppercase tracking-wider font-semibold", statusColor)}>
            {task.status}
          </Badge>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Clock className="h-3 w-3" /> {task.time}
          </span>
        </div>

        <h4 className="text-sm font-medium text-slate-200 mb-1 leading-tight group-hover:text-blue-400 transition-colors">
          {task.title}
        </h4>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-black/20 p-1.5 rounded">
            <Truck className="h-3 w-3 text-slate-500" />
            <span className="truncate">{task.vehicle}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-black/20 p-1.5 rounded">
            <User className="h-3 w-3 text-slate-500" />
            <span className="truncate">{task.driver}</span>
          </div>
        </div>

        {/* Hover Actions (Desktop) */}
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="secondary" className="h-6 w-6 rounded-full">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  )
}