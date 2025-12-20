import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigation } from '@/contexts/NavigationContext';
import {
    Settings,
    Menu,
    ChevronLeft,
    LogOut,
    Hexagon,
    Search,
    Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils'; // Assuming this utility exists

interface CommandCenterLayoutProps {
    children: React.ReactNode;
}

export function CommandCenterLayout({ children }: CommandCenterLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const navigate = useNavigate();

    // Use global navigation state
    const { activeModule, setActiveModule, visibleNavItems } = useNavigation();

    // Group items by section for better organization
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
                // Also update URL for better DX (optional, can be fully Router driven later)
                // navigate('/' + item.id);
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
        <div className="flex h-screen w-full bg-[#0a0f1c] text-slate-100 overflow-hidden font-sans">
            {/* ... background effects ... */}

            {/* SIDEBAR */}
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

                    {/* Main Section */}
                    <div className="space-y-1">
                        {isSidebarOpen && <div className="px-2 text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Command Center</div>}
                        {mainItems.map(item => <NavButton key={item.id} item={item} />)}
                    </div>

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

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-[#0a0f1c]">
                {/* Header */}
                <header className="h-16 border-b border-white/5 bg-[#0d1221]/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0">
                    {/* Search Bar */}
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search fleet, drivers, or assets..."
                                className="w-full bg-[#151b2d] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4 ml-6">
                        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white hover:bg-white/5 rounded-full">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#0d1221]" />
                        </Button>

                        <div className="h-6 w-px bg-white/10 mx-2" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="pl-2 pr-1 gap-3 h-10 rounded-full hover:bg-white/5 border border-transparent hover:border-white/5">
                                    <div className="flex flex-col items-end hidden md:flex">
                                        <span className="text-sm font-medium text-white leading-none">Admin User</span>
                                        <span className="text-[10px] text-slate-400 leading-none mt-1">Fleet Manager</span>
                                    </div>
                                    <Avatar className="h-8 w-8 border border-white/10">
                                        <AvatarImage src="https://github.com/shadcn.png" />
                                        <AvatarFallback>AD</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-[#1a2030] border-white/10 text-slate-200">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">Profile</DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">Billing</DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-white/5 cursor-pointer">Team</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/5" />
                                <DropdownMenuItem className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer">
                                    <LogOut className="w-4 h-4 mr-2" />
                                    Log out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Content Wrapper */}
                <div className="flex-1 overflow-auto relative p-6">
                    <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="relative z-10 h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
