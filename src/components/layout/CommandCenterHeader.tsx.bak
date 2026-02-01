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
                "h-11 border-b border-border/50 bg-card/95 backdrop-blur-sm z-30 flex items-center justify-between transition-all duration-200",
                isMobile ? "px-3" : "px-2"
            )}>
                {/* Left: CTA Branding */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                        {/* CTA Logo Placeholder - Replace with actual logo when available */}
                        <div className="h-7 px-2 flex items-center justify-center bg-gradient-to-r from-[#FDB813] to-[#FF5722] rounded">
                            <span className="text-white font-bold text-xs tracking-wide">CTA</span>
                        </div>
                        {!isMobile && (
                            <>
                                <div className="h-4 w-px bg-border/50" />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-semibold text-foreground leading-none">ArchonY</span>
                                    <span className="text-[9px] text-muted-foreground leading-none mt-0.5">Intelligent Performance</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Center: Search Bar */}
                <div className={cn(
                    "flex-1 max-w-md mx-4 transition-all duration-300",
                    isSearchFocused && "max-w-lg"
                )}>
                    <div className="relative">
                        <SearchInput
                            value={searchQuery}
                            onChange={setSearchQuery}
                            onDebouncedChange={handleSearch}
                            placeholder={isMobile ? "Search..." : "Search fleet, drivers, or assets..."}
                            ariaLabel="Search fleet, drivers, or assets"
                            className={cn(
                                "[&_input]:rounded-md [&_input]:bg-background/50 [&_input]:border-border/50",
                                "[&_input]:h-7 [&_input]:text-xs",
                                "[&_input]:transition-all [&_input]:duration-200",
                                "[&_input:focus]:bg-background [&_input:focus]:border-secondary/40 [&_input:focus]:shadow-sm [&_input:focus]:shadow-secondary/10"
                            )}
                            onFocus={() => setIsSearchFocused(true)}
                            onBlur={() => setIsSearchFocused(false)}
                        />
                    </div>
                </div>

                {/* Right Actions */}
            <div className="flex items-center gap-1 ml-2">
                {/* Theme Toggle */}
                <ThemeToggle />

                {/* Notifications */}
                <NotificationBell onNavigate={setActiveModule} />

                {/* Separator - hidden on mobile */}
                <div className="hidden sm:block h-5 w-px bg-minimalist-subtle mx-1" />

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "gap-1.5 h-7 rounded-md transition-all duration-200",
                                "hover:bg-minimalist-tertiary border border-transparent hover:border-minimalist-medium",
                                "pl-1 pr-1"
                            )}
                        >
                            <div className="hidden lg:flex flex-col items-end">
                                <span className="text-xs font-medium text-foreground leading-none">Admin User</span>
                                <span className="text-[10px] text-minimalist-secondary leading-none mt-0.5">Fleet Manager</span>
                            </div>
                            <Avatar className="h-7 w-7 border border-minimalist-medium">
                                <AvatarImage src="https://github.com/shadcn.png" alt="Admin User profile picture" />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-[10px]">AD</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-48 bg-minimalist-elevated border-minimalist-medium shadow-sm rounded-md p-0.5"
                        sideOffset={8}
                    >
                        <DropdownMenuLabel className="px-2 py-1.5">
                            <div className="flex flex-col">
                                <span className="font-semibold text-xs">Admin User</span>
                                <span className="text-[10px] text-minimalist-secondary font-normal">admin@fleetops.com</span>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-minimalist-subtle my-0.5" />
                        <DropdownMenuItem
                            className="cursor-pointer rounded-md mx-0.5 px-2 py-1.5 text-xs focus:bg-minimalist-tertiary transition-colors"
                            onClick={() => setActiveModule('profile')}
                        >
                            <User className="w-3 h-3 mr-2 text-minimalist-secondary" />
                            Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer rounded-md mx-0.5 px-2 py-1.5 text-xs focus:bg-minimalist-tertiary transition-colors"
                            onClick={() => setActiveModule('settings')}
                        >
                            <CreditCard className="w-3 h-3 mr-2 text-minimalist-secondary" />
                            Billing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            className="cursor-pointer rounded-md mx-0.5 px-2 py-1.5 text-xs focus:bg-minimalist-tertiary transition-colors"
                            onClick={() => setActiveModule('settings')}
                        >
                            <Users className="w-3 h-3 mr-2 text-minimalist-secondary" />
                            Team
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-minimalist-subtle my-0.5" />
                        <DropdownMenuItem
                            className="cursor-pointer rounded-md mx-0.5 px-2 py-1.5 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors"
                            onClick={handleLogout}
                        >
                            <LogOut className="w-3 h-3 mr-2" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            </div>
            {/* CTA Gradient Bar Accent */}
            <div className="h-0.5 bg-gradient-to-r from-[#FDB813] to-[#FF5722]" aria-hidden="true" />
        </header>
    );
}
