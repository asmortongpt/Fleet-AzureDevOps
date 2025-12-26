import {
    Settings,
    Menu,
    ChevronLeft,
    Hexagon
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useNavigation } from '@/contexts/NavigationContext';
import { cn } from '@/lib/utils';

interface CommandCenterSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
}

export function CommandCenterSidebar({ isSidebarOpen, setIsSidebarOpen }: CommandCenterSidebarProps) {
    const navigate = useNavigate();
    const { activeModule, setActiveModule, visibleNavItems } = useNavigation();

    // Group items by section for better organization
    const hubItems = visibleNavItems.filter(item => item.section === 'hubs');
    const mainItems = visibleNavItems.filter(item => item.section === 'main');
    const managementItems = visibleNavItems.filter(item => item.section === 'management');
    const toolItems = visibleNavItems.filter(item => item.section === 'tools');

    // Helper for rendering nav button
    const NavButton = ({ item }: { item: any }) => (
        <Button
            key={item.id}
            variant="ghost"
            onClick={() => {
                setActiveModule(item.id);
            }}
            className={cn(
                "w-full justify-start h-10 mb-1 rounded-lg transition-all duration-200",
                isSidebarOpen ? "px-3" : "px-0 justify-center",
                activeModule === item.id
                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_10px_rgba(37,99,235,0.1)]"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
            title={!isSidebarOpen ? item.label : undefined}
        >
            <div className={cn("w-5 h-5 flex items-center justify-center", activeModule === item.id ? "text-blue-400" : "text-slate-500")}>
                {item.icon}
            </div>
            {isSidebarOpen && <span className="ml-3 font-medium text-sm truncate">{item.label}</span>}
        </Button>
    );

    return (
        <aside
            className={cn(
                "z-20 flex flex-col h-full bg-[#0d1221]/90 backdrop-blur-xl border-r border-white/5 transition-all duration-300 ease-in-out",
                isSidebarOpen ? "w-64" : "w-20"
            )}
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(37,99,235,0.5)]">
                        <Hexagon className="w-5 h-5 text-white" />
                    </div>
                    {isSidebarOpen && (
                        <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                            FLEET<span className="font-extralight text-slate-500">OPS</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto no-scrollbar">

                {/* Hubs Section - Consolidated Navigation */}
                {hubItems.length > 0 && (
                    <div className="space-y-1">
                        {isSidebarOpen && <div className="px-2 text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Hubs</div>}
                        {hubItems.map(item => <NavButton key={item.id} item={item} />)}
                    </div>
                )}

                {/* Main Section */}
                {mainItems.length > 0 && (
                    <div className="space-y-1">
                        {isSidebarOpen && <div className="px-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 mt-4">Command Center</div>}
                        {mainItems.map(item => <NavButton key={item.id} item={item} />)}
                    </div>
                )}

                {/* Management Section */}
                {managementItems.length > 0 && (
                    <div className="space-y-1">
                        {isSidebarOpen && <div className="px-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 mt-4">Management</div>}
                        {managementItems.map(item => <NavButton key={item.id} item={item} />)}
                    </div>
                )}

                {/* Tools Section */}
                {toolItems.length > 0 && (
                    <div className="space-y-1">
                        {isSidebarOpen && <div className="px-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2 mt-4">Tools</div>}
                        {toolItems.map(item => <NavButton key={item.id} item={item} />)}
                    </div>
                )}

            </nav>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-white/5 shrink-0 space-y-1">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/settings')}
                    className={cn(
                        "w-full justify-start h-11 rounded-xl text-slate-400 hover:text-white hover:bg-white/5",
                        isSidebarOpen ? "px-4" : "px-0 justify-center"
                    )}
                >
                    <Settings className="w-5 h-5" />
                    {isSidebarOpen && <span className="ml-3 font-medium">Settings</span>}
                </Button>
                <div className="pt-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="w-full h-8 text-slate-600 hover:text-slate-300 hover:bg-transparent"
                    >
                        {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </aside>
    );
}
