import {
    Settings,
    PanelLeftClose,
    PanelLeft,
    ChevronRight
} from 'lucide-react';
import { useMemo } from 'react';

import { CTAFleetLogo } from '@/components/branding';
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

    const groupedItems = useMemo(() => ({
        hubs: visibleNavItems.filter(item => item.section === 'hubs'),
        main: visibleNavItems.filter(item => item.section === 'main'),
        management: visibleNavItems.filter(item => item.section === 'management'),
        tools: visibleNavItems.filter(item => item.section === 'tools')
    }), [visibleNavItems]);

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
                    "w-full justify-start h-9 rounded-[var(--radius-md)] transition-all duration-[var(--duration-fast)] group/navbtn relative overflow-hidden",
                    isSidebarOpen ? "px-3 gap-3" : "px-0 justify-center",
                    isActive
                        ? "bg-[var(--surface-glass-active)] text-[var(--text-primary)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-glass-hover)]"
                )}
                style={{ animationDelay: `${index * 30}ms` }}
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
            >
                {/* Emerald active indicator bar with glow */}
                <div className={cn(
                    "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full transition-all duration-[var(--duration-normal)]",
                    isActive ? "opacity-100" : "opacity-0"
                )}
                style={{
                    background: 'linear-gradient(180deg, #10b981, #059669)',
                    boxShadow: isActive ? '0 0 8px rgba(16, 185, 129, 0.4)' : 'none',
                }}
                />

                <div className={cn(
                    "w-[18px] h-[18px] flex items-center justify-center shrink-0 transition-colors duration-[var(--duration-fast)]",
                )}
                style={{
                    color: isActive ? 'var(--accent-primary)' : 'inherit',
                }}>
                    {item.icon}
                </div>
                {isSidebarOpen && (
                    <>
                        <span className="font-medium text-[var(--text-sm)] truncate flex-1 text-left">{item.label}</span>
                        <ChevronRight className={cn(
                            "w-3.5 h-3.5 opacity-0 -translate-x-1 transition-all duration-[var(--duration-fast)]",
                            "group-hover/navbtn:opacity-40 group-hover/navbtn:translate-x-0",
                            isActive && "opacity-40"
                        )} />
                    </>
                )}
            </Button>
        );

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

    const NavSection = ({ title, items }: { title: string; items: any[]; accentColor?: string }) => {
        if (items.length === 0) return null;

        return (
            <div className="space-y-0.5">
                {isSidebarOpen && (
                    <h3 className="px-3 py-1.5 text-[var(--text-xs)] font-semibold uppercase tracking-wider"
                        style={{ color: 'var(--text-muted)' }}>
                        {title}
                    </h3>
                )}
                <ul className="space-y-0.5">
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
                    "z-20 flex flex-col h-full transition-all duration-[var(--duration-normal)]",
                    isSidebarOpen ? "w-[var(--sidebar-width)]" : "w-[var(--sidebar-collapsed)]"
                )}
                style={{
                    background: 'linear-gradient(180deg, var(--surface-1) 0%, var(--surface-0) 100%)',
                    borderRight: '1px solid var(--border-subtle)',
                    backdropFilter: 'blur(20px) saturate(1.2)',
                    WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
                }}
            >
                {/* Logo Area */}
                <div className="flex items-center justify-between px-4 shrink-0"
                    style={{
                        height: 'var(--header-height)',
                        borderBottom: '1px solid var(--border-subtle)',
                    }}>
                    {isSidebarOpen ? (
                        <CTAFleetLogo variant="full" showAnimation />
                    ) : (
                        <div className="flex justify-center w-full">
                            <CTAFleetLogo variant="compact" />
                        </div>
                    )}
                </div>

                {/* Nav Links */}
                <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto no-scrollbar" aria-label="Primary sidebar navigation">
                    <NavSection title="Hubs" items={groupedItems.hubs} />
                    <NavSection title="Command Center" items={groupedItems.main} />
                    <NavSection title="Management" items={groupedItems.management} />
                    <NavSection title="Tools" items={groupedItems.tools} />
                </nav>

                {/* Bottom Actions */}
                <div className="p-2 shrink-0 space-y-1"
                    style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    {!isSidebarOpen ? (
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    onClick={() => { navigateTo('settings'); onNavigate?.(); }}
                                    className="w-full justify-center h-9 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-glass-hover)]"
                                    aria-label="Settings"
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right" sideOffset={8}>Settings</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Button
                            variant="ghost"
                            onClick={() => { navigateTo('settings'); onNavigate?.(); }}
                            className="w-full justify-start h-9 rounded-[var(--radius-md)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-glass-hover)] px-3 gap-3"
                            aria-label="Settings"
                        >
                            <Settings className="w-4 h-4 shrink-0" />
                            <span className="font-medium text-[var(--text-sm)]">Settings</span>
                        </Button>
                    )}

                    <div className="hidden lg:block">
                        <Tooltip delayDuration={0}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className={cn(
                                        "w-full h-8 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-tertiary)] hover:bg-[var(--surface-glass-hover)] transition-all duration-[var(--duration-fast)]",
                                        isSidebarOpen ? "justify-start px-3 gap-2" : "justify-center"
                                    )}
                                    aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                                >
                                    {isSidebarOpen ? (
                                        <>
                                            <PanelLeftClose className="w-3.5 h-3.5 shrink-0" />
                                            <span className="text-[var(--text-xs)]">Collapse</span>
                                        </>
                                    ) : (
                                        <PanelLeft className="w-3.5 h-3.5" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            {!isSidebarOpen && (
                                <TooltipContent side="right" sideOffset={8}>Expand sidebar</TooltipContent>
                            )}
                        </Tooltip>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
