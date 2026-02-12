import { LogOut, User, CreditCard, Users } from 'lucide-react';
import { useState, useCallback } from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/common/NotificationBell';
import { SearchInput } from '@/components/shared/SearchInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useNavigation } from '@/contexts/NavigationContext';
import { cn } from '@/lib/utils';
import logger from '@/utils/logger';

interface CommandCenterHeaderProps {
    isMobile?: boolean;
}

export function CommandCenterHeader({ isMobile = false }: CommandCenterHeaderProps) {
    const { setActiveModule } = useNavigation();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
    }, []);

    const handleSearch = useCallback((query: string) => {
        logger.info('Global search:', query);
    }, []);

    return (
        <header className="relative shrink-0">
            <div className={cn(
                "h-16 border-b border-white/20 dark:border-slate-800/20 backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 z-30 flex items-center justify-between transition-all duration-200 shadow-pro-sm",
                isMobile ? "px-4" : "px-4"
            )}>
                {/* Left: CTA Branding */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="flex items-center gap-3">
                        {/* CTA Logo Placeholder - Replace with actual logo when available */}
                        <div className="h-10 px-4 flex items-center justify-center bg-gradient-to-r from-[#F0A000] to-[#DD3903] rounded-lg shadow-md">
                            <span className="text-white font-bold text-sm tracking-wide">CTA</span>
                        </div>
                        {!isMobile && (
                            <>
                                <div className="h-8 w-px bg-border/50" />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-foreground leading-tight">ArchonY</span>
                                    <span className="text-xs text-muted-foreground leading-tight mt-1">Intelligent Performance</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Center: Search Bar */}
                <div className={cn(
                    "flex-1 max-w-lg mx-6 transition-all duration-300",
                    isSearchFocused && "max-w-2xl"
                )}>
                    <div className="relative">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onDebouncedChange={handleSearch}
                            placeholder={isMobile ? "Search..." : "Search fleet, drivers, or assets..."}
                            ariaLabel="Search fleet, drivers, or assets"
                            className={cn(
                                "[&_input]:rounded-lg [&_input]:bg-background/50 [&_input]:border-border/50",
                                "[&_input]:h-10 [&_input]:text-sm [&_input]:px-4",
                                "[&_input]:transition-all [&_input]:duration-200",
                                "[&_input:focus]:bg-background [&_input:focus]:border-secondary/40 [&_input:focus]:shadow-lg [&_input:focus]:shadow-secondary/10"
                            )}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 ml-4">
                    {/* Theme Toggle */}
                    <ThemeToggle />

                    {/* Notifications */}
                    <NotificationBell onNavigate={setActiveModule} />

                    {/* Separator - hidden on mobile */}
                    <div className="hidden sm:block h-8 w-px bg-minimalist-subtle mx-2" />

                    {/* User Menu */}
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "gap-3 h-11 rounded-lg transition-all duration-200",
                                    "hover:bg-minimalist-tertiary border border-transparent hover:border-minimalist-medium",
                                    "pl-3 pr-3"
                                )}
                            >
                                <div className="hidden lg:flex flex-col items-end">
                                    <span className="text-sm font-medium text-foreground leading-none">Admin User</span>
                                    <span className="text-xs text-muted-foreground leading-none mt-1">Fleet Manager</span>
                                </div>
                                <Avatar className="h-9 w-9 border-2 border-minimalist-medium">
                                    <AvatarImage src="https://github.com/shadcn.png" alt="Admin User profile picture" />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">AD</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 bg-minimalist-elevated border-minimalist-medium shadow-lg rounded-lg p-1"
                            sideOffset={8}
                        >
                            <DropdownMenuLabel className="px-3 py-2">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm">Admin User</span>
                                    <span className="text-xs text-muted-foreground font-normal">admin@fleetops.com</span>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-minimalist-subtle my-1" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm focus:bg-minimalist-tertiary transition-colors"
                                onClick={() => setActiveModule('profile')}
                            >
                                <User className="w-4 h-4 mr-3 text-minimalist-secondary" />
                                Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm focus:bg-minimalist-tertiary transition-colors"
                                onClick={() => setActiveModule('settings')}
                            >
                                <CreditCard className="w-4 h-4 mr-3 text-minimalist-secondary" />
                                Billing
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm focus:bg-minimalist-tertiary transition-colors"
                                onClick={() => setActiveModule('settings')}
                            >
                                <Users className="w-4 h-4 mr-3 text-minimalist-secondary" />
                                Team
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-minimalist-subtle my-1" />
                            <DropdownMenuItem
                                className="cursor-pointer rounded-md mx-1 px-3 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-3" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {/* CTA Gradient Bar Accent */}
            <div className="h-1 bg-gradient-to-r from-[#F0A000] to-[#DD3903] shadow-sm" aria-hidden="true" />
        </header>
    );
}
