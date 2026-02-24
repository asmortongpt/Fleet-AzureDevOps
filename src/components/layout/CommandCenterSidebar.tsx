import {
    Settings,
    PanelLeftClose,
    PanelLeft,
    ChevronRight
} from 'lucide-react';
import { useMemo } from 'react';

import { ArchonYLogo } from '@/components/branding/ArchonYLogo';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { useNavigation } from '@/contexts/NavigationContext';
import { cn } from '@/lib/utils';

interface CommandCenterSidebarProps {
    isSidebarOpen: boolean;
    setIsSidebarOpen: (isOpen: boolean) => void;
    onNavigate?: () => void;
}

export function CommandCenterSidebar({ isSidebarOpen, setIsSidebarOpen, onNavigate }: CommandCenterSidebarProps) {
    const { activeModule, navigateTo, visibleNavItems } = useNavigation();

    // Group items by section for better organization
    const groupedItems = useMemo(() => ({
        hubs: visibleNavItems.filter(item => item.section === 'hubs'),
        main: visibleNavItems.filter(item => item.section === 'main'),
        management: visibleNavItems.filter(item => item.section === 'management'),
        tools: visibleNavItems.filter(item => item.section === 'tools')
    }), [visibleNavItems]);

    // Helper for rendering nav button with tooltip
    const NavButton = ({ item, index }: { item: any; index: number }) => {
        const isActive = activeModule === item.id;

        const handleClick = () => {
            navigateTo(item.id);
            onNavigate?.();
        };

        const buttonContent = (
            <Button
                variant="ghost"
                onClick={handleClick}
                className={cn(
                    "w-full justify-start h-11 rounded-lg transition-all duration-200 group/navbtn relative overflow-hidden font-semibold",
                    isSidebarOpen ? "px-3 gap-3" : "px-0 justify-center",
                    isActive
                        ? "bg-gradient-to-r from-white/10 to-transparent text-white shadow-md shadow-white/5 border-l-4 border-l-white"
                        : "text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-muted/40 hover:to-transparent"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
            >
                {/* Active indicator with gradient */}
                <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-0"
                )}
                style={{
                    background: isActive ? 'linear-gradient(to bottom, #ffffff, #e0e0e0)' : 'transparent',
                    boxShadow: isActive ? '0 0 12px rgba(255, 255, 255, 0.3)' : 'none'
                }}
                />

                <div className={cn(
                    "w-5 h-5 flex items-center justify-center shrink-0 transition-all duration-200 nav-icon"
                )}
                style={{
                    color: isActive ? '#ffffff' : 'inherit',
                    filter: isActive ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.25))' : 'none'
                }}>
                    {item.icon}
                </div>
                {isSidebarOpen && (
                    <>
                        <span className="font-semibold text-sm truncate flex-1 text-left">{item.label}</span>
                        <ChevronRight className={cn(
                            "w-4 h-4 opacity-0 -translate-x-1 transition-all duration-200",
                            "group-hover/navbtn:opacity-50 group-hover/navbtn:translate-x-0",
                            isActive && "opacity-50"
                        )} />
                    </>
                )}
            </Button>
        );

        // Show tooltip only when sidebar is collapsed
        if (!isSidebarOpen) {
            return (
                <li key={item.id}>
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            {buttonContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8} className="font-medium">
                            {item.label}
                        </TooltipContent>
                    </Tooltip>
                </li>
            );
        }

        return <li key={item.id}>{buttonContent}</li>;
    };

    // Section component
    const NavSection = ({ title, items, accentColor = "muted-foreground" }: { title: string; items: any[]; accentColor?: string }) => {
        if (items.length === 0) return null;

        return (
            <div className="space-y-1">
                {isSidebarOpen && (
                    <h3 className={cn(
                        "px-3 py-1.5 text-xs font-bold uppercase tracking-wider",
                        accentColor === "primary" ? "text-primary/80" : "text-muted-foreground"
                    )}>
                        {title}
                    </h3>
                )}
                <ul className="space-y-1">
                    {items.map((item, index) => <NavButton key={item.id} item={item} index={index} />)}
                </ul>
            </div>
        );
    };

    return (
        <TooltipProvider>
            <div
                aria-label="Application sidebar"
                className={cn(
                    "z-20 flex flex-col h-full backdrop-blur-xl bg-background/95 border-r border-border/50 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-pro",
                    isSidebarOpen ? "w-56" : "w-16"
                )}
            >
                {/* Logo Area */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-border/50 shrink-0">
                    {isSidebarOpen ? (
                        <ArchonYLogo variant="full" showAnimation />
                    ) : (
                        <div className="flex justify-center w-full">
                            <ArchonYLogo variant="compact" />
                        </div>
                    )}
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-3 px-2 space-y-3 overflow-y-auto no-scrollbar" aria-label="Primary sidebar navigation">
                    <NavSection title="Hubs" items={groupedItems.hubs} accentColor="primary" />
                    <NavSection title="Command Center" items={groupedItems.main} />
                    <NavSection title="Management" items={groupedItems.management} />
                    <NavSection title="Tools" items={groupedItems.tools} />
                </nav>

                {/* Bottom Actions */}
                <div className="p-2 border-t border-border/50 shrink-0 space-y-2">
                    {/* Settings Button */}
                    {!isSidebarOpen ? (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        navigateTo('settings');
                                        onNavigate?.();
                                    }}
                                    className="w-full justify-center h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                    aria-label="Settings"
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>
                                Settings
                            </TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                navigateTo('settings');
                                onNavigate?.();
                            }}
                            className="w-full justify-start h-10 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 px-3 gap-3"
                            aria-label="Settings"
                        >
                            <Settings className="w-4 h-4 shrink-0" />
                            <span className="font-medium text-sm">Settings</span>
                        </Button>
                    )}

                    {/* Collapse/Expand Toggle - Hidden on mobile */}
                    <div className="hidden lg:block pt-1">
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className={cn(
                                        "w-full h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200",
                                        isSidebarOpen ? "justify-start px-3 gap-2" : "justify-center"
                                    )}
                                    aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                                >
                                    {isSidebarOpen ? (
                                        <>
                                            <PanelLeftClose className="w-3.5 h-3.5 shrink-0" />
                                            <span className="text-sm">Collapse</span>
                                        </>
                                    ) : (
                                        <PanelLeft className="w-3.5 h-3.5" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            {!isSidebarOpen && (
                                <TooltipContent side="right" sideOffset={8}>
                                    Expand sidebar
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
