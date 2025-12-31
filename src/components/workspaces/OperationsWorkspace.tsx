import { motion, AnimatePresence } from 'framer-motion';
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
      status: i % 4 === 0 ? 'delayed' : i % 3 === 0 ? 'completed' : i % 5 === 0 ? 'pending' : 'active',
      time: '10:42 AM',
      type: 'delivery'
    })).filter(t => {
      if (activeTab === 'all') return true;
      if (activeTab === 'pending') return t.status === 'pending';
      if (activeTab === 'alerts') return t.status === 'delayed';
      // For demo, "Active" tab shows active + completed to fill space
      if (activeTab === 'active') return t.status === 'active' || t.status === 'completed';
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
          <div className="pointer-events-auto flex items-center gap-3">
            <div className="glass-panel p-1.5 rounded-xl flex items-center gap-2 shadow-2xl backdrop-blur-xl border-white/10 bg-black/40">
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-9 w-9 p-0 hover:bg-white/10 rounded-lg", !isSidebarCollapsed && "text-blue-400 bg-blue-500/10")}
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                <Layout className="h-5 w-5" />
              </Button>
              <Separator orientation="vertical" className="h-5 bg-white/10 mx-1" />
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 hover:bg-white/10 text-xs font-medium text-slate-300 rounded-lg">
                <MapIcon className="h-4 w-4 text-slate-400" />
                Map Layers
              </Button>
              <Button variant="ghost" size="sm" className="h-9 px-3 gap-2 hover:bg-white/10 text-xs font-medium text-slate-300 rounded-lg">
                <Filter className="h-4 w-4 text-slate-400" />
                Filters
              </Button>
            </div>
          </div>

          {/* Global Search / Command Bar */}
          <div className="pointer-events-auto w-96">
            <div className="glass-panel rounded-xl flex items-center px-4 h-12 shadow-2xl border-white/10 bg-black/40 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all backdrop-blur-xl">
              <Search className="h-4 w-4 text-slate-400 mr-3" />
              <input
                className="bg-transparent border-none outline-none text-sm text-slate-200 placeholder:text-slate-500 w-full"
                placeholder="Search drivers, vehicles, or locations..."
              />
              <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-white/10 bg-white/5 px-2 font-mono text-[10px] font-medium text-slate-400 opacity-100">
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
            className="h-full border-l border-white/5 bg-[#0d1221]/90 backdrop-blur-3xl relative z-20 flex flex-col shadow-2xl"
          >
            {/* Sidebar Header */}
            <div className="p-5 border-b border-white/5 flex flex-col gap-4 bg-gradient-to-b from-white/5 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Navigation className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm tracking-wide text-slate-200">Dispatch Queue</h2>
                    <p className="text-[10px] text-slate-500">Real-time operations feed</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] h-6 px-2">
                    {tasks.length} Active
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 rounded-full" aria-label="More options">
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-[#1a1f2e] border-white/10 text-slate-200">
                      <DropdownMenuItem className="focus:bg-white/10 dark:focus:bg-white/10">Export Manifest</DropdownMenuItem>
                      <DropdownMenuItem className="focus:bg-white/10 dark:focus:bg-white/10">Batch Assignment</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
                  <Input
                    placeholder="Filter queue..."
                    className="bg-white/5 border-white/10 h-9 text-xs pl-8 focus-visible:ring-blue-500/50 rounded-lg placeholder:text-slate-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="icon" variant="ghost" className="h-9 w-9 bg-white/5 border border-white/5 hover:bg-white/10 rounded-lg shrink-0" aria-label="Add new task">
                  <Plus className="h-4 w-4 text-slate-400" />
                </Button>
              </div>
            </div>

            <div className="px-5 py-3 shrink-0 bg-white/[0.02] border-b border-white/5">
              <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="w-full bg-black/40 p-1 h-9 border border-white/5 rounded-lg">
                  <TabsTrigger value="all" className="flex-1 text-[10px] uppercase tracking-wider font-semibold h-7 data-[state=active]:bg-white/10 data-[state=active]:text-white text-slate-500">All</TabsTrigger>
                  <TabsTrigger value="active" className="flex-1 text-[10px] uppercase tracking-wider font-semibold h-7 data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 text-slate-500">Active</TabsTrigger>
                  <TabsTrigger value="pending" className="flex-1 text-[10px] uppercase tracking-wider font-semibold h-7 data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-400 text-slate-500">Pending</TabsTrigger>
                  <TabsTrigger value="alerts" className="flex-1 text-[10px] uppercase tracking-wider font-semibold h-7 data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 text-slate-500">Alerts</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Content Stream */}
            <ScrollArea className="flex-1 p-0 bg-[#0d1221]/50">
              <div className="p-4 space-y-3">
                {tasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {tasks.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-600 gap-2">
                    <div className="p-3 rounded-full bg-white/5 border border-white/5">
                      <Filter className="h-6 w-6 opacity-50" />
                    </div>
                    <span className="text-xs">No tasks match your filter</span>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer Status */}
            <div className="p-3 border-t border-white/5 text-[10px] text-slate-500 flex justify-between bg-[#0a0f1c]">
              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> System Online</span>
              <span>Updated: Just now</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  const statusConfig = {
    'active': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', solid: 'bg-blue-500' },
    'delayed': { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', solid: 'bg-red-500' },
    'completed': { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', solid: 'bg-emerald-500' },
    'pending': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', solid: 'bg-amber-500' },
  }[task.status as string] || { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', solid: 'bg-slate-500' };

  return (
    <Card className="glass-card border border-white/5 bg-[#161b2c]/80 hover:bg-[#1c2236] rounded-xl p-0 cursor-pointer transition-all group relative overflow-hidden shadow-sm hover:shadow-md hover:border-white/10">
      {/* Status Stripe */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 transition-colors", statusConfig.solid)} />

      <div className="p-3 pl-4">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className={cn("text-[10px] h-5 border px-2 uppercase tracking-wider font-bold rounded-md", statusConfig.color, statusConfig.bg, statusConfig.border)}>
            {task.status}
          </Badge>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5 bg-black/20 px-1.5 py-0.5 rounded">
            <Clock className="h-3 w-3" /> {task.time}
          </span>
        </div>

        <h4 className="text-sm font-semibold text-slate-200 mb-1.5 leading-snug group-hover:text-blue-400 transition-colors pr-6">
          {task.title}
        </h4>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
            <Truck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{task.vehicle}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-white/[0.03] p-1.5 rounded-lg border border-white/5">
            <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{task.driver}</span>
          </div>
        </div>

        {/* Hover Actions (Desktop) */}
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
          <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full hover:bg-white/10 text-slate-400 hover:text-white" aria-label="Task actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}