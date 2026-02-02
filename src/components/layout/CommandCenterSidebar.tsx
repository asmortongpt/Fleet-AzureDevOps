import {
    Settings,
    PanelLeftClose,
    PanelLeft,
    ChevronRight
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();
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
                    "w-full justify-start h-10 rounded-lg transition-all duration-200 group/navbtn relative overflow-hidden",
                    isSidebarOpen ? "px-3 gap-3" : "px-0 justify-center",
                    isActive
                        ? "bg-primary/10 text-primary"
                        : "text-minimalist-secondary hover:text-foreground hover:bg-minimalist-tertiary"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
            >
                {/* Active indicator */}
                <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-r-full bg-primary transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-0"
                )} />

                <div className={cn(
                    "w-4 h-4 flex items-center justify-center shrink-0 transition-colors duration-200",
                    isActive ? "text-primary" : "text-minimalist-secondary group-hover/navbtn:text-foreground"
                )}>
                    {item.icon}
                </div>
                {isSidebarOpen && (
                    <>
                        <span className="font-medium text-sm truncate flex-1 text-left">{item.label}</span>
                        <ChevronRight className={cn(
                            "w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-200",
                            "group-hover/navbtn:opacity-50 group-hover/navbtn:translate-x-0",
                            isActive && "opacity-30"
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
                        accentColor === "primary" ? "text-primary/80" : "text-minimalist-tertiary"
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
                    "z-20 flex flex-col h-full bg-minimalist-secondary border-r border-minimalist-medium transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    isSidebarOpen ? "w-56" : "w-16"
                )}
            >
                {/* Logo Area */}
                <div className="h-14 flex items-center justify-between px-4 border-b border-minimalist-subtle shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                        {isSidebarOpen ? (
                            <img
                                src="/logos/logo-horizontal.svg"
                                alt="Fleet Management"
                                className="h-7 w-auto object-contain"
                            />
                        ) : (
                            <img
                                src="/logos/logo-horizontal.svg"
                                alt="Fleet Management"
                                className="h-8 w-8 object-contain"
                            />
                        )}
                    </div>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-3 px-2 space-y-3 overflow-y-auto no-scrollbar" aria-label="Primary sidebar navigation">
                    <NavSection title="Hubs" items={groupedItems.hubs} accentColor="primary" />
                    <NavSection title="Command Center" items={groupedItems.main} />
                    <NavSection title="Management" items={groupedItems.management} />
                    <NavSection title="Tools" items={groupedItems.tools} />
                </nav>

                {/* Bottom Actions */}
                <div className="p-2 border-t border-minimalist-subtle shrink-0 space-y-2">
                    {/* Settings Button */}
                    {!isSidebarOpen ? (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    onClick={() => {
                                        navigate('/settings');
                                        onNavigate?.();
                                    }}
                                    className="w-full justify-center h-10 rounded-lg text-minimalist-secondary hover:text-foreground hover:bg-minimalist-tertiary"
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
                                navigate('/settings');
                                onNavigate?.();
                            }}
                            className="w-full justify-start h-10 rounded-lg text-minimalist-secondary hover:text-foreground hover:bg-minimalist-tertiary px-3 gap-3"
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
                                        "w-full h-9 rounded-lg text-minimalist-secondary hover:text-foreground hover:bg-minimalist-tertiary transition-all duration-200",
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
